import React from "react";
import { cn } from "../../lib/cn";

type Tone = "default" | "success" | "warning" | "danger" | "muted";

const toneClass: Record<Tone, string> = {
  default: "bg-white/10 text-[rgb(var(--text))] border border-[rgb(var(--border))]",
  success: "bg-[rgba(var(--success),0.12)] text-[rgb(var(--success))] border border-[rgba(var(--success),0.35)]",
  warning: "bg-[rgba(var(--warning),0.12)] text-[rgb(var(--warning))] border border-[rgba(var(--warning),0.35)]",
  danger: "bg-[rgba(var(--danger),0.12)] text-[rgb(var(--danger))] border border-[rgba(var(--danger),0.35)]",
  muted: "bg-white/5 text-[rgb(var(--muted))] border border-[rgb(var(--border))]"
};

type Props = {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
  pill?: boolean;
};

export function Badge({ children, tone = "default", className, pill = true }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide",
        pill ? "rounded-full" : "rounded-[var(--radius-sm)]",
        toneClass[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
