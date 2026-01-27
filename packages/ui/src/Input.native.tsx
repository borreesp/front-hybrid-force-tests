import React from "react";
import { Text, TextInput, TextInputProps, View } from "react-native";
import { cn } from "@thrifty/utils";

type InputProps = TextInputProps & {
  label?: string;
  hint?: string;
  className?: string;
};

export const Input: React.FC<InputProps> = ({ label, hint, className, ...props }) => {
  return (
    <View className="mb-2">
      {label ? <Text className="text-sm text-slate-200 mb-1">{label}</Text> : null}
      <TextInput
        className={cn(
          "w-full rounded-lg border border-white/10 bg-surface-alt/80 px-3 py-2 text-slate-50",
          className
        )}
        placeholderTextColor="#94a3b8"
        {...props}
      />
      {hint ? <Text className="text-xs text-slate-400 mt-1">{hint}</Text> : null}
    </View>
  );
};
