"use client";

/**
 * Unified hook for fetching and processing capacity data.
 * Single source of truth for Dashboard and Athlete screens.
 * Mirrors mobile implementation for consistency.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../../api";
import { useAppStore } from "@thrifty/utils";
import type {
  CapacityComparisonMode,
  CapacityDisplayItem,
  RawCapacityItem,
  UseCapacitiesOptions,
  UseCapacitiesReturn,
} from "./capacity.types";
import { mapCapacitiesToDisplay, deduplicateCapacities } from "./capacity.mapper";
import { DEFAULT_CAPACITY_PALETTE } from "./capacity.types";

/**
 * Default options for the hook
 */
const DEFAULT_OPTIONS: Required<UseCapacitiesOptions> = {
  maxItems: 6,
  initialMode: "level",
  fetchOnMount: true,
};

/**
 * Unified hook for capacity data.
 *
 * Features:
 * - Fetches from /athlete/profile with fallback to /users/{id}/capacity-profile
 * - Normalizes data using comparison modes (level, next_level, global)
 * - Handles dynamic capacities from API (not hardcoded)
 * - Single source of truth for all capacity displays
 *
 * @example
 * ```tsx
 * const { items, mode, setMode, isLoading } = useCapacities({ maxItems: 6 });
 *
 * return <AthleteRadar entries={items.map(i => ({ label: i.label, value: i.percent }))} />;
 * ```
 */
export const useCapacities = (options?: UseCapacitiesOptions): UseCapacitiesReturn => {
  const { maxItems, initialMode, fetchOnMount } = { ...DEFAULT_OPTIONS, ...options };
  const user = useAppStore((s) => s.user);

  // State
  const [mode, setMode] = useState<CapacityComparisonMode>(initialMode);
  const [rawCapacities, setRawCapacities] = useState<RawCapacityItem[]>([]);
  const [athleteLevel, setAthleteLevel] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(fetchOnMount);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch capacity data from API
   */
  const fetchCapacities = useCallback(async () => {
    if (!user?.id) {
      setError("Usuario no autenticado");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Primary source: athlete profile
      const profile = await api.getAthleteProfile();

      // Extract athlete level from career data
      const level = profile.career?.level ?? 1;
      setAthleteLevel(level);

      // Check if profile has capacities
      if (profile.capacities && profile.capacities.length > 0) {
        setRawCapacities(profile.capacities as RawCapacityItem[]);
        setIsLoading(false);
        return;
      }

      // Fallback: try to get capacity profile directly
      const isPrivileged = user.role === "COACH" || user.role === "ADMIN";
      const userIdNum = Number(user.id);
      const candidateIds = [
        user.id,
        // For privileged users with ID 1, also try user 2 (dev/demo scenario)
        isPrivileged && userIdNum === 1 ? 2 : undefined,
      ].filter(Boolean) as (number | string)[];

      for (const candidateId of candidateIds) {
        try {
          const capacityResponse = await api.getCapacityProfile(candidateId);
          if (capacityResponse.capacities && capacityResponse.capacities.length > 0) {
            setRawCapacities(capacityResponse.capacities as RawCapacityItem[]);
            setIsLoading(false);
            return;
          }
        } catch {
          // Continue to next candidate
        }
      }

      // No capacities found from any source
      setRawCapacities([]);
    } catch (err: any) {
      setError(err?.message ?? "No se pudieron cargar las capacidades");
      setRawCapacities([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, user?.role]);

  // Fetch on mount if enabled
  useEffect(() => {
    if (fetchOnMount) {
      fetchCapacities();
    }
  }, [fetchCapacities, fetchOnMount]);

  /**
   * Process raw capacities into display items
   * Memoized to recalculate only when dependencies change
   */
  const items = useMemo<CapacityDisplayItem[]>(() => {
    if (rawCapacities.length === 0) {
      return [];
    }

    // Map to display items with current mode and level
    const mapped = mapCapacitiesToDisplay(rawCapacities, athleteLevel, mode, {
      maxItems,
      colorPalette: DEFAULT_CAPACITY_PALETTE,
    });

    // Deduplicate by key (keep highest rawScore)
    const deduplicated = deduplicateCapacities(mapped);

    return deduplicated;
  }, [rawCapacities, athleteLevel, mode, maxItems]);

  return {
    items,
    mode,
    setMode,
    athleteLevel,
    isLoading,
    error,
    refetch: fetchCapacities,
  };
};

/**
 * Get the top capacity from a list of display items.
 * Useful for highlighting the strongest capacity.
 */
export const getTopCapacity = (
  items: CapacityDisplayItem[]
): CapacityDisplayItem | null => {
  if (items.length === 0) return null;

  return items.reduce((top, current) => {
    return current.rawScore > top.rawScore ? current : top;
  }, items[0]);
};

/**
 * Calculate aggregate stats from capacity items.
 */
export const calculateCapacityStats = (items: CapacityDisplayItem[]) => {
  if (items.length === 0) {
    return {
      total: 0,
      average: 0,
      averagePercent: 0,
      count: 0,
      allKnown: true,
    };
  }

  const total = items.reduce((sum, item) => sum + item.rawScore, 0);
  const averagePercent = items.reduce((sum, item) => sum + item.percent, 0) / items.length;
  const allKnown = items.every((item) => item.hasKnownBaseline);

  return {
    total,
    average: total / items.length,
    averagePercent: Math.round(averagePercent),
    count: items.length,
    allKnown,
  };
};
