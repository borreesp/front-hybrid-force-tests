"use client";
import React from "react";

export const HeaderOverview: React.FC<{
  title: string;
  dateHint: string;
  durationLabel: string;
  effortTag: string;
  loadScore: number;
  aerobicShare: number;
}> = ({ title, dateHint, durationLabel, effortTag, loadScore, aerobicShare }) => {
  const anaerobic = Math.max(0, 100 - aerobicShare);
  return (
    <header className="overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 shadow-xl ring-1 ring-white/5 transition-all duration-300">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">HYROX focus</p>
          <h1 className="text-3xl font-semibold text-white">{title}</h1>
          <p className="mt-1 text-slate-300">
            {dateHint} · {durationLabel} · {effortTag}
          </p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-300">
            <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-cyan-100">Carga {loadScore?.toFixed?.(1) ?? loadScore}</span>
            <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-indigo-100">HYROX</span>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="h-24 w-24 rounded-full bg-white/10 p-3">
            <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-900 text-xl font-semibold text-cyan-200">
              {loadScore ?? 0}
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3 text-sm text-slate-200 ring-1 ring-white/10">
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs text-slate-400">Aerobico</span>
              <span className="text-lg font-semibold text-emerald-300">{aerobicShare}%</span>
            </div>
            <div className="h-12 w-px bg-white/10" />
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs text-slate-400">Anaerobico</span>
              <span className="text-lg font-semibold text-amber-300">{anaerobic}%</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};