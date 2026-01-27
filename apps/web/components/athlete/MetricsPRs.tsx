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

export const MetricsPRs: React.FC<{ metrics: MetricItem[]; prs: PRItem[]; onViewMorePrs?: () => void }> = ({
  metrics,
  prs,
  onViewMorePrs
}) => {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl bg-slate-900/70 p-4 ring-1 ring-white/5"
      >
        <p className="text-sm text-slate-300">Metricas clave</p>
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
      </motion.div>
    </div>
  );
};
