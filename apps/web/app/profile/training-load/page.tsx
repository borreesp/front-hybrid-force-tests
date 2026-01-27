"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Section, Card, Metric } from "@thrifty/ui";
import { api } from "../../../lib/api";
import type { TrainingLoad, TrainingLoadDetail } from "../../../lib/types";
import { useAuth } from "../../../lib/auth-client";
import { HelpTooltip } from "../../../components/ui/HelpTooltip";

export default function TrainingLoadPage() {
  const { user } = useAuth();
  const [loads, setLoads] = useState<TrainingLoad[]>([]);
  const [details, setDetails] = useState<TrainingLoadDetail[]>([]);

  useEffect(() => {
    if (!user) return;
    api
      .getTrainingLoad(user.id)
      .then(setLoads)
      .catch(() => setLoads([]));
    api
      .getTrainingLoadDetails(user.id)
      .then(setDetails)
      .catch(() => setDetails([]));
  }, [user]);

  const latest = loads[0];
  const avgRatio = useMemo(() => {
    if (!loads.length) return null;
    const ratios = loads.map((l) => Number(l.load_ratio ?? 0)).filter(Boolean);
    if (!ratios.length) return null;
    return (ratios.reduce((a, b) => a + b, 0) / ratios.length).toFixed(2);
  }, [loads]);

  return (
    <div className="space-y-6">
      <Section title="Training load" description="Carga aguda vs cronica por usuario" actions={<div className="text-xs text-slate-400">user_id={user?.id ?? "-"}</div>}>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="relative">
            <Metric label="Aguda" value={latest?.acute_load ?? "-"} hint="Sesiones recientes" />
            <div className="absolute right-2 top-2">
              <HelpTooltip helpKey="trainingLoad.acute" />
            </div>
          </div>
          <div className="relative">
            <Metric label="Cronica" value={latest?.chronic_load ?? "-"} hint="Media 7-10d" />
            <div className="absolute right-2 top-2">
              <HelpTooltip helpKey="trainingLoad.chronic" />
            </div>
          </div>
          <div className="relative">
            <Metric label="Ratio" value={latest?.load_ratio ?? avgRatio ?? "-"} hint="Objetivo 0.8-1.2" />
            <div className="absolute right-2 top-2">
              <HelpTooltip helpKey="trainingLoad.ratio" />
            </div>
          </div>
        </div>
      </Section>

      <Section title="Historico de carga">
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <p className="mb-2 text-sm text-slate-400">Agregada por día</p>
            <div className="grid grid-cols-5 gap-3 text-xs text-slate-300">
              <span className="font-semibold text-slate-200">Fecha</span>
              <span className="font-semibold text-slate-200">Aguda</span>
              <span className="font-semibold text-slate-200">Cronica</span>
              <span className="font-semibold text-slate-200">Ratio</span>
              <span className="font-semibold text-slate-200">Notas</span>
              {loads.map((l) => (
                <React.Fragment key={l.id}>
                  <span>{l.load_date}</span>
                  <span>{l.acute_load ?? "-"}</span>
                  <span>{l.chronic_load ?? "-"}</span>
                  <span>{l.load_ratio ?? "-"}</span>
                  <span className="truncate text-slate-400">{l.notes ?? ""}</span>
                </React.Fragment>
              ))}
            </div>
          </Card>
          <Card>
            <p className="mb-2 text-sm text-slate-400">Detalle por WOD (últimas 50 ejecuciones)</p>
            <div className="grid grid-cols-5 gap-3 text-xs text-slate-300">
              <span className="font-semibold text-slate-200">Fecha</span>
              <span className="font-semibold text-slate-200">WOD</span>
              <span className="font-semibold text-slate-200">Aguda</span>
              <span className="font-semibold text-slate-200">Cronica</span>
              <span className="font-semibold text-slate-200">Notas</span>
              {details.map((d) => (
                <React.Fragment key={d.id}>
                  <span>{d.load_date ?? "-"}</span>
                  <span className="truncate">{d.workout_title ?? `WOD ${d.workout_id ?? ""}`}</span>
                  <span>{d.acute_load ?? "-"}</span>
                  <span>{d.chronic_load ?? "-"}</span>
                  <span className="truncate text-slate-400">{d.notes ?? ""}</span>
                </React.Fragment>
              ))}
            </div>
          </Card>
        </div>
      </Section>
    </div>
  );
}
