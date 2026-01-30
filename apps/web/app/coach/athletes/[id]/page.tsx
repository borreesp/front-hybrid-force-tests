"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { AthleteHeader } from "../../../../components/athlete/AthleteHeader";
import { AthleteRadar } from "../../../../components/athlete/AthleteRadar";
import { ProgressTimeline } from "../../../../components/athlete/ProgressTimeline";
import { MetricsPRs } from "../../../../components/athlete/MetricsPRs";
import { HelpTooltip } from "../../../../components/ui/HelpTooltip";
import { api } from "../../../../lib/api";
import type { AthletePrStat, AthleteStatsOverview, CapacityProfileItem, UserRead } from "../../../../lib/types";
import { normalizeCapacity, type CapacityKey } from "../../../../lib/capacityNormalization";

type SummaryState = {
  user?: UserRead | null;
  capacityProfile: CapacityProfileItem[];
  overview?: AthleteStatsOverview | null;
  prs: AthletePrStat[];
};

export default function CoachAthleteDetailPage() {
  const params = useParams<{ id: string }>();
  const athleteId = params?.id;
  const [state, setState] = useState<SummaryState>({
    capacityProfile: [],
    prs: []
  });
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!athleteId) return;
    setStatus("loading");
    Promise.all([
      api.getUser(athleteId),
      api.getCapacityProfile(athleteId),
      api.getAthletePrs(athleteId),
      api.getAthleteStatsOverview(athleteId)
    ])
      .then(([user, profile, prs, overview]) => {
        setState({
          user,
          capacityProfile: profile.capacities ?? [],
          prs: (prs as AthletePrStat[]) ?? [],
          overview: overview as AthleteStatsOverview
        });
        setStatus("idle");
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "No se pudo cargar el atleta");
        setStatus("error");
      });
  }, [athleteId]);

  const athleteName = state.user?.name ?? "Atleta";
  const totals = state.overview?.totals;

  const metrics = useMemo(() => {
    const out = [
      { label: "PRs registrados", value: `${totals?.prs_total ?? state.prs.length}` },
      { label: "Total kg", value: `${totals?.total_kg ?? 0}` },
      { label: "Total reps", value: `${totals?.total_reps ?? 0}` },
      { label: "Total metros", value: `${totals?.total_meters ?? 0}` },
      { label: "Total calorías", value: `${totals?.total_cals ?? 0}` },
      { label: "Tiempo total", value: `${totals?.total_seconds ?? 0} s` }
    ];
    return out.slice(0, 4);
  }, [state.prs.length, totals]);

  const radarEntries = useMemo(() => {
    const map: Record<string, number> = {};
    state.capacityProfile.forEach((c) => {
      const capName = (c?.capacity_code || c?.capacity_name || "").toString();
      if (!capName) return;
      map[capName.toLowerCase()] = c.value ?? 0;
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
        mode: "level",
        athleteLevel: 1,
        capacityKey: d.key
      })
    }));
  }, [state.capacityProfile]);

  const prsSummary = useMemo(() => {
    return state.prs.slice(0, 5).map((pr) => ({
      name: pr.name ?? "PR",
      score: `${pr.value}${pr.unit ? ` ${pr.unit}` : ""}`,
      date: pr.achieved_at ? new Date(pr.achieved_at).toLocaleDateString("es-ES") : "-"
    }));
  }, [state.prs]);

  const timelineItems = useMemo(() => {
    if (!state.prs.length) {
      return [{ title: "Sin tests aun", date: "Hoy", type: "Test", delta: "+0 XP" }];
    }
    return state.prs
      .slice(0, 5)
      .map((pr) => ({
        title: pr.name ?? "Test",
        date: pr.achieved_at ? new Date(pr.achieved_at).toLocaleDateString("es-ES") : "—",
        type: pr.type ?? "PR",
        delta: pr.value ? `${pr.value}${pr.unit ? ` ${pr.unit}` : ""}` : undefined
      }));
  }, [state.prs]);

  if (status === "loading") {
    return <p className="text-sm text-slate-400">Cargando atleta...</p>;
  }

  if (status === "error") {
    return <p className="text-sm text-rose-300">{error}</p>;
  }

  return (
    <div className="space-y-8">
      <AthleteHeader
        name={athleteName}
        level={"Atleta"}
        xp={totals?.prs_total ?? 0}
        state="Seguimiento activo"
        progress={Math.min(99, (totals?.prs_total ?? 0) * 5)}
        statusTone="verde"
      />

      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
        <span>Radar de capacidades</span>
        <HelpTooltip helpKey="athlete.radar" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AthleteRadar entries={radarEntries} caption="Vista coach" modeLabel="nivel" />
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <span>Evolución de tests</span>
            <HelpTooltip helpKey="athlete.progress" />
          </div>
          <ProgressTimeline items={timelineItems} />
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <a
          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white"
          href={`/coach/workouts?athleteId=${athleteId}`}
        >
          Asignar test existente
        </a>
        <a
          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white"
          href={`/coach/workouts/new?athleteId=${athleteId}`}
        >
          Crear test en builder
        </a>
      </div>

      <MetricsPRs metrics={metrics} prs={prsSummary} allPrs={state.prs.map((pr) => ({
        name: pr.name ?? "PR",
        value: pr.value ?? 0,
        unit: pr.unit ?? undefined,
        type: pr.type ?? undefined,
        date: pr.achieved_at ?? null
      }))} />
    </div>
  );
}
