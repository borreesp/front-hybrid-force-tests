"use client";
import React from "react";

export const PersonalTrackPanel: React.FC<{
  feel: string;
  notes: string;
  compareLabel: string;
  versions: { id: number | string; title: string; version: number }[];
}> = ({ feel, notes, compareLabel, versions }) => {
  return (
    <section className="rounded-2xl bg-slate-900/70 p-6 ring-1 ring-white/5 transition-all duration-300">
      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Personal track</p>
          <h2 className="text-xl font-semibold text-white">Notas, feedback y comparativas</h2>
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">Comparar con {compareLabel}</div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 md:col-span-2">
          <p className="text-sm text-slate-300">Notas</p>
          <p className="mt-2 text-sm text-slate-200">{notes || "Sin notas"}</p>
          <p className="mt-3 text-sm text-slate-300">Sensaciones</p>
          <p className="mt-1 text-sm text-slate-200">{feel}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-slate-300">Versiones</p>
          <div className="mt-2 space-y-2 text-sm text-slate-200">
            {versions.map((v) => (
              <div key={v.id} className="rounded-lg bg-slate-900/70 px-3 py-2">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-400">v{v.version}</p>
                <p className="text-sm font-semibold text-white">{v.title}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
