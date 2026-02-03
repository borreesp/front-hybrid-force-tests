import React from "react";
import { Pressable, Text, View } from "react-native";
import { cn } from "@thrifty/utils";

type ListRowProps = {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  className?: string;
};

export const ListRow: React.FC<ListRowProps> = ({ title, subtitle, right, onPress, className }) => {
  return (
    <Pressable
      className={cn(
        "flex flex-row items-center justify-between rounded-lg border border-white/10 bg-surface/70 px-4 py-3",
        className
      )}
      onPress={onPress}
      disabled={!onPress}
    >
      <View className="flex-1 pr-3">
        <Text className="text-sm font-semibold text-white">{title}</Text>
        {subtitle ? <Text className="text-xs text-slate-400 mt-1">{subtitle}</Text> : null}
      </View>
      {right ? <View>{right}</View> : null}
    </Pressable>
  );
};
