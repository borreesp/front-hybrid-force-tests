"use client";
import React from "react";
import { motion } from "framer-motion";

type MetricItem = {
  label: string;
  value: string;
  hint?: string;
};

type PRItem = {
  name: string;
  score: string;
  date: string;
};

type PRDetail = {
  name: string;
  value: number;
  unit?: string | null;
  type?: string | null;
  date?: string | null;
};

const formatScore = (value: number, unit?: string | null) => {
  if (!unit) return `${value}`;
  return `${value} ${unit}`.trim();
};

const normalizeLabel = (value?: string | null) => (value || "").toLowerCase();

const isKg = (pr: PRDetail) => {
  const unit = normalizeLabel(pr.unit);
  const type = normalizeLabel(pr.type);
  return unit.includes("kg") || unit.includes("lb") || type.includes("load");
};

const isTime = (pr: PRDetail) => {
  const unit = normalizeLabel(pr.unit);
  const type = normalizeLabel(pr.type);
  return unit.includes("sec") || unit.includes("s") || unit.includes("min") || type.includes("time");
};

const dedupeBestByName = (prs: PRDetail[], isBetter: (next: PRDetail, current: PRDetail) => boolean) => {
  const map = new Map<string, PRDetail>();
  for (const pr of prs) {
    const key = pr.name.toLowerCase();
    const current = map.get(key);
    if (!current || isBetter(pr, current)) {
      map.set(key, pr);
    }
  }
  return Array.from(map.values());
};

export const MetricsPRs: React.FC<{
  metrics: MetricItem[];
  prs: PRItem[];
  allPrs?: PRDetail[];
  onViewMorePrs?: () => void;
}> = ({ metrics, prs, allPrs = [], onViewMorePrs }) => {
  const kgPrs = dedupeBestByName(allPrs.filter(isKg), (next, current) => next.value > current.value);
  const timePrs = dedupeBestByName(
    allPrs.filter((pr) => !isKg(pr) && isTime(pr)),
    (next, current) => next.value < current.value
  );
  const scorePrs = dedupeBestByName(
    allPrs.filter((pr) => !isKg(pr) && !isTime(pr)),
    (next, current) => next.value > current.value
  );

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl bg-slate-900/70 p-4 ring-1 ring-white/5"
      >
        <p className="text-sm text-slate-300">Métricas</p>
        <div className="mt-3 space-y-2 text-sm text-slate-200">
          {metrics.map((m) => (
            <div key={m.label} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
              <span>{m.label}</span>
              <div className="text-right">
                <p className="font-semibold text-white">{m.value}</p>
                {m.hint && <p className="text-[11px] text-slate-400">{m.hint}</p>}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="lg:col-span-2 rounded-2xl bg-slate-900/70 p-4 ring-1 ring-white/5"
      >
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-300">PRs y tests</p>
          {onViewMorePrs && (
            <button className="text-xs text-cyan-200 hover:text-cyan-100" type="button" onClick={onViewMorePrs}>
              Ver más
            </button>
          )}
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {prs.map((pr) => (
            <div key={pr.name} className="rounded-lg bg-white/5 px-3 py-2 text-sm text-slate-200">
              <p className="font-semibold text-white">{pr.name}</p>
              <p className="text-slate-300">{pr.score}</p>
              <p className="text-xs text-slate-400">{pr.date}</p>
            </div>
          ))}
        </div>
        <details className="mt-4 rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-200">
          <summary className="cursor-pointer text-sm text-slate-100">PRs y marcas</summary>
          <div className="mt-3 space-y-4">
            {kgPrs.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-400">Máximos kilos</p>
                <div className="mt-2 grid gap-2 md:grid-cols-2">
                  {kgPrs.map((pr) => (
                    <div key={`kg-${pr.name}`} className="rounded-lg bg-white/5 px-3 py-2">
                      <p className="font-semibold text-white">{pr.name}</p>
                      <p className="text-slate-300">{formatScore(pr.value, pr.unit)}</p>
                      {pr.date && <p className="text-xs text-slate-400">{new Date(pr.date).toLocaleDateString("es-ES")}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {timePrs.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-400">Mejores tiempos</p>
                <div className="mt-2 grid gap-2 md:grid-cols-2">
                  {timePrs.map((pr) => (
                    <div key={`time-${pr.name}`} className="rounded-lg bg-white/5 px-3 py-2">
                      <p className="font-semibold text-white">{pr.name}</p>
                      <p className="text-slate-300">{formatScore(pr.value, pr.unit)}</p>
                      {pr.date && <p className="text-xs text-slate-400">{new Date(pr.date).toLocaleDateString("es-ES")}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {scorePrs.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-400">Mejores scores</p>
                <div className="mt-2 grid gap-2 md:grid-cols-2">
                  {scorePrs.map((pr) => (
                    <div key={`score-${pr.name}`} className="rounded-lg bg-white/5 px-3 py-2">
                      <p className="font-semibold text-white">{pr.name}</p>
                      <p className="text-slate-300">{formatScore(pr.value, pr.unit)}</p>
                      {pr.date && <p className="text-xs text-slate-400">{new Date(pr.date).toLocaleDateString("es-ES")}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {!allPrs.length && <p className="text-xs text-slate-400">Sin PRs registrados.</p>}
          </div>
        </details>
      </motion.div>
    </div>
  );
};
