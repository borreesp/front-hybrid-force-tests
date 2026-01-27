"use client";
import React from "react";

import type { Achievement } from "../../lib/types";

const toneForCategory: Record<string, string> = {
  progression: "from-emerald-500/40 to-emerald-400/10 border-emerald-400/30 text-emerald-100",
  pr: "from-cyan-500/40 to-cyan-400/10 border-cyan-400/30 text-cyan-100",
  consistency: "from-amber-500/40 to-amber-400/10 border-amber-400/30 text-amber-100",
  hyrox: "from-indigo-500/40 to-indigo-400/10 border-indigo-400/30 text-indigo-100",
  movement: "from-slate-500/40 to-slate-400/10 border-slate-400/30 text-slate-100"
};

export const AchievementGrid: React.FC<{ achievements: Achievement[] }> = ({ achievements }) => {
  if (!achievements.length) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-slate-900/50 p-4 text-sm text-slate-300">
        Todavía no hay logros; completa entrenamientos, rompe PRs y desbloquearás nuevas medallas.
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {achievements.map((achievement) => {
        const tone = toneForCategory[achievement.category ?? ""] ?? "from-white/5 to-white/5 border-white/10 text-white";
        return (
          <div
            key={achievement.id}
            className={`rounded-2xl border px-4 py-3 shadow-sm ${tone} bg-gradient-to-br`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1">
                <p className="text-xs uppercase tracking-[0.2em] text-white/70">Logro</p>
                <h4 className="text-lg font-semibold text-white">{achievement.name}</h4>
              </div>
              <div className="text-right text-xs font-semibold text-white/80">
                {achievement.xp_reward.toFixed(0)} XP
              </div>
            </div>
            <p className="mt-2 text-sm text-white/80">{achievement.description}</p>
            {achievement.unlocked_at && (
              <p className="mt-3 text-[11px] uppercase tracking-[0.2em] text-white/60">
                desbloqueado {new Date(achievement.unlocked_at).toLocaleDateString("es-ES")}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
};
