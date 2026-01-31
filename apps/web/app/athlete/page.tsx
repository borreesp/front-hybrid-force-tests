"use client";
import React, { useEffect, useMemo, useState } from "react";
import { AthleteHeader } from "../../components/athlete/AthleteHeader";
import { AthleteRadar } from "../../components/athlete/AthleteRadar";
import { ProgressTimeline } from "../../components/athlete/ProgressTimeline";
import { MetricsPRs } from "../../components/athlete/MetricsPRs";
import { useAthleteProfile } from "../../hooks/useAthlete";
import { api } from "../../lib/api";
import type { AthletePrStat, CapacityProfileItem, WorkoutExecution } from "../../lib/types";
import { useAppStore } from "@thrifty/utils";
import { HelpTooltip } from "../../components/ui/HelpTooltip";
import { normalizeCapacity, type ComparisonMode, type CapacityKey } from "../../lib/capacityNormalization";

export default function AthletePage() {
  const { data, loading, error } = useAthleteProfile();
  const [topPrs, setTopPrs] = useState<AthletePrStat[]>([]);
  const [capacityProfile, setCapacityProfile] = useState<CapacityProfileItem[]>([]);
  const [executions, setExecutions] = useState<WorkoutExecution[]>([]);
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>("level");
  const user = useAppStore((s) => s.user);

  useEffect(() => {
    if (!user?.id) return;
    api.getAthletePrsTop(user.id, 5)
      .then((res) => setTopPrs(res as AthletePrStat[]))
      .catch(() => setTopPrs([]));
    api.getWorkoutExecutions()
      .then((rows) => setExecutions(rows))
      .catch(() => setExecutions([]));
    if (!data?.capacities?.length) {
      const isPrivileged = user?.role === "COACH" || user?.role === "ADMIN";
      const userIdNum = Number(user.id);
      const tryIds = [user.id, isPrivileged && userIdNum === 1 ? 2 : undefined].filter(Boolean) as (number | string)[];
      (async () => {
        for (const candidate of tryIds) {
          try {
            const res = await api.getCapacityProfile(candidate);
            if (res.capacities?.length) {
              setCapacityProfile(res.capacities);
              return;
            }
          } catch {
            // continue
          }
        }
        setCapacityProfile([]);
      })();
    }
  }, [user?.id, data?.capacities?.length]);

  const testsSummary = data?.tests;
  const hasResults = (testsSummary?.tests_total ?? 0) > 0;
  const statusLabel: "verde" | "amarillo" | "rojo" = hasResults ? "verde" : "amarillo";
  const statusMessage = hasResults ? "Progreso activo" : "Sin tests registrados aun";

  const athleteLevel = data?.career?.level ?? 1;

  const radarEntries = useMemo(() => {
    const map: Record<string, number> = {};
    const capacitiesSource = (data?.capacities?.length ? data.capacities : capacityProfile) ?? [];
    capacitiesSource.forEach((c: any) => {
      const capName = (c?.capacity || c?.name || c?.code || "").toString();
      if (!capName) return;
      map[capName.toLowerCase()] = c.value ?? c?.score ?? 0;
    });
    const defs: { key: CapacityKey; label: string }[] = [
      { key: "fuerza", label: "Fuerza" },
      { key: "resistencia", label: "Resistencia" },
      { key: "metcon", label: "Metcon" },
      { key: "gimnasticos", label: "Gimnásticos" },
      { key: "velocidad", label: "Velocidad" },
      { key: "carga muscular", label: "Carga muscular" }
    ];
    return defs.map((d) => ({
        label: d.label,
        value: normalizeCapacity({
          rawScore: map[d.key] ?? 0,
          mode: comparisonMode,
          athleteLevel,
          capacityKey: d.key
        })
      }));
  }, [athleteLevel, comparisonMode, data?.capacities, capacityProfile]);

  const modeLabel =
    comparisonMode === "level" ? "tu nivel" : comparisonMode === "global" ? "nivel élite" : "el siguiente nivel";

  const metrics = useMemo(() => {
    const xpTotal = data?.career?.xp_total ?? 0;
    const level = data?.career?.level ?? 0;
    const weeklyStreak = testsSummary?.weekly_streak ?? data?.career?.weekly_streak ?? null;
    const testsTotal = testsSummary?.tests_total ?? 0;
    return [
      { label: "XP total", value: Number(xpTotal).toLocaleString("es-ES") },
      { label: "Nivel", value: level ? `${level}` : "-" },
      { label: "Tests registrados", value: `${testsTotal}` },
      { label: "Racha semanal", value: weeklyStreak != null ? `${weeklyStreak}` : "-" }
    ];
  }, [data?.career, testsSummary]);

  const prs = useMemo(() => {
    const source = topPrs.length ? topPrs : data?.prs ?? [];
    return source.slice(0, 5).map((pr) => ({
      name: (pr as any).name ?? (pr as any).movement ?? "PR",
      score: `${pr.value}${pr.unit ? ` ${pr.unit}` : ""}`,
      date: pr.achieved_at ? new Date(pr.achieved_at).toLocaleDateString("es-ES") : "-"
    }));
  }, [data?.prs, topPrs]);

  const allPrs = useMemo(() => {
    return (data?.prs ?? []).map((pr) => ({
      name: pr.movement ?? pr.pr_type ?? "PR",
      value: pr.value ?? 0,
      unit: pr.unit ?? undefined,
      type: pr.pr_type ?? undefined,
      date: pr.achieved_at ?? null
    }));
  }, [data?.prs]);

  const headerName = user?.name || "Atleta";
  const levelLabel = data?.career ? `Nivel ${data.career.level}` : "Nivel 0";
  const xpLabel = data?.career ? data.career.xp_total : 0;
  const progress = data?.career
    ? Math.min(Math.floor(Math.max(0, Math.min(data.career.progress_pct ?? 0, 100))), 99)
    : 0;

  const timelineItems = useMemo(() => {
    const formatSeconds = (value?: number | null) => {
      if (!value || value <= 0) return undefined;
      const total = Math.round(value);
      const minutes = Math.floor(total / 60);
      const seconds = total % 60;
      return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    };
    if (!executions.length) {
      return [{ title: "Sin tests aun", date: "Hoy", type: "Test", delta: "+0 XP" }];
    }
    return executions.slice(0, 4).map((exec) => ({
      title: exec.workout?.title ?? "Test",
      date: exec.executed_at ? new Date(exec.executed_at).toLocaleDateString("es-ES") : "Hoy",
      type: "Test",
      delta: formatSeconds(exec.total_time_seconds)
    }));
  }, [executions]);

  return (
    <div className="space-y-8">
      <AthleteHeader name={headerName} level={levelLabel} xp={xpLabel} state={statusMessage} progress={progress} statusTone={statusLabel} />

      {error && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          Error cargando datos: {error}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between gap-2 text-sm text-slate-300">
            <div className="flex items-center gap-2">
              <span>Radar de capacidades</span>
              <HelpTooltip helpKey="athlete.radar" />
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-400">
              Comparar con
              <select
                value={comparisonMode}
                onChange={(e) => setComparisonMode(e.target.value as ComparisonMode)}
                className="rounded-lg border border-white/10 bg-slate-900/70 px-2 py-1 text-xs text-white"
              >
                <option value="level">Tu nivel</option>
                <option value="global">Global</option>
                <option value="next_level">Nivel siguiente</option>
              </select>
            </label>
          </div>
          <AthleteRadar entries={radarEntries} caption={data ? `Comparado con ${modeLabel}` : "Esperando datos"} modeLabel={modeLabel} />
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <span>Tests recientes</span>
            <HelpTooltip helpKey="athlete.progress" />
          </div>
          <ProgressTimeline items={timelineItems} />
        </div>
      </div>

      <MetricsPRs
        metrics={metrics}
        prs={prs}
        allPrs={allPrs}
      />

      {loading && <p className="text-sm text-slate-400">Cargando datos del atleta...</p>}
    </div>
  );
}
