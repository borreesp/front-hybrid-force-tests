/**
 * Unified capacity types for the mobile app.
 * Single source of truth for capacity data structures.
 */

/**
 * Comparison modes for capacity normalization
 */
export type CapacityComparisonMode = "level" | "next_level" | "global";

/**
 * Raw capacity item as received from the API
 * Supports multiple field naming conventions
 */
export type RawCapacityItem = {
  id?: number;
  user_id?: number;
  capacity?: string;
  capacity_code?: string;
  capacity_name?: string;
  name?: string;
  code?: string;
  value: number;
  score?: number;
  measured_at?: string;
};

/**
 * Normalized capacity item for display
 * This is the shape consumed by UI components
 */
export type CapacityDisplayItem = {
  /** Stable lowercase key for lookups (e.g., "fuerza", "resistencia") */
  key: string;
  /** Human-readable label for display */
  label: string;
  /** Raw score from the API */
  rawScore: number;
  /** Normalized percentage (0-100) based on comparison mode */
  percent: number;
  /** Expected value for the current comparison (useful for tooltips/debug) */
  expected: number;
  /** Whether this capacity has a known baseline (false = using generic fallback) */
  hasKnownBaseline: boolean;
  /** Color for visualization (optional, assigned by consumer) */
  color?: string;
};

/**
 * Configuration for capacity normalization
 */
export type CapacityNormalizeConfig = {
  mode: CapacityComparisonMode;
  athleteLevel: number;
};

/**
 * Options for the useCapacities hook
 */
export type UseCapacitiesOptions = {
  /** Maximum number of capacities to return (default: 6) */
  maxItems?: number;
  /** Initial comparison mode (default: "level") */
  initialMode?: CapacityComparisonMode;
  /** Whether to fetch on mount (default: true) */
  fetchOnMount?: boolean;
};

/**
 * Return type for the useCapacities hook
 */
export type UseCapacitiesReturn = {
  /** Processed capacity items ready for display */
  items: CapacityDisplayItem[];
  /** Current comparison mode */
  mode: CapacityComparisonMode;
  /** Function to change comparison mode */
  setMode: (mode: CapacityComparisonMode) => void;
  /** Athlete's current level */
  athleteLevel: number;
  /** Loading state */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Refetch data */
  refetch: () => Promise<void>;
};

/**
 * Props for the CapacityWidget component
 */
export type CapacityWidgetVariant = "radar" | "bars" | "both";

export type CapacityWidgetProps = {
  /** Display variant */
  variant: CapacityWidgetVariant;
  /** Comparison mode (controls normalization) */
  mode: CapacityComparisonMode;
  /** Callback when mode changes (optional, for interactive widgets) */
  onModeChange?: (mode: CapacityComparisonMode) => void;
  /** Show mode selector UI */
  showModeSelector?: boolean;
  /** Maximum items to display */
  maxItems?: number;
  /** Title for the section */
  title?: string;
  /** Subtitle/description */
  subtitle?: string;
  /** Pre-processed capacity items (from useCapacities hook) */
  items: CapacityDisplayItem[];
  /** Loading state */
  isLoading?: boolean;
  /** Error message */
  error?: string | null;
  /** Size for radar chart (default: 200) */
  radarSize?: number;
  /** Color palette for items */
  colorPalette?: string[];
};

/**
 * Comparison mode options for UI selectors
 */
export const COMPARISON_MODE_OPTIONS: { key: CapacityComparisonMode; label: string }[] = [
  { key: "level", label: "Tu nivel" },
  { key: "global", label: "Global" },
  { key: "next_level", label: "Nivel siguiente" },
];

/**
 * Default color palette for capacity visualizations
 */
export const DEFAULT_CAPACITY_PALETTE = [
  "#5eead4", // teal
  "#38bdf8", // sky
  "#a78bfa", // violet
  "#f472b6", // pink
  "#facc15", // yellow
  "#22d3ee", // cyan
];
