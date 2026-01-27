import React from "react";
import { cn } from "@thrifty/utils";

type HexMetricCardProps = {
  value: string | number;
  label: string;
  hint?: string;
  tone?: "blue" | "green" | "violet";
};

const toneMap: Record<NonNullable<HexMetricCardProps["tone"]>, string> = {
  blue: "from-brand to-brand/60 border-brand/40",
  green: "from-emerald-400 to-emerald-500/70 border-emerald-400/50",
  violet: "from-indigo-400 to-indigo-500/70 border-indigo-400/50"
};

export const HexMetricCard: React.FC<HexMetricCardProps> = ({
  value,
  label,
  hint,
  tone = "blue"
}) => {
  return (
    <div className="relative hover-lift">
      <div className="absolute inset-0 blur-xl opacity-40 bg-gradient-to-br from-brand/30 to-indigo-500/20" />
      <div
        className={cn(
          "relative overflow-hidden rounded-[18px] border bg-white/5 backdrop-blur-md",
          "border-white/10 shadow-[0_0_0_0.5px_rgba(255,255,255,0.08)]"
        )}
      >
        <div className="absolute -right-10 -top-16 h-36 w-36 rotate-12 bg-gradient-to-br from-white/5 to-white/0" />
        <div className="px-5 py-4">
          <div
            className={cn(
              "mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg",
              toneMap[tone]
            )}
          >
            <div className="relative h-12 w-12">
              <svg viewBox="0 0 100 100" className="h-12 w-12 text-white/80">
                <path
                  d="M50 5 90 27v46L50 95 10 73V27z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="6"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="absolute inset-1 rounded-[12px] bg-white/5 blur" />
            </div>
          </div>
          <div className="text-3xl font-semibold text-white">{value}</div>
          <p className="mt-1 text-sm text-slate-300">{label}</p>
          {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
        </div>
      </div>
    </div>
  );
};
