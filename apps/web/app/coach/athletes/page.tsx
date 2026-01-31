"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, Section } from "@thrifty/ui";
import { api } from "../../../lib/api";
import type { CoachAthleteSummary } from "../../../lib/types";

const statusFor = (lastTest?: string | null, testsTotal = 0) => {
  if (!testsTotal) return { label: "Sin datos", tone: "text-rose-200" };
  if (!lastTest) return { label: "Toca test", tone: "text-amber-200" };
  const days = Math.floor((Date.now() - new Date(lastTest).getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 30) return { label: "Al día", tone: "text-emerald-200" };
  return { label: "Toca test", tone: "text-amber-200" };
};

export default function CoachAthletesPage() {
  const [summaries, setSummaries] = useState<CoachAthleteSummary[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setStatus("loading");
    api
      .getCoachAthletesSummary()
      .then((rows) => {
        setSummaries(rows ?? []);
        setStatus("idle");
      })
      .catch((err) => {
        setError(err.message ?? "Error");
        setStatus("error");
      });
  }, []);

  const sortedUsers = useMemo(() => {
    return [...summaries].sort((a, b) => (a.display_name || "").localeCompare(b.display_name || ""));
  }, [summaries]);

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
          {sortedUsers.map((summary) => {
            const statusInfo = statusFor(summary.last_test_at ?? null, summary.tests_total ?? 0);
            const progressPct = Math.min(100, Math.max(0, Math.round(summary.progress_pct ?? 0)));
            return (
              <Card key={summary.id} className="bg-slate-900/70 ring-1 ring-white/5">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white">{summary.display_name}</p>
                      {summary.email && <p className="text-xs text-slate-400">{summary.email}</p>}
                    </div>
                    <span className={`text-xs font-semibold ${statusInfo.tone}`}>{statusInfo.label}</span>
                  </div>
                  <div className="grid gap-3 text-xs text-slate-300 md:grid-cols-3">
                    <div className="rounded-lg bg-white/5 px-3 py-2">
                      <p className="text-[11px] text-slate-400">Último test</p>
                      <p>
                        {summary.last_test_at ? new Date(summary.last_test_at).toLocaleDateString("es-ES") : "—"}
                      </p>
                    </div>
                    <div className="rounded-lg bg-white/5 px-3 py-2">
                      <p className="text-[11px] text-slate-400">Tests</p>
                      <p>{summary.tests_total ?? 0}</p>
                    </div>
                    <div className="rounded-lg bg-white/5 px-3 py-2">
                      <p className="text-[11px] text-slate-400">Progreso</p>
                      <p>{progressPct}%</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Link href={`/coach/athletes/${summary.id}`} className="text-sm font-semibold text-cyan-300">
                      Ver
                    </Link>
                    <Link
                      href={`/coach/workouts?athleteId=${summary.id}`}
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
