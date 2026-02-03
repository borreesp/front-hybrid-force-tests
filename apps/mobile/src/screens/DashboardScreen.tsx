import { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Button, Card, Metric, Section } from "@thrifty/ui";
import { api } from "../core/api";
import type { AthleteProfileResponse, CapacityProfileItem, WorkoutExecution } from "../core/types";
import { useAuth } from "../hooks/useAuth";
import { formatDate, formatNumber } from "../utils/format";
import { EmptyState, ErrorState } from "../components/State";
import { ListRow } from "../components/ListRow";
import { CircularProgress } from "../components/CircularProgress";
import { RadarChart } from "../components/RadarChart";
import { ProgressBar } from "../components/ProgressBar";

const quickActions = [
  { label: "Historial", hint: "Tus ultimos tests", href: "/workouts", params: { tab: "completed" } },
  { label: "Atleta", hint: "Perfil y progreso", href: "/athlete" }
];

type QuickMetrics = {
  xp: number;
  sessions7d: number;
  testsTotal: number;
  topCapacity?: { name: string; value: number };
};

type Suggestion = {
  title: string;
  detail: string;
  cta: string;
  tone: "emerald" | "cyan" | "slate";
  href?: string;
};

const toneStyles: Record<Suggestion["tone"], string> = {
  emerald: "border-emerald-400/30 bg-emerald-500/10",
  cyan: "border-cyan-400/30 bg-cyan-500/10",
  slate: "border-white/10 bg-slate-800/60"
};

const palette = ["#5eead4", "#38bdf8", "#a78bfa", "#f472b6", "#facc15", "#22d3ee"];

const getCapacityName = (cap: any) =>
  cap?.capacity ?? cap?.capacity_name ?? cap?.capacity_code ?? "Capacidad";

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [data, setData] = useState<AthleteProfileResponse | null>(null);
  const [capacityProfile, setCapacityProfile] = useState<CapacityProfileItem[]>([]);
  const [executions, setExecutions] = useState<WorkoutExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const profile = await api.getAthleteProfile();
        if (!mounted) return;
        setData(profile);
        api
          .getWorkoutExecutions()
          .then((rows) => mounted && setExecutions(rows))
          .catch(() => mounted && setExecutions([]));
        if (user) {
          if (!profile.capacities?.length) {
            const isPrivileged = user?.role === "COACH" || user?.role === "ADMIN";
            const userIdNum = Number(user.id);
            const tryIds = [user.id, isPrivileged && userIdNum === 1 ? 2 : undefined].filter(Boolean) as (
              | number
              | string
            )[];
            for (const candidate of tryIds) {
              try {
                const res = await api.getCapacityProfile(candidate);
                if (mounted && res.capacities?.length) {
                  setCapacityProfile(res.capacities);
                  break;
                }
              } catch {
                // continue
              }
            }
          }
        }
      } catch {
        if (!mounted) return;
        setError("No se pudieron cargar los datos del atleta.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [user]);

  const hintCareer = data?.career?.updated_at ? `Actualizado: ${formatDate(data.career.updated_at)}` : "Sin datos";

  const quick: QuickMetrics = useMemo(() => {
    if (!data) {
      return {
        xp: 0,
        sessions7d: 0,
        testsTotal: 0
      };
    }

    const testsSummary = data.tests;
    const sessions7d = testsSummary?.tests_7d ?? 0;
    const capsSource = data.capacities?.length ? data.capacities : capacityProfile;
    const topCapacity =
      capsSource && capsSource.length > 0
        ? capsSource.reduce<{ name: string; value: number } | undefined>((prev, curr) => {
            if (!prev || curr.value > prev.value) {
              return { name: getCapacityName(curr), value: curr.value };
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

  const capacitySegments = useMemo(() => {
    const caps = (data?.capacities?.length ? data.capacities : capacityProfile || []).slice(0, 6);
    const total = caps.reduce((acc, c) => acc + (c.value || 0), 0) || 1;
    return caps.map((cap, idx) => {
      const value = cap.value ?? 0;
      const pct = Math.max(0, Math.round((value / total) * 100));
      return {
        label: getCapacityName(cap),
        value,
        pct,
        color: palette[idx % palette.length]
      };
    });
  }, [data, capacityProfile]);

  const suggestions: Suggestion[] = useMemo(() => {
    const out: Suggestion[] = [];
    if (quick.sessions7d === 0) {
      out.push({
        title: "Registra tu primer test",
        detail: "Crea un workout tipo test y guarda tu resultado para medir progreso.",
        cta: "Crear test",
        tone: "emerald",
        href: "/workouts"
      });
    }

    if (quick.topCapacity) {
      out.push({
        title: `Enfoca ${quick.topCapacity.name}`,
        detail: "Disena un test especifico para validar avances en esta capacidad.",
        cta: "Planificar",
        tone: "cyan",
        href: "/workouts"
      });
    }

    if (!out.length) {
      out.push({
        title: "Sin recomendaciones",
        detail: "Registra un WOD para ver sugerencias personalizadas.",
        cta: "Ver WODs",
        tone: "slate",
        href: "/workouts"
      });
    }

    return out;
  }, [quick.sessions7d, quick.topCapacity]);

  const recentTests = useMemo(() => {
    return (executions ?? []).slice(0, 3);
  }, [executions]);

  const handleNavigate = (href: string, params?: Record<string, string>) => {
    if (params) {
      router.push({ pathname: href, params });
      return;
    }
    router.push(href);
  };

  return (
    <ScrollView className="flex-1 bg-slate-950 px-4 pb-10">
      <View className="mt-4">
        <View className="rounded-2xl border border-white/10 bg-slate-900/90 p-4">
          <Text className="text-xs uppercase tracking-[0.2em] text-slate-400">Modo carrera</Text>
          <Text className="mt-1 text-xl font-bold text-white">
            {loading ? "Cargando..." : `Bienvenido${user?.name ? `, ${user.name}` : ""}`}
          </Text>
          <Text className="mt-2 text-sm leading-relaxed text-slate-300">
            {error
              ? error
              : "Tu estado se actualiza al analizar o aplicar un WOD. Los valores reflejan datos reales del backend."}
          </Text>
          <View className="mt-3 flex flex-row flex-wrap gap-2">
            <Button label="Crear WOD" onPress={() => handleNavigate("/workouts")} />
            <Button variant="ghost" label="Ver historial" onPress={() => handleNavigate("/workouts", { tab: "completed" })} />
          </View>

          <View className="mt-4 gap-2">
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Metric label="XP total" value={formatNumber(quick.xp)} hint={hintCareer} />
              </View>
              <View className="flex-1">
                <Metric
                  label="Tests 7d"
                  value={formatNumber(quick.sessions7d)}
                  hint={quick.sessions7d > 0 ? "Ultimos 7 dias" : "Sin datos"}
                />
              </View>
            </View>
            <Metric
              label="Tests totales"
              value={formatNumber(quick.testsTotal)}
              hint={quick.testsTotal > 0 ? "Acumulados" : "Sin datos"}
            />
          </View>
        </View>
      </View>

      <Section title="Resumen de progreso" description="Actividad reciente y capacidades clave.">
        <Card className="bg-slate-900/80">
          <Text className="text-sm font-medium text-slate-400">Actividad reciente</Text>
          <Text className="mt-2 text-3xl font-bold text-emerald-300">{formatNumber(quick.sessions7d)}</Text>
          <Text className="text-xs text-slate-400">
            {quick.sessions7d ? "Tests en los ultimos 7 dias" : "Sin tests recientes"}
          </Text>
          <View className="mt-3 gap-2">
            {recentTests.length ? (
              recentTests.map((test) => (
                <View key={`${test.workout?.title ?? "test"}-${test.executed_at ?? ""}`} className="rounded-lg bg-slate-800/70 px-3 py-2">
                  <Text className="text-sm font-semibold text-white">{test.workout?.title ?? "Test"}</Text>
                  <Text className="text-xs text-slate-400">
                    {test.executed_at ? formatDate(test.executed_at) : "-"}
                  </Text>
                </View>
              ))
            ) : (
              <EmptyState title="Sin tests registrados" description="Completa un test para ver actividad." />
            )}
          </View>
        </Card>

        <Card className="bg-slate-900/80">
          <Text className="text-sm font-medium text-slate-400">Capacidades</Text>

          {/* Radar Chart Visualization - Mobile optimizado */}
          {capacitySegments.length >= 3 && (
            <View className="items-center my-3">
              <RadarChart
                data={capacitySegments.map((seg) => ({
                  label: seg.label,
                  value: seg.value
                }))}
                size={200}
                color="#22d3ee"
                maxValue={100}
              />
            </View>
          )}

          {/* Progress Bars */}
          <View className="mt-3 gap-3">
            {capacitySegments.length ? (
              capacitySegments.map((seg) => (
                <ProgressBar
                  key={seg.label}
                  value={seg.pct}
                  label={seg.label}
                  color={seg.color}
                  showPercentage
                />
              ))
            ) : (
              <EmptyState title="Sin datos aun" description="Analiza o aplica un WOD para ver capacidades." />
            )}
          </View>
        </Card>

        <Card className="bg-slate-900/80">
          <Text className="text-sm font-medium text-slate-400">Progreso</Text>

          {/* Circular Progress for Level/XP - Mobile optimizado */}
          <View className="items-center justify-center py-4">
            <CircularProgress
              value={data?.career?.progress_pct ?? 0}
              size={120}
              strokeWidth={6}
              color="#22d3ee"
              backgroundColor="#1e293b"
              showValue
              label={`Nivel ${data?.career?.level ?? 0}`}
            />
            <Text className="mt-3 text-sm text-slate-400">
              {formatNumber(quick.xp)} XP total
            </Text>
          </View>

          <View className="mt-3 rounded-lg bg-slate-800/70 px-3 py-2">
            <Text className="text-[11px] uppercase tracking-[0.12em] text-slate-400">Capacidad top</Text>
            <Text className="mt-1 text-lg font-semibold text-white">
              {quick.topCapacity ? `${quick.topCapacity.name} (${quick.topCapacity.value})` : "Sin datos"}
            </Text>
          </View>
        </Card>
      </Section>

      <Section title="Sugerencias destacadas" description="Acciones concretas segun tu progreso.">
        <View className="gap-3">
          {suggestions.map((s) => {
            const href = s.href;
            return (
              <View key={s.title} className={`rounded-2xl border p-4 ${toneStyles[s.tone]}`}>
                <Text className="text-xs uppercase tracking-[0.12em] text-white/70">Recomendado</Text>
                <Text className="mt-1 text-lg font-semibold text-white">{s.title}</Text>
                <Text className="mt-1 text-sm text-white/80">{s.detail}</Text>
                {href ? (
                  <View className="mt-3">
                    <Button variant="ghost" size="sm" label={s.cta} onPress={() => handleNavigate(href)} />
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      </Section>

      <Section title="Accesos rapidos" description="Entra directo a lo que importa.">
        <View className="gap-2">
          {quickActions.map((action) => (
            <ListRow
              key={action.label}
              title={action.label}
              subtitle={action.hint}
              onPress={() => handleNavigate(action.href, action.params)}
              right={<Text className="text-cyan-300">-&gt;</Text>}
            />
          ))}
        </View>
      </Section>

      {error && !loading ? <ErrorState message={error} /> : null}
    </ScrollView>
  );
}
