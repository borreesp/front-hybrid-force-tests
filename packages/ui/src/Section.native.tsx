import React from "react";
import { View, Text } from "react-native";
import { cn } from "@thrifty/utils";

type SectionProps = {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
  id?: string;
};

export const Section: React.FC<SectionProps> = ({
  title,
  description,
  actions,
  children,
  className,
  id
}) => {
  return (
    <View nativeID={id} className={cn("py-3", className)}>
      {(title || description || actions) && (
        <View className="mb-3 flex flex-row items-center justify-between">
          <View className="flex-1">
            {title ? (
              <Text className="text-2xl font-semibold text-white">{title}</Text>
            ) : null}
            {description ? (
              <Text className="text-sm text-slate-300">{description}</Text>
            ) : null}
          </View>
          {actions}
        </View>
      )}
      <View className="gap-3">{children}</View>
    </View>
  );
};
