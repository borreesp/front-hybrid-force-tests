/**
 * CapacityWidget - Unified component for displaying capacity data.
 * Supports radar chart, progress bars, or both.
 */

import { Pressable, Text, View } from "react-native";
import { Card } from "@thrifty/ui";
import { RadarChart } from "../RadarChart";
import { ProgressBar } from "../ProgressBar";
import { Skeleton } from "../Skeleton";
import { EmptyState } from "../State";
import type {
  CapacityWidgetProps,
  CapacityComparisonMode,
  CapacityDisplayItem,
} from "../../features/capacities";
import { COMPARISON_MODE_OPTIONS, DEFAULT_CAPACITY_PALETTE } from "../../features/capacities";

/**
 * Mode selector component for switching comparison modes
 */
const ModeSelector: React.FC<{
  mode: CapacityComparisonMode;
  onModeChange: (mode: CapacityComparisonMode) => void;
}> = ({ mode, onModeChange }) => (
  <View className="flex-row flex-wrap gap-2 mb-3">
    {COMPARISON_MODE_OPTIONS.map((option) => (
      <Pressable key={option.key} onPress={() => onModeChange(option.key)}>
        <Text
          className={`rounded-full border px-3 py-1 text-xs ${
            mode === option.key
              ? "border-cyan-400/60 bg-cyan-500/20 text-white"
              : "border-white/10 bg-slate-900/60 text-slate-300"
          }`}
        >
          {option.label}
        </Text>
      </Pressable>
    ))}
  </View>
);

/**
 * Radar chart section
 */
const RadarSection: React.FC<{
  items: CapacityDisplayItem[];
  size: number;
}> = ({ items, size }) => {
  if (items.length < 3) {
    return null;
  }

  return (
    <View className="items-center my-3">
      <RadarChart
        data={items.map((item) => ({
          label: item.label,
          value: item.percent,
        }))}
        size={size}
        color="#22d3ee"
        maxValue={100}
      />
    </View>
  );
};

/**
 * Progress bars section
 */
const BarsSection: React.FC<{
  items: CapacityDisplayItem[];
  showRawScore?: boolean;
}> = ({ items, showRawScore = false }) => {
  if (items.length === 0) {
    return <EmptyState title="Sin datos" description="Analiza o aplica un WOD para ver capacidades." />;
  }

  return (
    <View className="gap-3">
      {items.map((item) => (
        <View key={item.key} className="rounded-lg bg-white/5 px-3 py-2">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-slate-200">{item.label}</Text>
            <View className="flex-row items-center gap-2">
              {showRawScore && (
                <Text className="text-xs text-slate-400">({item.rawScore})</Text>
              )}
              <Text className="text-xs text-cyan-200">{item.percent}%</Text>
            </View>
          </View>
          <View className="mt-2 h-2 w-full rounded-full bg-slate-800">
            <View
              className="h-2 rounded-full bg-cyan-400"
              style={{ width: `${item.percent}%` }}
            />
          </View>
          {!item.hasKnownBaseline && (
            <Text className="mt-1 text-[10px] text-slate-500">* Sin baseline conocida</Text>
          )}
        </View>
      ))}
    </View>
  );
};

/**
 * Dashboard-style progress bars (simpler, with colors)
 */
const DashboardBarsSection: React.FC<{
  items: CapacityDisplayItem[];
}> = ({ items }) => {
  if (items.length === 0) {
    return <EmptyState title="Sin datos aun" description="Analiza o aplica un WOD para ver capacidades." />;
  }

  return (
    <View className="gap-3">
      {items.map((item, idx) => (
        <ProgressBar
          key={item.key}
          value={item.percent}
          label={item.label}
          color={item.color ?? DEFAULT_CAPACITY_PALETTE[idx % DEFAULT_CAPACITY_PALETTE.length]}
          showPercentage
        />
      ))}
    </View>
  );
};

/**
 * Loading skeleton
 */
const LoadingSkeleton: React.FC = () => (
  <Card>
    <Skeleton height={16} width="60%" className="mb-2" />
    <Skeleton height={12} width="40%" className="mb-2" />
    <Skeleton height={12} width="80%" />
  </Card>
);

/**
 * CapacityWidget - Main component
 *
 * @example
 * ```tsx
 * // Radar only (Dashboard style)
 * <CapacityWidget variant="radar" mode={mode} items={items} />
 *
 * // Bars only (Athlete style)
 * <CapacityWidget variant="bars" mode={mode} items={items} showModeSelector />
 *
 * // Both (full view)
 * <CapacityWidget variant="both" mode={mode} items={items} />
 * ```
 */
export const CapacityWidget: React.FC<CapacityWidgetProps> = ({
  variant,
  mode,
  onModeChange,
  showModeSelector = false,
  title,
  subtitle,
  items,
  isLoading = false,
  error = null,
  radarSize = 200,
}) => {
  // Handle loading state
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  // Handle error state
  if (error) {
    return (
      <Card>
        <Text className="text-sm text-rose-300">{error}</Text>
      </Card>
    );
  }

  const showRadar = variant === "radar" || variant === "both";
  const showBars = variant === "bars" || variant === "both";

  // Use dashboard-style bars for "radar" variant, athlete-style for "bars"
  const useDashboardBars = variant === "radar" || variant === "both";

  return (
    <View>
      {/* Title */}
      {title && (
        <Text className="text-sm font-medium text-slate-400 mb-2">{title}</Text>
      )}

      {/* Subtitle */}
      {subtitle && (
        <Text className="text-xs text-slate-500 mb-3">{subtitle}</Text>
      )}

      {/* Mode selector */}
      {showModeSelector && onModeChange && (
        <ModeSelector mode={mode} onModeChange={onModeChange} />
      )}

      {/* Radar chart */}
      {showRadar && <RadarSection items={items} size={radarSize} />}

      {/* Progress bars */}
      {showBars && (
        <View className={showRadar ? "mt-3" : ""}>
          {useDashboardBars ? (
            <DashboardBarsSection items={items} />
          ) : (
            <BarsSection items={items} showRawScore />
          )}
        </View>
      )}
    </View>
  );
};

/**
 * Standalone bars widget (for Athlete screen)
 * Pre-configured with mode selector and athlete-style bars
 */
export const CapacityBarsWidget: React.FC<{
  items: CapacityDisplayItem[];
  mode: CapacityComparisonMode;
  onModeChange?: (mode: CapacityComparisonMode) => void;
  isLoading?: boolean;
  error?: string | null;
}> = ({ items, mode, onModeChange, isLoading, error }) => (
  <CapacityWidget
    variant="bars"
    mode={mode}
    onModeChange={onModeChange}
    showModeSelector={Boolean(onModeChange)}
    items={items}
    isLoading={isLoading}
    error={error}
  />
);

/**
 * Standalone radar widget (for Dashboard screen)
 * Pre-configured with radar + dashboard-style bars
 */
export const CapacityRadarWidget: React.FC<{
  items: CapacityDisplayItem[];
  mode: CapacityComparisonMode;
  isLoading?: boolean;
  error?: string | null;
  title?: string;
}> = ({ items, mode, isLoading, error, title }) => (
  <CapacityWidget
    variant="both"
    mode={mode}
    items={items}
    isLoading={isLoading}
    error={error}
    title={title}
  />
);
