"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { Button, Card, Metric, Section } from "@thrifty/ui";
import { api } from "../lib/api";
import type { AthleteProfileResponse, CapacityProfileItem, WorkoutExecution } from "../lib/types";
import { useAuth } from "../lib/auth-client";
import { HelpTooltip } from "../components/ui/HelpTooltip";

const quickActions: { label: string; hint: string; href: Route }[] = [
  { label: "Historial", hint: "Tus ultimos tests", href: "/workouts" },
  { label: "Atleta", hint: "Perfil y progreso", href: "/athlete" }
];

type QuickMetrics = {
  xp: number;
  sessions7d: number;
  testsTotal: number;
  topCapacity?: { name: string; value: number };
};

export default function DashboardPage() {
  const [data, setData] = useState<AthleteProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [capacityProfile, setCapacityProfile] = useState<CapacityProfileItem[]>([]);
  const [executions, setExecutions] = useState<WorkoutExecution[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const profile = await api.getAthleteProfile();
        if (!mounted) return;
        setData(profile);
        api.getWorkoutExecutions().then((rows) => mounted && setExecutions(rows)).catch(() => mounted && setExecutions([]));
        if (user) {
          // fallback de capacidades si el perfil viene sin datos
          if (!profile.capacities?.length) {
            const isPrivileged = user?.role === "COACH" || user?.role === "ADMIN";
            const userIdNum = Number(user.id);
            const tryIds = [user.id, isPrivileged && userIdNum === 1 ? 2 : undefined].filter(Boolean) as (number | string)[];
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

  const hintCareer = data ? `Actualizado: ${new Date(data.career?.updated_at || new Date()).toLocaleDateString()}` : "Sin datos";  const quick: QuickMetrics = useMemo(() => {
    if (!data) {
      return {
        xp: 0,
        sessions7d: 0,
        testsTotal: 0
      };
    }

    const testsSummary = data.tests;
    const sessions7d = testsSummary?.tests_7d ?? 0;

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

    return {
      xp: data.career?.xp_total ?? 0,
      sessions7d,
      testsTotal: testsSummary?.tests_total ?? 0,
      topCapacity
    };
  }, [data, capacityProfile]);
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
  }, [data, capacityProfile]);  const suggestions = useMemo(() => {
    const out: { title: string; detail: string; cta: string; accent: string; href?: Route }[] = [];

    if (quick.sessions7d === 0) {
      out.push({
        title: "Registra tu primer test",
        detail: "Crea un workout tipo test y guarda tu resultado para empezar a medir progreso.",
        cta: "Crear test",
        accent: "from-emerald-700/70 to-slate-900/60",
        href: "/workouts/structure"
      });
    }

    if (quick.topCapacity) {
      out.push({
        title: `Enfoca ${quick.topCapacity.name}`,
        detail: "Disena un test especifico para validar avances en esta capacidad.",
        cta: "Planificar",
        accent: "from-cyan-700/70 to-indigo-700/60",
        href: "/workouts"
      });
    }

    if (!out.length) {
      out.push({
        title: "Sin recomendaciones",
        detail: "Registra un WOD para ver sugerencias personalizadas.",
        cta: "Ver WODs",
        accent: "from-slate-800/60 to-slate-900/30",
        href: "/workouts"
      });
    }

    return out;
  }, [quick.sessions7d, quick.topCapacity]);

  const recentTests = useMemo(() => {
    return (executions ?? []).slice(0, 3);
  }, [executions]);

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
            <Button variant="primary" href="/workouts/structure">
              Crear WOD
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
            <Metric label="Tests 7d" value={quick.sessions7d.toString()} hint={quick.sessions7d > 0 ? "Ultimos 7 dias" : "Sin datos"} />
            <div className="absolute right-2 top-2">
              <HelpTooltip helpKey="dashboard.sessionsWeek" />
            </div>
          </div>
          <div className="relative">
            <Metric label="Tests totales" value={quick.testsTotal.toString()} hint={quick.testsTotal > 0 ? "Acumulados" : "Sin datos"} />
            <div className="absolute right-2 top-2">
              <HelpTooltip helpKey="dashboard.testsTotal" />
            </div>
          </div>
        </div>
      </header>
      <Section title="Resumen de progreso" description="Actividad reciente y capacidades clave.">
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="bg-slate-900/80 ring-1 ring-emerald-300/30 shadow-lg shadow-emerald-900/30 h-full min-h-[240px]">
            <div className="flex h-full flex-col justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-slate-400">Actividad reciente</p>
                  <HelpTooltip helpKey="dashboard.sessionsWeek" />
                </div>
                <p className="text-4xl font-semibold text-emerald-300">{quick.sessions7d}</p>
                <p className="text-sm text-slate-400">{quick.sessions7d ? "Tests en los ultimos 7 dias" : "Sin tests recientes"}</p>
              </div>
              <div className="space-y-2 text-xs text-slate-300">
                {recentTests.length ? (
                  recentTests.map((test) => (
                    <div
                      key={`${test.workout?.title ?? "test"}-${test.executed_at ?? ""}`}
                      className="rounded-lg bg-slate-800/70 px-3 py-2"
                    >
                      <p className="text-sm font-semibold text-white">{test.workout?.title ?? "Test"}</p>
                      <p className="text-xs text-slate-400">
                        {test.executed_at ? new Date(test.executed_at).toLocaleDateString("es-ES") : "-"}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg bg-slate-800/60 px-3 py-2 text-slate-400">Sin tests registrados.</div>
                )}
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
            <div className="flex h-full flex-col justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-slate-400">Progreso</p>
                  <HelpTooltip helpKey="athlete.progress" />
                </div>
                <p className="mt-2 text-xl font-semibold text-white">Nivel {data?.career?.level ?? 0}</p>
                <p className="text-sm text-slate-400">XP total {Number(quick.xp).toLocaleString("es-ES")}</p>
              </div>
              <div className="rounded-lg bg-slate-800/70 px-3 py-2 text-sm text-slate-200">
                <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Capacidad top</p>
                <p className="mt-1 text-lg font-semibold text-white">
                  {quick.topCapacity ? `${quick.topCapacity.name} (${quick.topCapacity.value})` : "Sin datos"}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </Section>
      <Section title="Sugerencias destacadas" description="Acciones concretas segun tu progreso.">
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








