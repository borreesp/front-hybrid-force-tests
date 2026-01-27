"use client";
import React from "react";

export const AthleteResponsePanel: React.FC<{
  heartRates: { avg: number; max: number };
  hrv: number;
  glycogenCurve: number[];
  fatigueByStation: { label: string; value: number }[];
}> = ({ heartRates, hrv, glycogenCurve, fatigueByStation }) => {
  return (
    <section className="rounded-2xl bg-slate-900/70 p-6 ring-1 ring-white/5 transition-all duration-300">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Respuesta del atleta</p>
          <h2 className="text-xl font-semibold text-white">FC, HRV y fatiga por estacion</h2>
        </div>
        <div className="flex gap-3 text-sm text-slate-200">
          <div className="rounded-xl bg-white/5 px-3 py-2 ring-1 ring-white/10">FC media {heartRates.avg} bpm</div>
          <div className="rounded-xl bg-white/5 px-3 py-2 ring-1 ring-white/10">FC max {heartRates.max} bpm</div>
          <div className="rounded-xl bg-white/5 px-3 py-2 ring-1 ring-white/10">HRV {hrv} ms</div>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-white/5 bg-white/5 p-4">
          <p className="text-sm text-slate-300">Curva estimada de glucogeno</p>
          <div className="mt-3 flex items-end gap-2">
            {glycogenCurve.map((v, idx) => (
              <div key={idx} className="flex-1">
                <div className="w-full rounded-t-full bg-amber-400/70" style={{ height: `${v * 0.8}px` }} />
                <p className="mt-1 text-center text-[10px] text-slate-500">{idx + 1}</p>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-400">Indicativa por bloque; optimiza ingestion cada 10-15 min.</p>
        </div>
        <div className="rounded-xl border border-white/5 bg-white/5 p-4">
          <p className="text-sm text-slate-300">Fatiga por estacion</p>
          <div className="mt-3 grid grid-cols-4 gap-2 text-xs text-slate-200">
            {fatigueByStation.map((f) => (
              <div key={f.label} className="rounded-lg bg-slate-900/80 p-2">
                <p className="text-[11px] text-slate-400">{f.label}</p>
                <p className="text-lg font-semibold text-rose-200">{f.value}%</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
