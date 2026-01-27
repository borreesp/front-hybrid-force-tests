import React from "react";
import { View, Text } from "react-native";
import { cn } from "@thrifty/utils";

type CardProps = {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
};

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  actions,
  className,
  children
}) => {
  return (
    <View
      className={cn(
        "rounded-xl border border-white/10 bg-surface/80 shadow-soft p-4",
        className
      )}
    >
      {(title || subtitle || actions) && (
        <View className="mb-3 flex flex-row items-start justify-between gap-2">
          <View className="flex-1">
            {title ? (
              <Text className="text-lg font-semibold text-white">{title}</Text>
            ) : null}
            {subtitle ? (
              <Text className="text-sm text-slate-300">{subtitle}</Text>
            ) : null}
          </View>
          {actions}
        </View>
      )}
      {children}
    </View>
  );
};
