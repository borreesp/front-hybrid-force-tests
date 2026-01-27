import React from "react";
import { cn } from "@thrifty/utils";

type WorkoutBlockCardProps = {
  title: string;
  duration: string;
  steps: string[];
};

export const WorkoutBlockCard: React.FC<WorkoutBlockCardProps> = ({ title, duration, steps }) => {
  return (
    <div className="hover-lift rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md shadow-[0_0_0_0.5px_rgba(255,255,255,0.08)]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Bloque</p>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>
        <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
          {duration}
        </span>
      </div>
      <ul className="mt-3 space-y-2 text-sm text-slate-200">
        {steps.map((step, idx) => (
          <li
            key={idx}
            className={cn(
              "flex items-center gap-2 rounded-lg border border-white/5 bg-white/5 px-3 py-2",
              "shadow-inner shadow-black/30"
            )}
          >
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-brand/20 text-[10px] font-semibold text-brand">
              {idx + 1}
            </span>
            {step}
          </li>
        ))}
      </ul>
    </div>
  );
};
