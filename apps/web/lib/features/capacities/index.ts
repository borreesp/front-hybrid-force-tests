/**
 * Capacities feature module.
 * Unified system for capacity data fetching, normalization, and display.
 * Mirrors mobile implementation for consistency across platforms.
 */

// Types
export type {
  CapacityComparisonMode,
  RawCapacityItem,
  CapacityDisplayItem,
  CapacityNormalizeConfig,
  UseCapacitiesOptions,
  UseCapacitiesReturn,
} from "./capacity.types";

export {
  COMPARISON_MODE_OPTIONS,
  DEFAULT_CAPACITY_PALETTE,
} from "./capacity.types";

// Normalization
export {
  getCapacityBaseline,
  calculateExpectedCapacity,
  calculateTargetValue,
  normalizeCapacityScore,
  registerCapacityBaseline,
  hasKnownBaseline,
  getKnownCapacityKeys,
} from "./capacity.normalize";

// Mapper
export {
  extractCapacityKey,
  extractCapacityLabel,
  extractRawScore,
  mapCapacityToDisplay,
  mapCapacitiesToDisplay,
  deduplicateCapacities,
  sortCapacitiesByPercent,
  sortCapacitiesByRawScore,
  registerLabelOverride,
} from "./capacity.mapper";

// Hook
export {
  useCapacities,
  getTopCapacity,
  calculateCapacityStats,
} from "./useCapacities";
