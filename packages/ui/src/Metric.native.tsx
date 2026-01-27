import React from "react";
import { View, Text } from "react-native";
import { cn } from "@thrifty/utils";

type MetricProps = {
  label: string;
  value: string | number;
  trend?: "up" | "down" | "neutral";
  hint?: string;
  className?: string;
};

const trendCopy: Record<NonNullable<MetricProps["trend"]>, string> = {
  up: "text-emerald-400",
  down: "text-rose-400",
  neutral: "text-slate-300"
};

export const Metric: React.FC<MetricProps> = ({
  label,
  value,
  trend = "neutral",
  hint,
  className
}) => {
  return (
    <View
      className={cn(
        "rounded-lg border border-white/10 bg-surface-alt/70 px-4 py-3",
        className
      )}
    >
      <Text className="text-sm text-slate-400">{label}</Text>
      <View className="flex flex-row items-baseline gap-3">
        <Text className="text-2xl font-semibold text-white">{value}</Text>
        {hint ? <Text className={cn("text-sm", trendCopy[trend])}>{hint}</Text> : null}
      </View>
    </View>
  );
};
