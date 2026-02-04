/**
 * Capacity mapper: converts raw API data to normalized structures.
 * Handles multiple API field naming conventions.
 */

import type {
  RawCapacityItem,
  CapacityDisplayItem,
  CapacityComparisonMode,
} from "./capacity.types";
import { normalizeCapacityScore } from "./capacity.normalize";
import { DEFAULT_CAPACITY_PALETTE } from "./capacity.types";

/**
 * Normalize a key by removing diacritics (tildes) for consistent lookups.
 */
const removeDiacritics = (str: string): string => {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

/**
 * Label overrides for prettier display names.
 * Maps normalized keys to display labels.
 */
const LABEL_OVERRIDES: Record<string, string> = {
  fuerza: "Fuerza",
  resistencia: "Resistencia",
  metcon: "Metcon",
  gimnasticos: "Gimnásticos",
  velocidad: "Velocidad",
  "carga muscular": "Carga Muscular",
  potencia: "Potencia",
  flexibilidad: "Flexibilidad",
  coordinacion: "Coordinación",
  agilidad: "Agilidad",
  movilidad: "Movilidad",
  // English aliases
  strength: "Fuerza",
  endurance: "Resistencia",
  gymnastics: "Gimnásticos",
  speed: "Velocidad",
  power: "Potencia",
  flexibility: "Flexibilidad",
  coordination: "Coordinación",
  agility: "Agilidad",
  mobility: "Movilidad",
  conditioning: "Metcon",
};

/**
 * Extract the capacity key from a raw API item.
 * Tries multiple field names in order of preference.
 * Normalizes by removing diacritics for consistent lookups.
 */
export const extractCapacityKey = (item: RawCapacityItem): string => {
  const raw =
    item.capacity ??
    item.capacity_code ??
    item.capacity_name ??
    item.name ??
    item.code ??
    "unknown";

  return removeDiacritics(raw.toString().toLowerCase().trim());
};

/**
 * Extract the display label from a raw API item.
 * Uses label overrides or capitalizes the key.
 */
export const extractCapacityLabel = (item: RawCapacityItem): string => {
  const key = extractCapacityKey(item); // Already normalized (no diacritics)

  // Check for override
  if (LABEL_OVERRIDES[key]) {
    return LABEL_OVERRIDES[key];
  }

  // Try to use capacity_name if available (preserves original formatting)
  if (item.capacity_name) {
    return item.capacity_name;
  }

  // Try to use capacity if available (preserves original formatting)
  if (item.capacity) {
    return item.capacity;
  }

  // Capitalize the key as fallback
  return key.charAt(0).toUpperCase() + key.slice(1);
};

/**
 * Extract the raw score value from an API item.
 */
export const extractRawScore = (item: RawCapacityItem): number => {
  const extracted = item.value ?? item.score ?? 0;

  // DEBUG: Diagnóstico temporal - eliminar después de encontrar el bug
  if (__DEV__) {
    console.log("[CAPACITY_DEBUG] extractRawScore:", {
      itemValue: item.value,
      itemValueType: typeof item.value,
      itemScore: item.score,
      itemScoreType: typeof item.score,
      extracted,
      extractedType: typeof extracted,
      fullItem: item,
    });
  }

  return extracted;
};

/**
 * Map a single raw capacity item to a display item.
 */
export const mapCapacityToDisplay = (
  item: RawCapacityItem,
  athleteLevel: number,
  mode: CapacityComparisonMode,
  color?: string
): CapacityDisplayItem => {
  const key = extractCapacityKey(item);
  const label = extractCapacityLabel(item);
  const rawScore = extractRawScore(item);

  const { percent, expected, isKnown } = normalizeCapacityScore(
    rawScore,
    key,
    athleteLevel,
    mode
  );

  return {
    key,
    label,
    rawScore,
    percent,
    expected,
    hasKnownBaseline: isKnown,
    color,
  };
};

/**
 * Map an array of raw capacity items to display items.
 * Applies color palette and optional limit.
 */
export const mapCapacitiesToDisplay = (
  items: RawCapacityItem[],
  athleteLevel: number,
  mode: CapacityComparisonMode,
  options?: {
    maxItems?: number;
    colorPalette?: string[];
  }
): CapacityDisplayItem[] => {
  const { maxItems, colorPalette = DEFAULT_CAPACITY_PALETTE } = options ?? {};

  // Filter out items with no valid key
  const validItems = items.filter((item) => {
    const key = extractCapacityKey(item);
    return key && key !== "unknown";
  });

  // Limit items if maxItems is specified
  const limitedItems = maxItems ? validItems.slice(0, maxItems) : validItems;

  // Map to display items with colors
  return limitedItems.map((item, index) => {
    const color = colorPalette[index % colorPalette.length];
    return mapCapacityToDisplay(item, athleteLevel, mode, color);
  });
};

/**
 * Deduplicate capacities by key, keeping the one with higher rawScore.
 */
export const deduplicateCapacities = (
  items: CapacityDisplayItem[]
): CapacityDisplayItem[] => {
  const map = new Map<string, CapacityDisplayItem>();

  for (const item of items) {
    const existing = map.get(item.key);
    if (!existing || item.rawScore > existing.rawScore) {
      map.set(item.key, item);
    }
  }

  return Array.from(map.values());
};

/**
 * Sort capacities by percent descending (highest first).
 */
export const sortCapacitiesByPercent = (
  items: CapacityDisplayItem[],
  direction: "asc" | "desc" = "desc"
): CapacityDisplayItem[] => {
  return [...items].sort((a, b) => {
    return direction === "desc" ? b.percent - a.percent : a.percent - b.percent;
  });
};

/**
 * Sort capacities by rawScore descending.
 */
export const sortCapacitiesByRawScore = (
  items: CapacityDisplayItem[],
  direction: "asc" | "desc" = "desc"
): CapacityDisplayItem[] => {
  return [...items].sort((a, b) => {
    return direction === "desc" ? b.rawScore - a.rawScore : a.rawScore - b.rawScore;
  });
};

/**
 * Register a custom label override.
 */
export const registerLabelOverride = (key: string, label: string): void => {
  const normalizedKey = key.toLowerCase().trim();
  LABEL_OVERRIDES[normalizedKey] = label;
};
