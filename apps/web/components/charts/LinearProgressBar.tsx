"use client";
import React from "react";

type Props = {
  value: number;
  label?: string;
  color?: string;
  className?: string;
  variant?: "default" | "compact";
};

export const LinearProgressBar: React.FC<Props> = ({
  value = 0,
  label,
  color = "#FEC94F",
  className,
  variant = "default"
}) => {
  const pct = Math.max(0, Math.min(100, value));

  if (variant === "compact") {
    return (
      <div className={`flex w-full items-center gap-2 text-slate-200 ${className ?? ""}`}>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, background: color }}
          />
        </div>
        <span className="text-[11px] text-slate-300 w-9 text-right">{pct}%</span>
      </div>
    );
  }

  return (
    <div className={`grid gap-1 text-slate-200 ${className ?? ""}`}>
      {label && <div className="text-sm text-slate-300 leading-tight">{label}</div>}
      <div className="flex items-center gap-3">
        <div className="h-3 flex-1 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, background: color }}
          />
        </div>
        <div className="text-xs text-slate-300 w-10 text-right">{pct}%</div>
      </div>
      <div className="text-[11px] text-slate-400 leading-tight">
        <div
          className="h-px w-full"
          style={{ opacity: 0.4, background: "linear-gradient(90deg, rgba(255,255,255,0.1), transparent)" }}
        />
      </div>
    </div>
  );
};
