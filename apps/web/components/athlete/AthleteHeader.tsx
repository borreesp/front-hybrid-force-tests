"use client";
import React from "react";
import { motion } from "framer-motion";

export const AthleteHeader: React.FC<{
  name: string;
  level: string;
  xp: string | number;
  avatar?: string;
  age?: string;
  state: string;
  progress: number;
  statusTone?: "verde" | "amarillo" | "rojo";
}> = ({ name, level, xp, avatar, age, state, progress, statusTone = "verde" }) => {
  const statusColors: Record<"verde" | "amarillo" | "rojo", string> = {
    verde: "border-emerald-400/40 bg-emerald-500/10 text-emerald-100",
    amarillo: "border-amber-400/40 bg-amber-500/10 text-amber-100",
    rojo: "border-rose-400/40 bg-rose-500/10 text-rose-100"
  };
  const cleanProgress = Number.isFinite(progress) ? Math.max(0, Math.min(Math.floor(progress), 99)) : 0;

  return (
    <motion.header
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 shadow-xl ring-1 ring-white/5"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/50 to-indigo-500/50 text-xl font-semibold text-white ring-2 ring-white/10">
            {avatar ? <img src={avatar} alt={name} className="h-full w-full rounded-full object-cover" /> : name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Atleta</p>
            <h1 className="text-3xl font-semibold text-white">{name}</h1>
            <p className="text-sm text-slate-300">
              {level} · {typeof xp === "number" ? Number(xp).toLocaleString("es-ES") : xp} XP {age ? `· ${age}` : ""}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-200">
          <span className={`inline-flex min-h-[36px] items-center justify-center rounded-full px-3 ${statusColors[statusTone]}`}>
            Estado: {state}
          </span>
          <div className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 ring-1 ring-white/10">
            <div className="relative h-16 w-16">
              <svg viewBox="0 0 36 36" className="h-16 w-16">
                <path className="text-slate-700" stroke="currentColor" strokeWidth="4" fill="none" d="M18 2a16 16 0 1 1 0 32 16 16 0 0 1 0-32" />
                <path
                  className="text-cyan-400"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray={`${cleanProgress}, 100`}
                  d="M18 2a16 16 0 1 1 0 32 16 16 0 0 1 0-32"
                />
              </svg>
              <span className="absolute inset-0 grid place-items-center text-sm font-semibold text-white">{cleanProgress}%</span>
            </div>
            <div>
              <p className="text-xs text-slate-400">Al siguiente nivel</p>
              <p className="text-sm font-semibold text-white">{cleanProgress}% completado</p>
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
};
