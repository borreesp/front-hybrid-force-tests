"use client";
import React from "react";
import { motion } from "framer-motion";

type TimelineItem = {
  title: string;
  date: string;
  type: string;
  delta?: string;
};

export const ProgressTimeline: React.FC<{ items: TimelineItem[] }> = ({ items }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl bg-slate-900/70 p-4 ring-1 ring-white/5"
    >
      <div className="mb-3">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Historial</p>
        <h3 className="text-lg font-semibold text-white">Hitos y mejoras</h3>
      </div>
      <div className="space-y-3">
        {items.map((item, idx) => (
          <div key={`${item.title}-${idx}`} className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2">
            <div className="h-2 w-2 rounded-full bg-cyan-400" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">{item.title}</p>
              <p className="text-xs text-slate-400">{item.date} · {item.type}</p>
            </div>
            {item.delta && <span className="text-xs text-emerald-300">{item.delta}</span>}
          </div>
        ))}
      </div>
    </motion.div>
  );
};