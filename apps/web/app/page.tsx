"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { Button, Card, Metric, Section } from "@thrifty/ui";
import { api } from "../lib/api";
import type { AthleteProfileResponse, TrainingLoadDetail, CapacityProfileItem } from "../lib/types";
import { useAuth } from "../lib/auth-client";
import { HelpTooltip } from "../components/ui/HelpTooltip";

const quickActions: { label: string; hint: string; href: Route }[] = [
  { label: "Analizar WOD", hint: "Carga estimada y fatiga", href: "/wod-analysis" },
  { label: "Historial", hint: "Tus ultimas sesiones", href: "/workouts" },
  { label: "Atleta", hint: "Perfil y progreso", href: "/athlete" }
];

type QuickMetrics = {
  xp: number;
  sessions7d: number;
  carga7d: number;
  topCapacity?: { name: string; value: number };
  fatigue?: number | null;
  recoveryText: string;
};

export default function DashboardPage() {
  const [data, setData] = useState<AthleteProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadDetails, setLoadDetails] = useState<TrainingLoadDetail[]>([]);
  const [capacityProfile, setCapacityProfile] = useState<CapacityProfileItem[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const profile = await api.getAthleteProfile();
        if (!mounted) return;
        setData(profile);
        if (user) {
          const details = await api.getTrainingLoadDetails(user.id);
          if (mounted) setLoadDetails(details);
          // fallback de capacidades si el perfil viene sin datos
          if (!profile.capacities?.length) {
            const userIdNum = Number(user.id);
            const tryIds = [user.id, userIdNum === 1 ? 2 : undefined].filter(Boolean) as (number | string)[];
            for (const candidate of tryIds) {
              try {
                const res = await api.getCapacityProfile(candidate);
                if (mounted && res.capacities?.length) {
                  setCapacityProfile(res.capacities);
                  break;
                }
              } catch {
                /* continue */
              }
            }
          }
        }
      } catch (err) {
        if (!mounted) return;
        setError("No se pudieron cargar los datos del atleta");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const latestLoad = data?.training_load?.[0];
  const hintCareer = data ? `Actualizado: ${new Date(data.career?.updated_at || new Date()).toLocaleDateString()}` : "Sin datos";

  const loadBars = useMemo(() => {
    const today = new Date();
    const source = data?.training_load || [];
    const detail = loadDetails || [];
    const byDate = new Map(source.map((d) => [new Date(d.load_date).toDateString(), d]));
    const executionsByDate = new Map<string, number>();
    detail.forEach((d) => {
      if (!d.load_date) return;
      const key = new Date(d.load_date).toDateString();
      executionsByDate.set(key, (executionsByDate.get(key) || 0) + 1);
    });

    const last7 = Array.from({ length: 7 }).map((_, idx) => {
      const day = new Date(today);
      day.setDate(today.getDate() - (6 - idx));
      const key = day.toDateString();
      const found = byDate.get(key);
      const execs = executionsByDate.get(key) || ((found?.acute_load ?? 0) > 0 ? 1 : 0);
      return {
        load_date: day.toISOString(),
        acute_load: found?.acute_load ?? 0,
        chronic_load: found?.chronic_load ?? 0,
        load_ratio: found?.load_ratio ?? null,
        label: day.toLocaleDateString(undefined, { weekday: "short" }),
        execs,
      };
    });
    const maxLoad = Math.max(
      1,
      ...last7.map((d) => Number(d.acute_load || 0)),
      ...last7.map((d) => Number(d.chronic_load || 0))
    );
    return last7.map((d, idx) => {
      const acute = Number(d.acute_load || 0);
      const chronic = Number(d.chronic_load || 0);
      const heightBoost = d.execs > 1 ? 10 * (d.execs - 1) : 0;
      return {
        key: d.load_date + idx,
        label: d.label,
        acute,
        chronic,
        acuteHeight: Math.max(6, (acute / maxLoad) * 120 + heightBoost),
        chronicHeight: Math.max(4, (chronic / maxLoad) * 120 + heightBoost / 2),
        ratio: d.load_ratio ?? null,
        execs: d.execs,
      };
    });
  }, [data, loadDetails]);

  const quick: QuickMetrics = useMemo(() => {
    if (!data) {
      return {
        xp: 0,
        sessions7d: 0,
        carga7d: 0,
        recoveryText: "A la espera de tus primeras sesiones",
        fatigue: null
      };
    }

    const today = new Date();
    const training = data.training_load || [];
    const sessionsFromDetails = (loadDetails || []).filter((t) => {
      if (!t.load_date) return false;
      const d = new Date(t.load_date);
      const diff = (today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
      return diff <= 7;
    }).length;
    // fallback: contar días con carga>0 si no hay detalle
    const sessionsFromLoad =
      sessionsFromDetails === 0
        ? training.filter((t) => {
            const d = new Date(t.load_date);
            const diff = (today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
            return diff <= 7 && (t.acute_load ?? 0) > 0;
          }).length
        : 0;
    // como respaldo adicional, usar el recuento de execs en las barras si fuese mayor
    const execsFromBars = loadBars.reduce((acc, b) => acc + (b.execs || 0), 0);
    const sessions7d = Math.max(sessionsFromDetails + sessionsFromLoad, execsFromBars);
    const carga7d =
      training
        .filter((t) => {
          const d = new Date(t.load_date);
          const diff = (today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
          return diff <= 7;
        })
        .reduce((acc, t) => acc + (t.acute_load ?? 0), 0) ?? 0;

    const capsSource = data.capacities && data.capacities.length > 0 ? data.capacities : capacityProfile;
    const getCapName = (c: any) => c?.capacity ?? c?.capacity_name ?? c?.capacity_code ?? "Capacidad";
    const topCapacity =
      capsSource && capsSource.length > 0
        ? capsSource.reduce<{ name: string; value: number } | undefined>((prev, curr) => {
            if (!prev || curr.value > prev.value) {
              return { name: getCapName(curr), value: curr.value };
            }
            return prev;
          }, undefined)
        : undefined;

    const fatigue = data.biometrics?.fatigue_score ?? null;
    const recoveryText = fatigue != null ? `Fatiga ${fatigue}` : "A la espera de tus primeras sesiones";

    return {
      xp: data.career?.xp_total ?? 0,
      sessions7d,
      carga7d: Math.round(carga7d),
      topCapacity,
      fatigue,
      recoveryText
    };
  }, [data, loadDetails, loadBars, capacityProfile]);

  const capacityChart = useMemo(() => {
    const getCapName = (c: any) => c?.capacity ?? c?.capacity_name ?? c?.capacity_code ?? "Capacidad";
    const caps = (data?.capacities?.length ? data.capacities : capacityProfile || []).slice(0, 6);
    const total = caps.reduce((acc, c) => acc + (c.value || 0), 0) || 1;
    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    let offsetAcc = 0;
    const palette = ["#5eead4", "#38bdf8", "#a78bfa", "#f472b6", "#facc15", "#22d3ee"];
    const segments = caps.map((c, idx) => {
      const pct = (c.value || 0) / total;
      const dash = Math.max(0, pct * circumference);
      const seg = {
        label: getCapName(c),
        value: c.value,
        dash,
        offset: offsetAcc,
        color: palette[idx % palette.length]
      };
      offsetAcc += dash;
      return seg;
    });
    return { segments, radius, circumference };
  }, [data, capacityProfile]);

  const suggestions = useMemo(() => {
    const out: { title: string; detail: string; cta: string; accent: string; href?: Route }[] = [];
    const fatigueScore = data?.biometrics?.fatigue_score ?? quick.fatigue ?? null;
    const loadRatio = data?.training_load?.[0]?.load_ratio ?? null;
    const hasHighFatigue = (fatigueScore ?? 0) >= 70 || (loadRatio ?? 0) > 1.2;

    if (hasHighFatigue) {
      out.push({
        title: "Descanso activo",
        detail: "Z2 30-40 min + movilidad. Reduce fatiga acumulada.",
        cta: "Iniciar",
        accent: "from-emerald-700/70 to-slate-900/60",
        href: "/workouts"
      });
    }

    if (quick.sessions7d >= 2 && quick.topCapacity) {
      out.push({
        title: `PR ${quick.topCapacity.name}`,
        detail: "2 x (10:00) tempo 75% + 2 x 2:00 sprint. Calienta bien y anota marcas.",
        cta: "Planificar",
        accent: "from-cyan-700/70 to-indigo-700/60",
        href: "/workouts"
      });
    }

    if (!out.length) {
      out.push({
        title: "Sin recomendaciones",
        detail: "Registra o analiza un WOD para ver sugerencias personalizadas.",
        cta: "Analizar WOD",
        accent: "from-slate-800/60 to-slate-900/30",
        href: "/wod-analysis"
      });
    }

    return out;
  }, [data?.biometrics?.fatigue_score, data?.training_load, quick.fatigue, quick.sessions7d, quick.topCapacity]);

  return (
    <div className="space-y-8">
      <header className="relative overflow-hidden rounded-2xl bg-slate-900/85 p-6 shadow-2xl ring-1 ring-white/8 backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Modo carrera</p>
            <h1 className="mt-1 text-3xl font-semibold text-white">{loading ? "Cargando..." : "Bienvenido"}</h1>
            <p className="mt-2 text-slate-300">
              {error
                ? error
                : "Tu estado se actualiza al analizar o aplicar un WOD. Los valores reflejan datos reales del backend."}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="primary" href="/wod-analysis">
              Analizar un WOD
            </Button>
            <Button variant="ghost" href="/workouts">
              Ver historial
            </Button>
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="relative">
            <Metric label="XP total" value={quick.xp.toString()} hint={hintCareer} />
            <div className="absolute right-2 top-2">
              <HelpTooltip helpKey="dashboard.xp" />
            </div>
          </div>
          <div className="relative">
            <Metric label="Sesiones semana" value={quick.sessions7d.toString()} hint={quick.sessions7d > 0 ? "Ultimos 7 días" : "Sin datos"} />
            <div className="absolute right-2 top-2">
              <HelpTooltip helpKey="dashboard.sessionsWeek" />
            </div>
          </div>
          <div className="relative">
            <Metric label="Carga 7d" value={quick.carga7d.toString()} hint={quick.carga7d > 0 ? "Acumulada" : "Sin datos"} />
            <div className="absolute right-2 top-2">
              <HelpTooltip helpKey="dashboard.load7d" />
            </div>
          </div>
        </div>
      </header>

      <Section title="Estado rapido" description="Energia, fatiga y proximas acciones.">
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="bg-slate-900/80 ring-1 ring-emerald-300/30 shadow-lg shadow-emerald-900/30 h-full min-h-[240px]">
            <div className="grid grid-cols-[auto,1fr] items-center gap-6 h-full">
              {quick.fatigue != null ? (
                <div className="flex h-28 w-28 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-300/40">
                  <div className="relative h-24 w-24">
                    <svg viewBox="0 0 48 48" className="h-full w-full -rotate-90">
                      <circle cx="24" cy="24" r="19" stroke="#0f172a" strokeWidth="4" fill="none" />
                      <circle
                        cx="24"
                        cy="24"
                        r="19"
                        stroke="#34d399"
                        strokeWidth="4"
                        fill="none"
                        strokeDasharray={`${Math.min(100, quick.fatigue)} 100`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-base font-semibold text-emerald-200">
                      {Math.round(quick.fatigue)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex h-28 w-28 items-center justify-center rounded-full bg-slate-800 text-xs text-slate-400">Sin datos</div>
              )}
              <div className="self-stretch flex flex-col justify-center">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-slate-400">Recuperacion</p>
                  <HelpTooltip helpKey="dashboard.fatigue" />
                </div>
                <p className="text-3xl font-semibold text-emerald-300">{quick.fatigue != null ? `${quick.fatigue}` : "Sin datos"}</p>
                <p className="text-sm text-slate-400">{quick.recoveryText}</p>
              </div>
            </div>
          </Card>

          <Card className="bg-slate-900/80 ring-1 ring-cyan-300/30 shadow-lg shadow-cyan-900/30 h-full min-h-[240px]">
            <div className="flex h-full items-center gap-6">
              <div className="shrink-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-slate-400">Capacidades</p>
                  <HelpTooltip helpKey="dashboard.capacities" />
                </div>
                {capacityChart.segments.length > 0 ? (
                  <svg viewBox="0 0 96 96" className="mt-3 h-28 w-28">
                    {capacityChart.segments.map((seg, idx) => (
                      <circle
                        key={seg.label + idx}
                        cx="48"
                        cy="48"
                        r={capacityChart.radius}
                        fill="none"
                        stroke={seg.color}
                        strokeWidth="10"
                        strokeDasharray={`${seg.dash} ${capacityChart.circumference}`}
                        strokeDashoffset={-seg.offset}
                        strokeLinecap="round"
                        transform="rotate(-90 48 48)"
                        opacity={0.95}
                      />
                    ))}
                  </svg>
                ) : (
                  <div className="mt-3 text-sm text-slate-300">Sin datos aun.</div>
                )}
              </div>
              <div className="grid flex-1 grid-cols-1 gap-3 text-sm text-slate-200">
                {capacityChart.segments.map((seg, idx) => (
                  <div key={seg.label + idx} className="flex items-center justify-between gap-3 rounded-lg bg-slate-800/80 px-4 py-2">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: seg.color }} />
                      <span className="font-medium">{seg.label}</span>
                    </div>
                    <span className="text-slate-100">{seg.value}</span>
                  </div>
                ))}
                {capacityChart.segments.length === 0 && (
                  <div className="rounded-lg bg-slate-800/60 px-3 py-2 text-slate-400">Analiza o aplica un WOD para ver capacidades.</div>
                )}
              </div>
            </div>
          </Card>

          <Card className="bg-slate-900/80 ring-1 ring-indigo-300/30 shadow-lg shadow-indigo-900/30 h-full min-h-[240px]">
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-slate-400">Carga semanal</p>
                    <HelpTooltip helpKey="dashboard.weeklyLoad" />
                  </div>
                  <p className="text-xl font-semibold text-white">
                    {latestLoad?.acute_load != null ? `${latestLoad.acute_load} aguda` : "Distribución 7d"}
                  </p>
                </div>
                {latestLoad?.load_ratio != null && (
                  <span className="rounded-full bg-indigo-400/20 px-3 py-1 text-xs font-semibold text-indigo-100 ring-1 ring-indigo-300/40">
                    Ratio {latestLoad.load_ratio}
                  </span>
                )}
              </div>
              <div className="mt-6 flex-1">
              {loadBars.length > 0 ? (
                <div className="relative flex h-full items-end gap-4">
                  <div className="absolute inset-x-0 bottom-8 h-px bg-slate-700/60" />
                  {loadBars.map((b) => (
                    <div key={b.key} className="flex flex-col items-center gap-1">
                      <div className="flex w-9 items-end justify-center gap-1">
                        <span
                          className="inline-block w-3 rounded-full bg-indigo-300/80 shadow-lg shadow-indigo-900/30"
                          style={{ height: `${b.chronicHeight}px` }}
                          title={`Crónica ${b.chronic}`}
                        />
                        <span
                          className="inline-block w-3 rounded-full bg-cyan-300/80 shadow-lg shadow-cyan-900/30"
                          style={{ height: `${b.acuteHeight}px` }}
                          title={`Aguda ${b.acute}${b.execs ? ` | ${b.execs} WODs` : ""}`}
                        />
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {b.label}
                        {b.execs > 1 && <span className="ml-1 text-[10px] text-cyan-300">({b.execs})</span>}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-slate-300">Sin datos registrados.</div>
              )}
              </div>
            </div>
          </Card>
        </div>
      </Section>

      <Section title="Sugerencias destacadas" description="Acciones concretas segun tu estado.">
        <div className="grid gap-4 md:grid-cols-2">
          {suggestions.map((s) => (
            <div
              key={s.title}
              className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${s.accent} p-5 ring-1 ring-white/10`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.12em] text-white/70">Recomendado</p>
                  <h3 className="text-xl font-semibold text-white">{s.title}</h3>
                  <p className="mt-1 text-sm text-white/80">{s.detail}</p>
                </div>
                <Button variant="ghost" size="sm">
                  {s.cta}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Accesos rapidos" description="Entra directo a lo que importa.">
        <div className="grid gap-3 md:grid-cols-3">
          {quickActions.map((action) => (
            <Link key={action.label} href={action.href} className="block">
              <Card className="group flex cursor-pointer items-center justify-between rounded-xl border border-white/5 bg-slate-900/50 px-4 py-3 transition hover:border-cyan-400/50 hover:bg-slate-800/80">
                <div>
                  <p className="text-sm font-semibold text-white">{action.label}</p>
                  <p className="text-xs text-slate-400">{action.hint}</p>
                </div>
                <span className="text-cyan-300 transition group-hover:translate-x-1">→</span>
              </Card>
            </Link>
          ))}
        </div>
      </Section>
    </div>
  );
}
