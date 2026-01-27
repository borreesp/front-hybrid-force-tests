"use client";
import React from "react";
import { motion } from "framer-motion";

export const FatigueStatus: React.FC<{ status: "verde" | "amarillo" | "rojo"; message: string; metrics: { label: string; value: string }[] }> = ({ status, message, metrics }) => {
  const tones: Record<string, string> = {
    verde: "from-emerald-500/40 to-emerald-400/20 border-emerald-400/30",
    amarillo: "from-amber-500/40 to-amber-400/20 border-amber-400/30",
    rojo: "from-rose-500/40 to-rose-400/20 border-rose-400/30"
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`rounded-2xl border bg-gradient-to-br ${tones[status]} p-5 ring-1 ring-white/10`}
    >
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-white/70">Estado actual</p>
          <h3 className="text-xl font-semibold text-white">{message}</h3>
        </div>
        <div className="flex gap-3 text-sm text-white">
          {metrics.map((m) => (
            <div key={m.label} className="rounded-lg bg-white/10 px-3 py-2">
              <p className="text-xs text-white/80">{m.label}</p>
              <p className="font-semibold">{m.value}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
