"use client";
import React, { useMemo } from "react";

import type { Mission } from "../../lib/types";

const statusTone: Record<string, string> = {
  completed: "bg-emerald-500/10 border border-emerald-400/30 text-emerald-100",
  in_progress: "bg-amber-500/10 border border-amber-400/30 text-amber-100",
  assigned: "bg-slate-500/10 border border-slate-400/30 text-white",
  expired: "bg-rose-500/10 border border-rose-400/30 text-rose-100"
};

const normalizedStatus = (status: string) => status.toLowerCase().replace(/_/g, " ");

const progressWidth = (mission: Mission) => {
  if (!mission.target_value || mission.target_value <= 0) return 0;
  return Math.min(100, (mission.progress_value / mission.target_value) * 100);
};

export const MissionBoard: React.FC<{ missions: Mission[] }> = ({ missions }) => {
  const grouped = useMemo(() => {
    return missions.reduce<Record<string, Mission[]>>((acc, mission) => {
      const bucket = mission.type || "otros";
      acc[bucket] = acc[bucket] ?? [];
      acc[bucket].push(mission);
      return acc;
    }, {});
  }, [missions]);

  if (!missions.length) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-slate-900/50 p-4 text-sm text-slate-300">
        No hay misiones activas. Sigue entrenando para que se asignen nuevas metas.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([type, missionsByType]) => (
        <div key={type} className="rounded-2xl border border-white/5 bg-slate-900/70 p-4 shadow-inner shadow-black/30">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{type}</p>
          <div className="mt-3 space-y-3">
            {missionsByType.map((mission) => (
              <div key={mission.id} className="space-y-2 rounded-lg border border-white/10 bg-white/5 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-white">{mission.title}</p>
                    <p className="text-xs text-slate-400">{mission.description}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${statusTone[mission.status] ?? "bg-slate-500/10 text-white"}`}>
                    {normalizedStatus(mission.status)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>{mission.xp_reward} XP</span>
                  <span>
                    {mission.progress_value}/{mission.target_value ?? "?"}
                  </span>
                </div>
                <div className="h-1 rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-cyan-400" style={{ width: `${progressWidth(mission)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
