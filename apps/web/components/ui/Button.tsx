import React from "react";
import { cn } from "../../lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "destructive";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--ring))] disabled:opacity-60 disabled:cursor-not-allowed";

const variantClass: Record<Variant, string> = {
  primary:
    "bg-[rgb(var(--accent))] text-slate-900 shadow-md shadow-[var(--shadow-sm)] hover:-translate-y-0.5 hover:shadow-lg",
  secondary:
    "bg-[rgb(var(--surface-2))] text-[rgb(var(--text))] border border-[rgb(var(--border))] hover:-translate-y-0.5 hover:border-[rgba(255,255,255,0.16)]",
  ghost: "bg-transparent text-[rgb(var(--text))] hover:bg-white/5 border border-transparent",
  destructive:
    "bg-[rgb(var(--danger))] text-white shadow-sm hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-red-300"
};

const sizeClass: Record<Size, string> = {
  sm: "text-xs px-3 py-2 rounded-[var(--radius-sm)] gap-1",
  md: "text-sm px-4 py-2.5 rounded-[var(--radius-md)] gap-2",
  lg: "text-base px-5 py-3 rounded-[var(--radius-lg)] gap-2"
};

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
};

export function Button({
  variant = "primary",
  size = "md",
  loading,
  leftIcon,
  rightIcon,
  className,
  children,
  ...rest
}: Props) {
  return (
    <button className={cn(base, variantClass[variant], sizeClass[size], className)} {...rest}>
      {leftIcon ? <span className="flex items-center">{leftIcon}</span> : null}
      <span className={cn("flex items-center gap-1", loading ? "opacity-80" : "")}>{children}</span>
      {rightIcon ? <span className="flex items-center">{rightIcon}</span> : null}
    </button>
  );
}
