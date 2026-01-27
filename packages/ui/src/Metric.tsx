import React from "react";
import { cn } from "@thrifty/utils";

type MetricProps = {
  label: string;
  value: string | number;
  trend?: "up" | "down" | "neutral";
  hint?: string;
  className?: string;
};

const trendCopy: Record<NonNullable<MetricProps["trend"]>, string> = {
  up: "text-[rgb(var(--success))]",
  down: "text-[rgb(var(--danger))]",
  neutral: "text-[rgb(var(--muted))]"
};

export const Metric: React.FC<MetricProps> = ({
  label,
  value,
  trend = "neutral",
  hint,
  className
}) => {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface-2),0.7)] px-4 py-3 shadow-[var(--shadow-sm)]",
        className
      )}
    >
      <p className="text-xs uppercase tracking-wide text-[rgb(var(--muted))]">{label}</p>
      <div className="flex items-baseline gap-3">
        <span className="text-2xl font-semibold text-[rgb(var(--text))]">{value}</span>
        {hint && (
          <span className={cn("text-sm", trendCopy[trend])}>
            {hint}
          </span>
        )}
      </div>
    </div>
  );
};
