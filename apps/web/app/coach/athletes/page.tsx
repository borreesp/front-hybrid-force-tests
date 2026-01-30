"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, Section } from "@thrifty/ui";
import { api } from "../../../lib/api";
import type { AthletePrStat, AthleteStatsOverview, UserRead } from "../../../lib/types";

type AthleteSummary = {
  lastTest?: string | null;
  prsCount: number;
  totals?: AthleteStatsOverview["totals"];
};

const statusFor = (lastTest?: string | null, prsCount = 0) => {
  if (!prsCount) return { label: "Sin datos", tone: "text-rose-200" };
  if (!lastTest) return { label: "Toca test", tone: "text-amber-200" };
  const days = Math.floor((Date.now() - new Date(lastTest).getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 30) return { label: "Al día", tone: "text-emerald-200" };
  return { label: "Toca test", tone: "text-amber-200" };
};

export default function CoachAthletesPage() {
  const [users, setUsers] = useState<UserRead[]>([]);
  const [summaries, setSummaries] = useState<Record<number, AthleteSummary>>({});
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setStatus("loading");
    api
      .getUsers()
      .then((data) => {
        const athletes = data.filter((u) => u.role === "ATHLETE");
        setUsers(athletes);
        return Promise.all(
          athletes.map(async (athlete) => {
            const [overview, prs] = await Promise.all([
              api.getAthleteStatsOverview(athlete.id).catch(() => null),
              api.getAthletePrs(athlete.id).catch(() => [] as AthletePrStat[])
            ]);
            const lastTest = (prs as AthletePrStat[])
              .filter((p) => p.achieved_at)
              .sort((a, b) => new Date(b.achieved_at ?? "").getTime() - new Date(a.achieved_at ?? "").getTime())[0]
              ?.achieved_at;
            return {
              id: athlete.id,
              summary: {
                lastTest: lastTest ?? null,
                prsCount: (overview as AthleteStatsOverview | null)?.totals?.prs_total ?? prs.length,
                totals: (overview as AthleteStatsOverview | null)?.totals
              }
            };
          })
        );
      })
      .then((rows) => {
        if (!rows) return;
        const map: Record<number, AthleteSummary> = {};
        rows.forEach((row) => {
          map[row.id] = row.summary;
        });
        setSummaries(map);
        setStatus("idle");
      })
      .catch((err) => {
        setError(err.message ?? "Error");
        setStatus("error");
      });
  }, []);

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => a.name.localeCompare(b.name));
  }, [users]);

  return (
    <div className="space-y-6">
      <Section title="Atletas" description="Listado de atletas para seguimiento.">
        {status === "error" && (
          <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            Error al cargar atletas: {error}
          </div>
        )}
        {status === "idle" && sortedUsers.length === 0 && (
          <p className="text-sm text-slate-400">No hay atletas disponibles.</p>
        )}
        <div className="grid gap-3 lg:grid-cols-2">
          {sortedUsers.map((user) => {
            const summary = summaries[user.id];
            const statusInfo = statusFor(summary?.lastTest, summary?.prsCount ?? 0);
            const progressPct = Math.min(100, (summary?.prsCount ?? 0) * 10);
            return (
              <Card key={user.id} className="bg-slate-900/70 ring-1 ring-white/5">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white">{user.name}</p>
                      <p className="text-xs text-slate-400">{user.email}</p>
                    </div>
                    <span className={`text-xs font-semibold ${statusInfo.tone}`}>{statusInfo.label}</span>
                  </div>
                  <div className="grid gap-3 text-xs text-slate-300 md:grid-cols-3">
                    <div className="rounded-lg bg-white/5 px-3 py-2">
                      <p className="text-[11px] text-slate-400">Último test</p>
                      <p>
                        {summary?.lastTest ? new Date(summary.lastTest).toLocaleDateString("es-ES") : "—"}
                      </p>
                    </div>
                    <div className="rounded-lg bg-white/5 px-3 py-2">
                      <p className="text-[11px] text-slate-400">PRs</p>
                      <p>{summary?.prsCount ?? 0}</p>
                    </div>
                    <div className="rounded-lg bg-white/5 px-3 py-2">
                      <p className="text-[11px] text-slate-400">Progreso</p>
                      <p>{progressPct}%</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Link href={`/coach/athletes/${user.id}`} className="text-sm font-semibold text-cyan-300">
                      Ver
                    </Link>
                    <Link
                      href={`/coach/workouts?athleteId=${user.id}`}
                      className="text-xs font-semibold text-slate-200"
                    >
                      Asignar test
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </Section>
    </div>
  );
}
