"use client";

import React, { useMemo } from "react";

type ImpactMap = Record<string, number | undefined>;
type ProfileMap = Record<string, number | undefined>;

type Props = {
  athleteProfile: ProfileMap;
  athleteImpact: ImpactMap;
  mode: "analysis" | "workout" | "preview";
};

const labels: Record<string, string> = {
  fatigue: "Fatiga actual",
  fatigue_score: "Fatiga actual",
  resistencia: "Resistencia",
  resistance: "Resistencia",
  endurance: "Resistencia",
  fuerza: "Fuerza",
  strength: "Fuerza",
  metcon: "Metcon",
  gimnasticos: "Gimnasticos",
  gimnasia: "Gimnasticos",
  velocidad: "Velocidad",
  carga_muscular: "Carga muscular",
  leg_load: "Carga piernas",
  core: "Core",
  wb_skill: "WallBall skill",
  wallball_skill: "WallBall skill",
  hr_rest: "FC reposo",
  hr_avg: "FC media",
  hr_max: "FC maxima",
  vo2_est: "VO2 estimado",
  hrv: "HRV",
  sleep_hours: "Horas sueno",
  recovery_time_hours: "Recuperacion",
  acute_load: "Carga aguda",
  chronic_load: "Carga cronica",
  load_ratio: "Load ratio"
};

const alias: Record<string, string> = {
  resistencia: "resistencia",
  resistance: "resistencia",
  endurance: "resistencia",
  aerobic_capacity: "resistencia",
  fuerza: "fuerza",
  strength: "fuerza",
  metcon: "metcon",
  gimnasticos: "gimnasticos",
  gimnasia: "gimnasticos",
  gymnastics: "gimnasticos",
  velocidad: "velocidad",
  speed: "velocidad",
  carga_muscular: "carga_muscular",
  muscular_load: "carga_muscular",
  leg_load: "carga_muscular",
  core: "core",
  wb_skill: "wallball_skill",
  wall_ball_skill: "wallball_skill",
  skill_wall_ball: "wallball_skill",
  skill_wallball: "wallball_skill",
  skill_wb: "wallball_skill",
  fatigue_score: "fatigue",
  fatigue: "fatigue",
  fatiga: "fatigue",
  hr_rest: "hr_rest",
  hr_avg: "hr_avg",
  hr_max: "hr_max",
  vo2_est: "vo2_est",
  vo2: "vo2_est",
  hrv: "hrv",
  sleep_hours: "sleep_hours",
  recovery_time_hours: "recovery_time_hours",
  acute_load: "acute_load",
  chronic_load: "chronic_load",
  load_ratio: "load_ratio"
};

const normalizeKey = (raw: string) => {
  const base = raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
  return alias[base] ?? base;
};

const toNumber = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getLabel = (normalized: string, fallback?: string) => {
  if (normalized.startsWith("skill_")) {
    const skillName = (fallback ?? normalized).replace(/^skill[_-]?/i, "");
    return `Skill ${skillName || normalized.replace(/^skill[_-]?/i, "")}`;
  }
  return labels[normalized] ?? fallback ?? normalized;
};

const priorityOrder = [
  "resistencia",
  "fuerza",
  "metcon",
  "gimnasticos",
  "fatigue",
  "fatigue_score",
  "carga_muscular",
  "hr_rest",
  "vo2_est",
  "acute_load",
  "load_ratio"
];

export const AthleteImpactCompact: React.FC<Props> = ({ athleteProfile, athleteImpact, mode }) => {
  const normalizedImpact = useMemo(() => {
    const entries = Object.entries(athleteImpact ?? {}).map(([key, value]) => {
      const normalized = normalizeKey(key);
      return [normalized, toNumber(value)] as const;
    });
    return Object.fromEntries(entries);
  }, [athleteImpact]);

  const rows = useMemo(() => {
    const profileEntries = Object.entries(athleteProfile ?? {});
    const mapped = profileEntries.map(([key, current]) => {
      const normalized = normalizeKey(key);
      const impact = normalizedImpact[normalized] ?? 0;
      return {
        key: normalized,
        label: getLabel(normalized, key),
        current: toNumber(current),
        impact
      };
    });

    // add impact-only metrics without baseline at the end
    Object.entries(normalizedImpact).forEach(([key, impact]) => {
      const exists = mapped.some((row) => row.key === key);
      if (!exists) {
        mapped.push({ key, label: getLabel(key, key), current: 0, impact });
      }
    });

    return mapped.sort((a, b) => {
      const rankA = priorityOrder.indexOf(a.key);
      const rankB = priorityOrder.indexOf(b.key);
      const safeA = rankA >= 0 ? rankA : 999;
      const safeB = rankB >= 0 ? rankB : 999;
      if (safeA !== safeB) return safeA - safeB;
      return a.label.localeCompare(b.label);
    });
  }, [athleteProfile, normalizedImpact]);

  if (!rows.length) {
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-slate-300">
        Sin datos de impacto disponibles en modo {mode}.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-100">
      <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-slate-400">
        <span>Impacto atleta</span>
        <span>Modo {mode}</span>
      </div>
      <div className="grid gap-1 text-xs md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <div className="grid grid-cols-[1.4fr_0.6fr_0.6fr] gap-2 text-[11px] font-semibold text-slate-300">
          <span>Capacidad</span>
          <span className="text-right">Actual</span>
          <span className="text-right">Impacto</span>
        </div>
        {rows.map((row) => (
          <div
            key={row.key}
            className="grid grid-cols-[1.4fr_0.6fr_0.6fr] items-center gap-2 rounded-lg bg-white/5 px-2 py-1 text-[12px] text-slate-100"
          >
            <span className="truncate text-slate-200">{row.label}</span>
            <span className="text-right text-slate-300">{row.current}</span>
            <span className={`text-right ${row.impact > 0 ? "text-emerald-300" : row.impact < 0 ? "text-rose-300" : "text-slate-300"}`}>
              {row.impact > 0 ? `+${row.impact}` : row.impact}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
