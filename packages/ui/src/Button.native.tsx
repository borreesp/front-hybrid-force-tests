import React from "react";
import { Pressable, Text, PressableProps } from "react-native";
import { cn } from "@thrifty/utils";

type ButtonProps = PressableProps & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  label?: string;
};

const getVariantClasses = (variant: ButtonProps["variant"]) => {
  switch (variant) {
    case "secondary":
      return "bg-slate-800 border border-white/10";
    case "ghost":
      return "bg-transparent border border-white/20";
    default:
      return "bg-cyan-500";
  }
};

const getSizeClasses = (size: ButtonProps["size"]) => {
  switch (size) {
    case "sm":
      return "px-3 py-2";
    case "lg":
      return "px-5 py-4";
    default:
      return "px-4 py-3";
  }
};

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  label,
  className,
  children,
  ...props
}) => {
  const finalClassName = cn(
    "flex flex-row items-center justify-center rounded-lg",
    getVariantClasses(variant),
    getSizeClasses(size),
    className
  );

  // Debug: log className to verify NativeWind is working
  if (__DEV__) {
    console.log("[Button] className:", finalClassName, "variant:", variant);
  }

  return (
    <Pressable
      className={finalClassName}
      {...props}
    >
      {typeof children === "string" || label ? (
        <Text className="text-white font-bold text-base">
          {label ?? children}
        </Text>
      ) : (
        children
      )}
    </Pressable>
  );
};

