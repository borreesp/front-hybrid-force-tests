import React from "react";
import { SafeAreaView, ScrollView } from "react-native";
import { cn } from "@thrifty/utils";

type ScreenProps = {
  children: React.ReactNode;
  className?: string;
};

export const Screen: React.FC<ScreenProps> = ({ children, className }) => {
  return (
    <SafeAreaView className={cn("flex-1 bg-surface", className)}>
      <ScrollView className="flex-1 bg-surface px-4 py-4">
        {children}
      </ScrollView>
    </SafeAreaView>
  );
};
