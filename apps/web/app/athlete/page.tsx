"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AthleteHeader } from "../../components/athlete/AthleteHeader";
import { AthleteRadar } from "../../components/athlete/AthleteRadar";
import { ProgressTimeline } from "../../components/athlete/ProgressTimeline";
import { MetricsPRs } from "../../components/athlete/MetricsPRs";
import { EquipmentSkills } from "../../components/athlete/EquipmentSkills";
import { FatigueStatus } from "../../components/athlete/FatigueStatus";
import { AchievementGrid } from "../../components/athlete/AchievementGrid";
import { MissionBoard } from "../../components/athlete/MissionBoard";
import { BenchmarkSummary } from "../../components/athlete/BenchmarkSummary";
import { useAthleteProfile } from "../../hooks/useAthlete";
import { api } from "../../lib/api";
import type { AthletePrStat, AthleteSkillStat, CapacityProfileItem, Equipment } from "../../lib/types";
import { useAppStore } from "@thrifty/utils";
import { HelpTooltip } from "../../components/ui/HelpTooltip";
import { normalizeCapacity, type ComparisonMode, type CapacityKey } from "../../lib/capacityNormalization";

export default function AthletePage() {
  const router = useRouter();
  const { data, loading, error } = useAthleteProfile();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [topSkills, setTopSkills] = useState<AthleteSkillStat[]>([]);
  const [topPrs, setTopPrs] = useState<AthletePrStat[]>([]);
  const [capacityProfile, setCapacityProfile] = useState<CapacityProfileItem[]>([]);
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>("level");
  const user = useAppStore((s) => s.user);

  useEffect(() => {
    api.getEquipment().then(setEquipment).catch(() => setEquipment([]));
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    api.getAthleteSkillsTop(user.id, 5)
      .then((res) => setTopSkills(res as AthleteSkillStat[]))
      .catch(() => setTopSkills([]));
    api.getAthletePrsTop(user.id, 5)
      .then((res) => setTopPrs(res as AthletePrStat[]))
      .catch(() => setTopPrs([]));
    if (!data?.capacities?.length) {
      const userIdNum = Number(user.id);
      const tryIds = [user.id, userIdNum === 1 ? 2 : undefined].filter(Boolean) as (number | string)[];
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

  const latestLoad = data?.training_load?.[0];
  const loadRatio = latestLoad?.load_ratio ?? null;
  const statusLabel: "verde" | "amarillo" | "rojo" =
    loadRatio && loadRatio > 1.2 ? "rojo" : loadRatio && loadRatio > 1.0 ? "amarillo" : "verde";
  const statusMessage = loadRatio
    ? statusLabel === "rojo"
      ? "Riesgo de fatiga, reduce intensidad"
      : statusLabel === "amarillo"
        ? "Carga media, escucha sensaciones"
        : "Carga equilibrada, ideal para tecnica ligera"
    : "Sin datos de carga";

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
    const bio = data?.biometrics;
    return [
      { label: "FC reposo", value: bio?.hr_rest ? `${bio.hr_rest} bpm` : "-", hint: bio?.hr_avg ? `media ${bio.hr_avg} bpm` : undefined },
      { label: "VO2 est.", value: bio?.vo2_est ? `${bio.vo2_est} ml/kg/min` : "-", hint: bio?.hrv ? `HRV ${bio.hrv}` : undefined },
      {
        label: "Recuperacion",
        value: bio?.recovery_time_hours ? `${bio.recovery_time_hours} h` : "-",
        hint: latestLoad?.acute_load ? `Carga: ${latestLoad.acute_load}` : undefined
      }
    ];
  }, [data?.biometrics, latestLoad?.acute_load]);

  const prs = useMemo(() => {
    const source = topPrs.length ? topPrs : data?.prs ?? [];
    return source.slice(0, 5).map((pr) => ({
      name: (pr as any).name ?? (pr as any).movement ?? "PR",
      score: `${pr.value}${pr.unit ? ` ${pr.unit}` : ""}`,
      date: pr.achieved_at ? new Date(pr.achieved_at).toLocaleDateString("es-ES") : "-"
    }));
  }, [data?.prs, topPrs]);

  const skills = useMemo(() => {
    const source: (AthleteSkillStat | any)[] = topSkills.length ? topSkills : (data?.skills ?? []);
    if (!source.length) return [];
    const maxVal = Math.max(...source.map((s) => Number((s as any).value ?? (s as any).score ?? 0)));
    const humanUnit = (u?: string | null) => {
      if (!u) return "pts";
      if (u === "total_kg") return "kg";
      if (u === "total_reps") return "reps";
      if (u === "total_meters") return "m";
      if (u === "total_cals") return "cals";
      if (u === "total_seconds") return "s";
      return u;
    };
    return source.slice(0, 5).map((s) => {
      const value = Number((s as any).value ?? (s as any).score ?? 0);
      const unit = humanUnit((s as any).unit);
      return {
        name: (s as any).name ?? (s as any).movement,
        valueLabel: `${value.toFixed(0)} ${unit ?? ""}`.trim(),
        progress: maxVal ? Math.round((value / maxVal) * 100) : undefined
      };
    });
  }, [data?.skills, topSkills]);

  const headerName = user?.name || "Atleta";
  const levelLabel = data?.career ? `Nivel ${data.career.level}` : "Nivel 0";
  const xpLabel = data?.career ? data.career.xp_total : 0;
  const progress = data?.career
    ? Math.min(Math.floor(Math.max(0, Math.min(data.career.progress_pct ?? 0, 100))), 99)
    : 0;

  const timelineItems = useMemo(() => {
    if (!data?.achievements.length) {
      return [
        { title: "Sin logros aun", date: "Hoy", type: "Carrera", delta: "+0 XP" }
      ];
    }
    return data.achievements.slice(-3).map((achievement) => ({
      title: achievement.name,
      date: achievement.unlocked_at ? new Date(achievement.unlocked_at).toLocaleDateString("es-ES") : "Hoy",
      type: achievement.category ?? "Logro",
      delta: achievement.xp_reward ? `+${achievement.xp_reward.toFixed(0)} XP` : undefined
    }));
  }, [data?.achievements]);

  const gear = useMemo((): { name: string; status?: string }[] => {
    if (!equipment.length) return [];
    return equipment.slice(0, 4).map((eq) => ({
      name: eq.name,
      status: eq.category ?? undefined
    }));
  }, [equipment]);

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
          <FatigueStatus
            status={statusLabel}
            message={statusMessage}
            metrics={[
              { label: "Carga 7d", value: latestLoad?.acute_load ? `${latestLoad.acute_load}` : "-" },
              { label: "Fatiga", value: statusLabel === "rojo" ? "Alta" : statusLabel === "amarillo" ? "Media" : "Baja" },
              { label: "Ratio", value: loadRatio ? loadRatio.toFixed(2) : "-" }
            ]}
          />
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <span>Progreso y logros</span>
            <HelpTooltip helpKey="athlete.progress" />
          </div>
          <ProgressTimeline items={timelineItems} />
          <BenchmarkSummary benchmarks={data?.benchmarks ?? []} />
        </div>
      </div>

      <MetricsPRs
        metrics={metrics}
        prs={prs}
        onViewMorePrs={() => {
          if (user?.id) router.push(`/athlete/${user.id}/stats?tab=prs`);
        }}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <AchievementGrid achievements={data?.achievements ?? []} />
        </div>
        <MissionBoard missions={data?.missions ?? []} />
      </div>

      <EquipmentSkills
        gear={gear}
        skills={skills.length ? skills : []}
        onViewMoreSkills={() => {
          if (user?.id) router.push(`/athlete/${user.id}/stats?tab=skills`);
        }}
      />

      {loading && <p className="text-sm text-slate-400">Cargando datos del atleta...</p>}
    </div>
  );
}
