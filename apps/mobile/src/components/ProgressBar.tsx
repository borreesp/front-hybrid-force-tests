import React from "react";
import { View, Text } from "react-native";

export interface ProgressBarProps {
  /** Progress value from 0-100 */
  value: number;
  /** Label to display */
  label?: string;
  /** Color of the progress bar */
  color?: string;
  /** Height of the bar */
  height?: number;
  /** Show percentage text */
  showPercentage?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  label,
  color = "#22d3ee",
  height = 8,
  showPercentage = false,
  className
}) => {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <View className={className}>
      {label && (
        <View className="mb-2 flex-row items-center justify-between">
          <Text className="text-sm text-slate-300">{label}</Text>
          {showPercentage && (
            <Text className="text-xs text-slate-400">{Math.round(clampedValue)}%</Text>
          )}
        </View>
      )}
      <View
        className="w-full overflow-hidden rounded-full bg-slate-800"
        style={{ height }}
      >
        <View
          className="h-full rounded-full"
          style={{
            width: `${clampedValue}%`,
            backgroundColor: color
          }}
        />
      </View>
    </View>
  );
};
