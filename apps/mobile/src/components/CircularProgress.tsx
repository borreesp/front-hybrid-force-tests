import React from "react";
import { View, Text, useWindowDimensions } from "react-native";
import Svg, { Circle } from "react-native-svg";

export interface CircularProgressProps {
  /** Progress value from 0-100 */
  value: number;
  /** Size of the circle */
  size?: number;
  /** Stroke width */
  strokeWidth?: number;
  /** Color of the progress */
  color?: string;
  /** Background color */
  backgroundColor?: string;
  /** Show value in center */
  showValue?: boolean;
  /** Label to show in center */
  label?: string;
  className?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  size: propSize,
  strokeWidth = 8,
  color = "#22d3ee",
  backgroundColor = "#1e293b",
  showValue = true,
  label,
  className
}) => {
  const { width } = useWindowDimensions();
  // Responsive size: min(propSize || 120, width * 0.45) capped at 180
  const size = Math.min(propSize || 120, Math.min(width * 0.45, 180));

  const clampedValue = Math.min(100, Math.max(0, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (clampedValue / 100) * circumference;

  return (
    <View className={className} style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      {(showValue || label) && (
        <View className="absolute inset-0 items-center justify-center">
          {showValue && (
            <Text className="text-2xl font-bold text-white">
              {Math.round(clampedValue)}%
            </Text>
          )}
          {label && (
            <Text className="mt-1 text-xs text-slate-400">{label}</Text>
          )}
        </View>
      )}
    </View>
  );
};
