import React from "react";
import { cn } from "@thrifty/utils";

type HexStatCardProps = {
  label: string;
  value: string | number;
  subvalue?: string;
  icon?: React.ReactNode;
};

export const HexStatCard: React.FC<HexStatCardProps> = ({ label, value, subvalue, icon }) => {
  return (
    <div className="relative hover-lift">
      <div className="absolute inset-0 blur-lg bg-gradient-to-br from-brand/20 to-indigo-500/10" />
      <div
        className={cn(
          "relative grid gap-2 rounded-2xl border border-white/10 bg-white/5 p-4",
          "shadow-[0_0_0_0.5px_rgba(255,255,255,0.08)] backdrop-blur-md"
        )}
      >
        <div className="flex items-center justify-between">
          <div className="h-12 w-12 grid place-items-center rounded-xl bg-white/5 border border-white/10">
            {icon ?? (
              <svg viewBox="0 0 24 24" className="h-6 w-6 text-brand">
                <path
                  d="M12 3 21 8.5v7L12 21 3 15.5v-7z"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                />
              </svg>
            )}
          </div>
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-brand/30 to-indigo-500/20 blur-xl" />
        </div>
        <div className="text-2xl font-semibold text-white">{value}</div>
        <p className="text-sm text-slate-300">{label}</p>
        {subvalue && <p className="text-xs text-slate-400">{subvalue}</p>}
      </div>
    </div>
  );
};
