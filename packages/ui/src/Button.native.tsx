import React from "react";
import { Pressable, Text, PressableProps } from "react-native";
import { cn } from "@thrifty/utils";

type ButtonProps = PressableProps & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  label?: string;
};

const baseStyles =
  "flex flex-row items-center justify-center rounded-lg font-semibold active:scale-[0.99]";

const variantStyles: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-brand px-4 py-3",
  secondary: "bg-surface-alt px-4 py-3 border border-white/10",
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
        <Text className="text-white font-semibold">{label ?? children}</Text>
      ) : (
        children
      )}
    </Pressable>
  );
};
