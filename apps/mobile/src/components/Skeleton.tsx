import React from "react";
import { View } from "react-native";
import { cn } from "@thrifty/utils";

type SkeletonProps = {
  height?: number;
  width?: number | string;
  className?: string;
};

export const Skeleton: React.FC<SkeletonProps> = ({ height = 16, width = "100%", className }) => {
  return (
    <View
      className={cn("rounded-md bg-white/10", className)}
      style={{ height, width }}
    />
  );
};
