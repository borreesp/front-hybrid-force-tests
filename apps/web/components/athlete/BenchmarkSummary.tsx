"use client";
import React, { useMemo } from "react";

import type { Benchmark } from "../../lib/types";

export const BenchmarkSummary: React.FC<{ benchmarks: Benchmark[] }> = ({ benchmarks }) => {
  const highlight = useMemo(() => {
    if (!benchmarks.length) return null;
    const best = benchmarks.reduce<Benchmark | null>((acc, bench) => {
      if (!bench.percentile) return acc;
      if (!acc || (bench.percentile ?? 0) > (acc.percentile ?? 0)) {
        return bench;
      }
      return acc;
    }, null);
    return best;
  }, [benchmarks]);

  const avgPercentile = useMemo(() => {
    const valid = benchmarks.filter((bench) => typeof bench.percentile === "number");
    if (!valid.length) return null;
    return Math.round(valid.reduce((sum, bench) => sum + (bench.percentile ?? 0), 0) / valid.length);
  }, [benchmarks]);

  if (!benchmarks.length) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-slate-900/60 p-4 text-sm text-slate-400">
        Benchmarks globales pendientes de sincronizar.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/5 bg-slate-900/70 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Comparativas</p>
      <div className="mt-3 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-300">Percentil promedio</p>
          <h3 className="text-2xl font-semibold text-white">{avgPercentile ?? "N/A"}%</h3>
          <p className="text-xs text-slate-500">Respecto a tu nivel</p>
        </div>
        {highlight && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-right">
            <p className="text-xs text-slate-400 uppercase tracking-[0.2em]">Mejor avance</p>
            <p className="text-sm font-semibold text-white">{highlight.capacity}</p>
            <p className="text-sm text-emerald-300">{highlight.percentile?.toFixed(1)}%</p>
          </div>
        )}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {benchmarks.slice(0, 4).map((bench) => (
          <div key={`${bench.capacity}-${bench.level}`} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{bench.capacity}</span>
              <span>{bench.level ? `Nivel ${bench.level}` : "Nivel ?"} </span>
            </div>
            <p className="text-lg font-semibold text-white">{bench.percentile?.toFixed(1) ?? "--"}%</p>
          </div>
        ))}
      </div>
    </div>
  );
};
