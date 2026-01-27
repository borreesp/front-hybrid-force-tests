"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { Route } from "next";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { api } from "../../../../lib/api";
import type { AthletePrStat, AthleteSkillStat, AthleteStatsOverview } from "../../../../lib/types";

type TabKey = "summary" | "skills" | "prs";

const tabs: { key: TabKey; label: string }[] = [
  { key: "summary", label: "Resumen" },
  { key: "skills", label: "Skills" },
  { key: "prs", label: "PRs" }
];

export default function AthleteStatsPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const athleteId = params?.id;
  const initialTab = (searchParams?.get("tab") as TabKey) || "summary";
  const initialMetric = (searchParams?.get("metric") as string) || "all";
  const [tab, setTab] = useState<TabKey>(initialTab);
  const [metricFilter, setMetricFilter] = useState<string>(initialMetric);
  const [skills, setSkills] = useState<AthleteSkillStat[]>([]);
  const [prs, setPrs] = useState<AthletePrStat[]>([]);
  const [overview, setOverview] = useState<AthleteStatsOverview | null>(null);
  const [skillQuery, setSkillQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!athleteId) return;
    setLoading(true);
    Promise.all([
      api.getAthleteSkills(athleteId),
      api.getAthletePrs(athleteId),
      api.getAthleteStatsOverview(athleteId)
    ] as const)
      .then(([skillsRes, prsRes, overviewRes]) => {
        setSkills(skillsRes as AthleteSkillStat[]);
        setPrs(prsRes as AthletePrStat[]);
        setOverview(overviewRes as AthleteStatsOverview);
        setError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudieron cargar las stats"))
      .finally(() => setLoading(false));
  }, [athleteId]);

  const filteredSkills = useMemo(() => {
    const list = skills
      .map((s) => {
        const breakdown = (s as any).breakdown || {};
        let value = s.value;
        let unit = s.unit || "pts";
        if (metricFilter === "kg") {
          value = breakdown.total_kg || 0;
          unit = "kg";
        } else if (metricFilter === "reps") {
          value = breakdown.total_reps || 0;
          unit = "reps";
        } else if (metricFilter === "meters") {
          value = breakdown.total_meters || 0;
          unit = "m";
        } else if (metricFilter === "cals") {
          value = breakdown.total_cals || 0;
          unit = "cals";
        } else if (metricFilter === "seconds") {
          value = breakdown.total_seconds || 0;
          unit = "s";
        }
        return { ...s, displayValue: value, displayUnit: unit };
      })
      .filter((s) => {
        if (metricFilter !== "all" && (!s.displayValue || s.displayValue <= 0)) return false;
        return true;
      });
    const q = skillQuery.toLowerCase();
    return q ? list.filter((s) => s.name.toLowerCase().includes(q)) : list;
  }, [skillQuery, skills, metricFilter]);

  const topSkills = overview?.topSkills ?? [];
  const topPrs = overview?.topPrs ?? [];
  const totals = overview?.totals;

  const onTabChange = (next: TabKey) => {
    setTab(next);
    if (athleteId) {
      const url = `/athlete/${athleteId}/stats?tab=${next}&metric=${metricFilter}`;
      router.replace(url as Route);
    }
  };

  if (loading) {
    return <p className="text-sm text-slate-400">Cargando stats...</p>;
  }

  if (error) {
    return <p className="text-sm text-rose-300">{error}</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => onTabChange(t.key)}
            className={`rounded-full px-4 py-2 text-sm ${
              tab === t.key ? "bg-cyan-500 text-white" : "bg-slate-800 text-slate-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "summary" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl bg-slate-900/70 p-4 ring-1 ring-white/5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-300">Top Skills</p>
            </div>
            <div className="mt-3 space-y-2 text-sm text-slate-200">
              {topSkills.map((s) => (
                <div key={`${s.name}-${s.value}`} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                  <span>{s.name}</span>
                  <span className="text-cyan-200">
                    {s.value.toFixed(0)} {s.unit ?? "pts"}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl bg-slate-900/70 p-4 ring-1 ring-white/5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-300">Top PRs</p>
            </div>
            <div className="mt-3 space-y-2 text-sm text-slate-200">
              {topPrs.map((pr) => (
                <div key={`${pr.name}-${pr.value}`} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                  <div>
                    <p className="font-semibold text-white">{pr.name}</p>
                    <p className="text-xs text-slate-400">{pr.type}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-cyan-200">
                      {pr.value} {pr.unit ?? ""}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {pr.achieved_at ? new Date(pr.achieved_at).toLocaleDateString("es-ES") : "-"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {totals && (
            <div className="lg:col-span-2 rounded-2xl bg-slate-900/70 p-4 ring-1 ring-white/5">
              <p className="text-sm text-slate-300">Totales</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-3 text-sm text-slate-200">
                <div className="rounded-lg bg-white/5 px-3 py-2">
                  <p className="text-xs text-slate-400">Skills</p>
                  <p className="text-lg font-semibold text-white">{totals.skills_total ?? 0}</p>
                </div>
                <div className="rounded-lg bg-white/5 px-3 py-2">
                  <p className="text-xs text-slate-400">PRs</p>
                  <p className="text-lg font-semibold text-white">{totals.prs_total ?? topPrs.length}</p>
                </div>
                <div className="rounded-lg bg-white/5 px-3 py-2">
                  <p className="text-xs text-slate-400">Segundos totales</p>
                  <p className="text-lg font-semibold text-white">{totals.total_seconds ?? 0}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "skills" && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-lg font-semibold text-white">Skills</h2>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <select
                value={metricFilter}
                onChange={(e) => {
                  setMetricFilter(e.target.value);
                  if (athleteId) {
                    router.replace(`/athlete/${athleteId}/stats?tab=skills&metric=${e.target.value}`);
                  }
                }}
                className="rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-white"
              >
                <option value="all">Todas las unidades</option>
                <option value="kg">Kg (tonelaje)</option>
                <option value="reps">Repeticiones</option>
                <option value="meters">Metros</option>
                <option value="cals">Calorías</option>
                <option value="seconds">Segundos</option>
              </select>
              <input
                placeholder="Buscar skill"
                value={skillQuery}
                onChange={(e) => setSkillQuery(e.target.value)}
                className="rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-white"
              />
            </div>
          </div>
          <div className="space-y-2">
            {filteredSkills.map((s) => (
              <div key={`${s.name}-${s.value}`} className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3 text-sm text-slate-200">
                <div>
                  <p className="font-semibold text-white">{s.name}</p>
                  {s.category && <p className="text-xs text-slate-400">{s.category}</p>}
                </div>
                <div className="text-right">
                  <p className="text-cyan-200">
                    {Number((s as any).displayValue ?? s.value).toFixed(0)} {(s as any).displayUnit ?? s.unit ?? "pts"}
                  </p>
                  {s.measured_at && (
                    <p className="text-[11px] text-slate-400">{new Date(s.measured_at).toLocaleDateString("es-ES")}</p>
                  )}
                </div>
              </div>
            ))}
            {!filteredSkills.length && <p className="text-sm text-slate-400">Sin skills registradas.</p>}
          </div>
        </div>
      )}

      {tab === "prs" && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">PRs / Tests</h2>
          <div className="space-y-2">
            {prs.map((pr) => (
              <div key={`${pr.name}-${pr.value}`} className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3 text-sm text-slate-200">
                <div>
                  <p className="font-semibold text-white">{pr.name}</p>
                  {pr.type && <p className="text-xs text-slate-400">{pr.type}</p>}
                </div>
                <div className="text-right">
                  <p className="text-cyan-200">
                    {pr.value} {pr.unit ?? ""}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {pr.achieved_at ? new Date(pr.achieved_at).toLocaleDateString("es-ES") : "-"}
                  </p>
                </div>
              </div>
            ))}
            {!prs.length && <p className="text-sm text-slate-400">Sin PRs aún.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
