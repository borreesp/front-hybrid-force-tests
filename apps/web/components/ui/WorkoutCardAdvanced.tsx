import React from "react";
import { Button } from "@thrifty/ui";

type WorkoutCardAdvancedProps = {
  title: string;
  focus: string;
  duration: string;
  level: string;
  type?: "cardio" | "strength" | "hybrid";
};

const iconForType: Record<NonNullable<WorkoutCardAdvancedProps["type"]>, React.ReactNode> =
  {
    cardio: (
      <svg viewBox="0 0 24 24" className="h-6 w-6 text-brand">
        <path
          d="M4 12c0-4 3-7 7-7s7 3 7 7-3 7-7 7"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
        />
        <path d="M3 12h4l2-7 3 14 2-7h5" stroke="currentColor" strokeWidth="2" fill="none" />
      </svg>
    ),
    strength: (
      <svg viewBox="0 0 24 24" className="h-6 w-6 text-emerald-400">
        <path
          d="M4 9h3v6H4zm13 0h3v6h-3zM9 7h6v10H9z"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
        />
      </svg>
    ),
    hybrid: (
      <svg viewBox="0 0 24 24" className="h-6 w-6 text-indigo-400">
        <path
          d="M4 7h9l4 5-4 5H4l4-5z"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
        />
        <path d="M14 7h6l-4 5 4 5h-6" stroke="currentColor" strokeWidth="2" fill="none" />
      </svg>
    )
  };

export const WorkoutCardAdvanced: React.FC<WorkoutCardAdvancedProps> = ({
  title,
  focus,
  duration,
  level,
  type = "hybrid"
}) => {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md hover-lift">
      <div className="absolute -right-10 top-0 h-28 w-28 rotate-12 bg-gradient-to-br from-white/10 to-transparent" />
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-white/5 shadow-inner shadow-black/30">
            {iconForType[type]}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <p className="text-sm text-slate-300">{focus}</p>
          </div>
        </div>
        <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
          {level}
        </span>
      </div>
      <div className="mt-4 flex items-center justify-between text-sm text-slate-300">
        <span>Duración: {duration}</span>
        <Button size="sm" variant="primary" className="shadow-lg">
          Iniciar
        </Button>
      </div>
    </div>
  );
};
