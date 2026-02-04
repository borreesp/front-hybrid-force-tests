/**
 * Capacity normalization logic.
 * Calculates percentages based on expected values per level and comparison mode.
 * Mirrors mobile implementation for consistency.
 */

import type { CapacityComparisonMode } from "./capacity.types";

/**
 * Known capacity keys with their baseline expected values.
 * These are the "default" values at level 1.
 */
const KNOWN_CAPACITY_BASELINES: Record<string, number> = {
  // Core capacities
  fuerza: 60,
  resistencia: 60,
  metcon: 65,
  gimnasticos: 55,
  velocidad: 60,
  "carga muscular": 60,

  // Aliases (normalized keys that might come from API)
  strength: 60,
  endurance: 60,
  gymnastics: 55,
  speed: 60,
  "muscular load": 60,
  conditioning: 65,

  // Additional capacities (extensible)
  potencia: 60,
  power: 60,
  flexibilidad: 50,
  flexibility: 50,
  coordinacion: 55,
  coordination: 55,
  agilidad: 55,
  agility: 55,
  movilidad: 50,
  mobility: 50,
};

/**
 * Default baseline for unknown capacities.
 * This allows the system to handle new capacities gracefully.
 */
const DEFAULT_BASELINE = 60;

/**
 * Elite level for global comparison mode.
 */
const ELITE_LEVEL = 20;

/**
 * Stretch factor for global comparison (makes global comparison more demanding).
 */
const GLOBAL_STRETCH_FACTOR = 8;

/**
 * Growth rate per level (8% increase per level).
 */
const LEVEL_GROWTH_RATE = 0.08;

/**
 * Clamp a value between min and max, rounded.
 */
const clamp = (value: number, min = 0, max = 100): number => {
  return Math.min(max, Math.max(min, Math.round(value)));
};

/**
 * Normalize a key by removing diacritics (tildes) for consistent lookups.
 */
const removeDiacritics = (str: string): string => {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

/**
 * Get the baseline value for a capacity key.
 * Returns the known baseline or DEFAULT_BASELINE for unknown capacities.
 * Handles keys with diacritics (e.g., "gimnásticos" → "gimnasticos").
 */
export const getCapacityBaseline = (key: string): { baseline: number; isKnown: boolean } => {
  const normalizedKey = removeDiacritics(key.toLowerCase().trim());
  const baseline = KNOWN_CAPACITY_BASELINES[normalizedKey];

  if (baseline !== undefined) {
    return { baseline, isKnown: true };
  }

  return { baseline: DEFAULT_BASELINE, isKnown: false };
};

/**
 * Calculate the expected capacity value for a given level and capacity.
 * Formula: baseline × (1 + (level - 1) × growthRate)
 */
export const calculateExpectedCapacity = (
  capacityKey: string,
  level: number
): { expected: number; isKnown: boolean } => {
  const { baseline, isKnown } = getCapacityBaseline(capacityKey);
  const effectiveLevel = Math.max(1, level);
  const expected = baseline * (1 + (effectiveLevel - 1) * LEVEL_GROWTH_RATE);

  return { expected, isKnown };
};

/**
 * Calculate the target value based on comparison mode.
 */
export const calculateTargetValue = (
  capacityKey: string,
  athleteLevel: number,
  mode: CapacityComparisonMode
): { target: number; isKnown: boolean } => {
  switch (mode) {
    case "global": {
      // Compare against elite level with stretch factor
      const { expected, isKnown } = calculateExpectedCapacity(capacityKey, ELITE_LEVEL);
      return { target: expected * GLOBAL_STRETCH_FACTOR, isKnown };
    }

    case "next_level": {
      // Compare against next level
      const nextLevel = Math.max(1, athleteLevel + 1);
      const { expected, isKnown } = calculateExpectedCapacity(capacityKey, nextLevel);
      return { target: expected, isKnown };
    }

    case "level":
    default: {
      // Compare against current level
      const { expected, isKnown } = calculateExpectedCapacity(capacityKey, athleteLevel);
      return { target: expected, isKnown };
    }
  }
};

/**
 * Normalize a raw score to a percentage (0-100) based on comparison mode.
 */
export const normalizeCapacityScore = (
  rawScore: number,
  capacityKey: string,
  athleteLevel: number,
  mode: CapacityComparisonMode
): { percent: number; expected: number; isKnown: boolean } => {
  const { target, isKnown } = calculateTargetValue(capacityKey, athleteLevel, mode);

  if (!target || target <= 0) {
    return { percent: 0, expected: target, isKnown };
  }

  const percent = clamp((rawScore / target) * 100);

  return { percent, expected: target, isKnown };
};

/**
 * Register a new capacity baseline dynamically.
 * Useful for extending the system with new capacities from the backend.
 */
export const registerCapacityBaseline = (key: string, baseline: number): void => {
  const normalizedKey = key.toLowerCase().trim();
  KNOWN_CAPACITY_BASELINES[normalizedKey] = baseline;
};

/**
 * Check if a capacity key has a known baseline.
 */
export const hasKnownBaseline = (key: string): boolean => {
  const normalizedKey = removeDiacritics(key.toLowerCase().trim());
  return KNOWN_CAPACITY_BASELINES[normalizedKey] !== undefined;
};

/**
 * Get all known capacity keys.
 */
export const getKnownCapacityKeys = (): string[] => {
  return Object.keys(KNOWN_CAPACITY_BASELINES);
};
