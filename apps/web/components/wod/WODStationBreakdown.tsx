"use client";
import React from "react";

export type StationCard = {
  id: number | string;
  title: string;
  duration: number | null;
  steps: string[];
  muscle: string;
  metabolic: string;
  compare: string;
};

export const WODStationBreakdown: React.FC<{ stations: StationCard[] }> = ({ stations }) => {
  return (
    <section className="rounded-2xl bg-slate-900/70 p-6 ring-1 ring-white/5 transition-all duration-300">
      <div className="mb-4">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Secuencias</p>
        <h2 className="text-xl font-semibold text-white">Carrera + estaciones comparadas con HYROX</h2>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {stations.map((s, idx) => (
          <div key={s.id} className="flex h-full flex-col rounded-xl border border-white/10 bg-white/5 p-4 transition hover:-translate-y-1 hover:border-cyan-400/40">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Estacion {idx + 1}</span>
              <span className="rounded-full bg-cyan-500/15 px-2 py-1 text-cyan-100">{s.compare}</span>
            </div>
            <h3 className="mt-2 text-lg font-semibold text-white">{s.title}</h3>
            <p className="text-sm text-slate-300">{s.metabolic || ""}</p>
            <p className="mt-1 text-xs text-slate-400">{s.muscle}</p>
            <div className="mt-3 space-y-1 text-sm text-slate-200">
              {s.steps.map((step, stepIdx) => (
                <div key={stepIdx} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                  <span>{step}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-300">
              <span>{s.duration ? `${s.duration} min` : "Duracion s/n"}</span>
              <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-emerald-200">Recup. corta</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
