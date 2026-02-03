import React from "react";
import { Pressable, Text, PressableProps, StyleSheet } from "react-native";
import { cn } from "@thrifty/utils";

type ButtonProps = PressableProps & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  label?: string;
};

const baseStyles =
  "flex flex-row items-center justify-center rounded-lg font-semibold active:scale-[0.99]";

const variantStyles: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-cyan-500 px-4 py-3", // Cyan brillante - visible en dark theme
  secondary: "bg-slate-800 px-4 py-3 border border-white/10",
  ghost: "bg-transparent px-4 py-3 border border-white/20"
};

const sizeStyles: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "px-3 py-2",
  md: "px-4 py-3",
  lg: "px-5 py-3"
};

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  label,
  className,
  children,
  ...props
}) => {
  return (
    <Pressable
      className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
      {...props}
    >
      {typeof children === "string" || label ? (
        <Text className="text-white font-bold text-base" style={styles.text}>
          {label ?? children}
        </Text>
      ) : (
        children
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  text: {
    color: "#ffffff"
  }
});
