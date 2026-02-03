import React from "react";
import { Text, View } from "react-native";
import { cn } from "@thrifty/utils";

type MetricChipProps = {
  label: string;
  value: string | number;
  className?: string;
};

export const MetricChip: React.FC<MetricChipProps> = ({ label, value, className }) => {
  return (
    <View className={cn("rounded-lg border border-white/10 bg-surface-alt/70 px-3 py-2", className)}>
      <Text className="text-xs text-slate-400">{label}</Text>
      <Text className="text-base font-semibold text-white">{value}</Text>
    </View>
  );
};
