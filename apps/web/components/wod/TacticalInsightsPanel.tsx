"use client";
import React from "react";

export const TacticalInsightsPanel: React.FC<{
  weaknesses: string[];
  suggestions: string[];
  hyroxTransfer: string;
}> = ({ weaknesses, suggestions, hyroxTransfer }) => {
  return (
    <section className="rounded-2xl bg-slate-900/70 p-6 ring-1 ring-white/5 transition-all duration-300">
      <div className="mb-4">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Insights</p>
        <h2 className="text-xl font-semibold text-white">Puntos debiles y plan tactico</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-slate-300">Debilidades detectadas</p>
          <ul className="mt-2 space-y-2 text-sm text-rose-200">
            {weaknesses.map((w) => (
              <li key={w} className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-rose-400" />
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 md:col-span-2">
          <p className="text-sm text-slate-300">Recomendaciones</p>
          <ul className="mt-2 space-y-2 text-sm text-emerald-200">
            {suggestions.map((s) => (
              <li key={s} className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-slate-400">Transferencia HYROX: {hyroxTransfer}</p>
        </div>
      </div>
    </section>
  );
};
