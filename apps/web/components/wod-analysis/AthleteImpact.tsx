"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Card, Button } from "@thrifty/ui";

type ImpactMap = Record<string, number | undefined>;
type ProfileMap = Record<string, number | undefined>;

type Props = {
  athleteProfile: ProfileMap;
  athleteImpact: ImpactMap;
  mode: "analysis" | "workout" | "preview";
};

const requiredImpactKeys = ["metcon", "resistencia", "fuerza", "gimnasticos", "velocidad", "tecnica", "movilidad", "mentalidad", "carga_muscular", "core", "wallball_skill"];
const labels: Record<string, string> = {
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
  tecnica: "Tecnica",
  movilidad: "Movilidad",
  mentalidad: "Mentalidad"
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
  tecnica: "tecnica",
  tecnica_basal: "tecnica",
  movilidad: "movilidad",
  mentalidad: "mentalidad",
  mindset: "mentalidad"
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

type NormalizedImpactEntry = { originalKey: string; normalized: string; value: number };

export const AthleteImpact: React.FC<Props> = ({ athleteProfile, athleteImpact, mode }) => {
  const normalizedImpactEntries = useMemo<NormalizedImpactEntry[]>(
    () =>
      Object.entries(athleteImpact ?? {}).map(([key, value]) => ({
        originalKey: key,
        normalized: normalizeKey(key),
        value: toNumber(value)
      })),
    [athleteImpact]
  );

  const normalizedImpactMap = useMemo(
    () => Object.fromEntries(normalizedImpactEntries.map((entry) => [entry.normalized, entry.value])),
    [normalizedImpactEntries]
  );

  const rows = useMemo(() => {
    const profileEntries = Object.entries(athleteProfile ?? {});
    const profileMap = Object.fromEntries(profileEntries.map(([key, value]) => [normalizeKey(key), value]));

    const keys = new Set<string>();
    profileEntries.forEach(([key]) => keys.add(normalizeKey(key)));
    normalizedImpactEntries.forEach((entry) => keys.add(entry.normalized));
    requiredImpactKeys.forEach((key) => keys.add(key));

    return Array.from(keys).map((normalized) => {
      const raw = profileMap[normalized];
      const hasValue = raw !== undefined && raw !== null;
      const currentValue = hasValue ? toNumber(raw) : 0;
      const impact = normalizedImpactMap[normalized] ?? 0;
      const newValue = currentValue + impact;
      return {
        key: normalized,
        normalized,
        label: getLabel(normalized, normalized),
        current: hasValue ? currentValue : null,
        impact,
        newValue,
        hadValue: hasValue,
        missingImpact: !(normalized in normalizedImpactMap)
      };
    });
  }, [athleteProfile, normalizedImpactEntries, normalizedImpactMap, requiredImpactKeys]);

  const metricsMissing = useMemo(() => rows.filter((row) => row.missingImpact).map((row) => row.normalized), [rows]);

  const metricsMissingData = useMemo(() => rows.filter((row) => !row.hadValue).map((row) => row.normalized), [rows]);

  const metricsNotCalculable = useMemo(
    () =>
      normalizedImpactEntries
        .filter((entry) => !rows.some((row) => row.normalized === entry.normalized))
        .map((entry) => entry.originalKey),
    [normalizedImpactEntries, rows]
  );

  const metricsWithImpact = useMemo(
    () => normalizedImpactEntries.filter((entry) => entry.value !== 0).map((entry) => entry.normalized),
    [normalizedImpactEntries]
  );

  const [showAllCapacities, setShowAllCapacities] = useState(false);

  useEffect(() => {
    const debugPayload = {
      athleteProfile,
      athleteImpact,
      metricsUsed: rows.map((r) => r.normalized),
      metricsMissing,
      metricsMissingData,
      metricsNotCalculable,
      metricsWithImpact
    };
    // eslint-disable-next-line no-console
    console.info("[DEBUG_METRICS]", debugPayload);
    if (metricsMissing.length) {
      // eslint-disable-next-line no-console
      console.warn(
        "[METRICAS FALTANTES]",
        metricsMissing.map((m) => `${m}: existe en athleteProfile pero sin impacto (default 0)`).join(" | ")
      );
    }
    if (metricsMissingData.length) {
      // eslint-disable-next-line no-console
      console.warn("[MISSING DATA]", metricsMissingData.map((m) => `La metrica \"${m}\" llega sin valor (fallback 0)`).join(" | "));
    }
    if (metricsNotCalculable.length) {
      // eslint-disable-next-line no-console
      console.warn(
        "[MISSING DATA]",
        metricsNotCalculable.map((m) => `${m}: impacto sin baseline en perfil o sin formula conocida`).join(" | ")
      );
    }
  }, [athleteImpact, athleteProfile, metricsMissing, metricsMissingData, metricsNotCalculable, metricsWithImpact, rows]);  const capacityRows = rows;

  const capacityVisible = useMemo(() => {
    if (showAllCapacities) return capacityRows;
    return capacityRows.filter((r) => r.impact !== 0);
  }, [capacityRows, showAllCapacities]);

  if (!athleteProfile || Object.keys(athleteProfile || {}).length === 0) {
    return (
      <Card className="bg-slate-900/70 px-6 py-7 ring-1 ring-white/10 md:px-8 md:py-9">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
              {mode === "analysis" ? "Impacto real del WOD sobre tu perfil" : "Impacto potencial si realizas este WOD"}
            </p>
            <p className="text-sm text-slate-300">Sin datos de perfil aun. Revisa athleteProfile o impacto del analisis.</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900/70 px-6 py-7 ring-1 ring-white/10 md:px-8 md:py-9">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
            {mode === "analysis"
              ? "Impacto real del WOD sobre tu perfil"
              : mode === "preview"
                ? "Impacto potencial (preview) segun tu perfil"
                : "Impacto potencial si realizas este WOD"}
          </p>
          <p className="text-sm text-slate-300">Estimacion previa del efecto del WOD sobre tus metricas.</p>
        </div>
      </div>

      <div className="mt-4 space-y-5"><div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Capacidades impactadas</p>
            <Button variant="ghost" size="sm" onClick={() => setShowAllCapacities((prev) => !prev)}>
              {showAllCapacities ? "Ver menos" : "Mostrar todas"}
            </Button>
          </div>
          <div className="flex flex-col gap-1">
            {capacityVisible.map((row) => (
              <div
                key={row.normalized}
                className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2"
              >
                <div className="min-w-0 text-[12px] font-semibold text-slate-100">
                  <span className="truncate">{row.label}</span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                  <span>
                    Actual: <span className="text-slate-200">{row.hadValue ? row.current : "—"}</span>
                  </span>
                  <span className={row.hadValue || row.impact !== 0 ? classifyColor(row.normalized, row.impact) : "text-slate-400"}>
                    Impacto: {row.hadValue || row.impact !== 0 ? (row.impact > 0 ? `+${row.impact}` : row.impact) : "—"}
                  </span>
                  {mode === "analysis" && row.hadValue && <span className="text-slate-300">Nuevo: {row.newValue}</span>}
                </div>
              </div>
            ))}
            {!capacityVisible.length && (
              <p className="text-[12px] text-slate-400">Sin capacidades impactadas relevantes.</p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
const classifyColor = (_normalized: string, impact: number) => {
  if (impact === 0) return "text-slate-300";
  return impact > 0 ? "text-emerald-300" : "text-rose-300";
};





