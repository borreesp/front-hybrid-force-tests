"use client";
import React from "react";
import { motion } from "framer-motion";

type GearItem = { name: string; status?: string };
type SkillItem = { name: string; valueLabel: string; progress?: number };

export const EquipmentSkills: React.FC<{ gear: GearItem[]; skills: SkillItem[]; onViewMoreSkills?: () => void }> = ({
  gear,
  skills,
  onViewMoreSkills
}) => {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl bg-slate-900/70 p-4 ring-1 ring-white/5"
      >
        <p className="text-sm text-slate-300">Equipamiento</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {gear.map((g) => (
            <div key={g.name} className="rounded-lg bg-white/5 px-3 py-2 text-sm text-slate-200 ring-1 ring-white/5">
              <p className="font-semibold text-white">{g.name}</p>
              <p className="text-xs text-slate-400">{g.status ?? "Equipada"}</p>
            </div>
          ))}
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="rounded-2xl bg-slate-900/70 p-4 ring-1 ring-white/5"
      >
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-300">Habilidades</p>
          {onViewMoreSkills && (
            <button className="text-xs text-cyan-200 hover:text-cyan-100" onClick={onViewMoreSkills} type="button">
              Ver más
            </button>
          )}
        </div>
        <div className="mt-3 space-y-2 text-sm text-slate-200">
          {skills.map((s) => (
            <div key={s.name} className="rounded-lg bg-white/5 px-3 py-2 ring-1 ring-white/5">
              <div className="flex items-center justify-between">
                <span>{s.name}</span>
                <span className="text-cyan-200">{s.valueLabel}</span>
              </div>
              {typeof s.progress === "number" && (
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full bg-emerald-400" style={{ width: `${s.progress}%` }} />
                </div>
              )}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
