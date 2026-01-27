import React from "react";
import { Button } from "@thrifty/ui";
import { cn } from "@thrifty/utils";

type WorkoutDetailHeaderProps = {
  name: string;
  type: string;
  duration: number;
  intensity: string;
  recommendedLevel: string;
  onStart?: () => void;
};

export const WorkoutDetailHeader: React.FC<WorkoutDetailHeaderProps> = ({
  name,
  type,
  duration,
  intensity,
  recommendedLevel,
  onStart
}) => {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md",
        "shadow-[0_0_0_0.5px_rgba(255,255,255,0.1)] hover-lift"
      )}
    >
      <div className="absolute -left-16 -top-16 h-48 w-48 rounded-full bg-brand/10 blur-3xl" />
      <div className="absolute -right-10 top-0 h-40 w-40 rotate-12 bg-gradient-to-br from-indigo-500/20 to-transparent" />
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Workout</p>
          <h1 className="text-3xl font-semibold text-white">{name}</h1>
          <p className="mt-1 text-sm text-slate-300">
            Tipo: <span className="text-white">{type}</span> · Intensidad:{" "}
            <span className="text-white capitalize">{intensity}</span> · Nivel:{" "}
            <span className="text-white">{recommendedLevel}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="grid place-items-center rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center shadow-inner shadow-black/30">
            <p className="text-xs text-slate-300">Duración</p>
            <p className="text-xl font-semibold text-white">{duration} min</p>
          </div>
          <Button variant="primary" size="md" onClick={onStart}>
            Iniciar
          </Button>
        </div>
      </div>
    </div>
  );
};
