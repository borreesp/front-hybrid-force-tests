"use client";
import React from "react";

export const DataVisualZone: React.FC<{
  effortCurve: number[];
  dropOffCurve: number[];
  radarData: { label: string; value: number }[];
}> = ({ effortCurve, dropOffCurve, radarData }) => {
  return (
    <section className="rounded-2xl bg-slate-900/70 p-6 ring-1 ring-white/5 transition-all duration-300">
      <div className="mb-4">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Datos</p>
        <h2 className="text-xl font-semibold text-white">Esfuerzo, caida y capacidades vs HYROX</h2>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 lg:col-span-2">
          <p className="text-sm text-slate-300">Curva de esfuerzo</p>
          <div className="mt-3 flex items-end gap-2">
            {effortCurve.map((v, idx) => (
              <div key={idx} className="flex-1">
                <div className="w-full rounded-t-full bg-cyan-400/70" style={{ height: `${v * 1.1}px` }} />
                <p className="mt-1 text-center text-[10px] text-slate-500">{idx + 1}</p>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-400">Por minuto; ideal mantener meseta en 60-75%.</p>
          <p className="mt-3 text-sm text-slate-300">Caida de rendimiento</p>
          <div className="mt-2 flex items-end gap-2">
            {dropOffCurve.map((v, idx) => (
              <div key={idx} className="flex-1">
                <div className="w-full rounded-t-full bg-rose-400/60" style={{ height: `${v * 2}px` }} />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-slate-300">Radar capacidades</p>
          <div className="mt-3">
            <div className="rounded-xl bg-slate-900/80 p-4 text-slate-200">
              {radarData.map((r) => (
                <div key={r.label} className="mb-2 flex items-center justify-between text-sm">
                  <span>{r.label}</span>
                  <span className="font-semibold text-cyan-200">{r.value}%</span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-400">Comparado con demanda HYROX.</p>
          </div>
        </div>
      </div>
    </section>
  );
};
