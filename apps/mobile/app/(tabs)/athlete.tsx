import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Card, Section } from "@thrifty/ui";
import { api } from "../../src/core/api";
import type {
  AthleteProfileResponse,
  AthletePrStat,
  CapacityProfileItem,
  WorkoutExecution
} from "../../src/core/types";
import { useAuth } from "../../src/hooks/useAuth";
import { Avatar } from "../../src/components/Avatar";
import { EmptyState, ErrorState } from "../../src/components/State";
import { Skeleton } from "../../src/components/Skeleton";
import { formatDate, formatNumber, formatTimeSeconds } from "../../src/utils/format";
import {
  normalizeCapacity,
  type CapacityKey,
  type ComparisonMode
} from "../../src/lib/capacityNormalization";

const compareOptions: { key: ComparisonMode; label: string }[] = [
  { key: "level", label: "Tu nivel" },
  { key: "global", label: "Global" },
  { key: "next_level", label: "Nivel siguiente" }
];

const capacityDefs: { key: CapacityKey; label: string }[] = [
  { key: "fuerza", label: "Fuerza" },
  { key: "resistencia", label: "Resistencia" },
  { key: "metcon", label: "Metcon" },
  { key: "gimnasticos", label: "Gimnasticos" },
  { key: "velocidad", label: "Velocidad" },
  { key: "carga muscular", label: "Carga muscular" }
];

const normalizeLabel = (value?: string | null) => (value || "").toLowerCase();

const isKg = (pr: { unit?: string | null; type?: string | null }) => {
  const unit = normalizeLabel(pr.unit);
  const type = normalizeLabel(pr.type);
  return unit.includes("kg") || unit.includes("lb") || type.includes("load");
};

const isTime = (pr: { unit?: string | null; type?: string | null }) => {
  const unit = normalizeLabel(pr.unit);
  const type = normalizeLabel(pr.type);
  return unit.includes("sec") || unit.includes("s") || unit.includes("min") || type.includes("time");
};

const dedupeBestByName = <T extends { name: string }>(
  prs: T[],
  isBetter: (next: T, current: T) => boolean
) => {
  const map = new Map<string, T>();
  for (const pr of prs) {
    const key = pr.name.toLowerCase();
    const current = map.get(key);
    if (!current || isBetter(pr, current)) {
      map.set(key, pr);
    }
  }
  return Array.from(map.values());
};

export default function AthleteScreen() {
  const { user } = useAuth();
  const [data, setData] = useState<AthleteProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [topPrs, setTopPrs] = useState<AthletePrStat[]>([]);
  const [capacityProfile, setCapacityProfile] = useState<CapacityProfileItem[]>([]);
  const [executions, setExecutions] = useState<WorkoutExecution[]>([]);
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>("level");
  const [showAllPrs, setShowAllPrs] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api
      .getAthleteProfile()
      .then((profile) => {
        if (!mounted) return;
        setData(profile);
      })
      .catch((err: any) => {
        if (!mounted) return;
        setError(err?.message ?? "No pudimos cargar el perfil.");
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    api
      .getAthletePrsTop(user.id, 5)
      .then((res) => setTopPrs(res as AthletePrStat[]))
      .catch(() => setTopPrs([]));
    api
      .getWorkoutExecutions()
      .then((rows) => setExecutions(rows))
      .catch(() => setExecutions([]));
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    if (data?.capacities?.length) return;
    const isPrivileged = user?.role === "COACH" || user?.role === "ADMIN";
    const userIdNum = Number(user.id);
    const tryIds = [user.id, isPrivileged && userIdNum === 1 ? 2 : undefined].filter(Boolean) as (
      | number
      | string
    )[];
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
  }, [data?.capacities?.length, user?.id, user?.role]);

  const testsSummary = data?.tests;
  const hasResults = (testsSummary?.tests_total ?? 0) > 0;
  const statusTone = hasResults ? "emerald" : "amber";
  const statusMessage = hasResults ? "Progreso activo" : "Sin tests registrados";
  const athleteLevel = data?.career?.level ?? 1;

  const radarEntries = useMemo(() => {
    const map: Record<string, number> = {};
    const capacitiesSource = (data?.capacities?.length ? data.capacities : capacityProfile) ?? [];
    capacitiesSource.forEach((c: any) => {
      const capName = (c?.capacity || c?.name || c?.code || "").toString();
      if (!capName) return;
      map[capName.toLowerCase()] = c.value ?? c?.score ?? 0;
    });
    return capacityDefs.map((d) => ({
      label: d.label,
      value: normalizeCapacity({
        rawScore: map[d.key] ?? 0,
        mode: comparisonMode,
        athleteLevel,
        capacityKey: d.key
      })
    }));
  }, [athleteLevel, comparisonMode, data?.capacities, capacityProfile]);

  const metrics = useMemo(() => {
    const xpTotal = data?.career?.xp_total ?? 0;
    const level = data?.career?.level ?? 0;
    const weeklyStreak = testsSummary?.weekly_streak ?? data?.career?.weekly_streak ?? null;
    const testsTotal = testsSummary?.tests_total ?? 0;
    return [
      { label: "XP total", value: formatNumber(xpTotal) },
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
      date: pr.achieved_at ? formatDate(pr.achieved_at) : "-"
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

  const kgPrs = dedupeBestByName(allPrs.filter(isKg), (next, current) => next.value > current.value);
  const timePrs = dedupeBestByName(
    allPrs.filter((pr) => !isKg(pr) && isTime(pr)),
    (next, current) => next.value < current.value
  );
  const scorePrs = dedupeBestByName(
    allPrs.filter((pr) => !isKg(pr) && !isTime(pr)),
    (next, current) => next.value > current.value
  );

  const headerName = user?.name || "Atleta";
  const levelLabel = data?.career ? `Nivel ${data.career.level}` : "Nivel 0";
  const xpLabel = data?.career ? data.career.xp_total : 0;
  const progress = data?.career
    ? Math.min(Math.floor(Math.max(0, Math.min(data.career.progress_pct ?? 0, 100))), 99)
    : 0;

  const timelineItems = useMemo(() => {
    if (!executions.length) {
      return [{ title: "Sin tests aun", date: "Hoy", type: "Test", delta: "+0 XP" }];
    }
    return executions.slice(0, 4).map((exec) => ({
      title: exec.workout?.title ?? "Test",
      date: exec.executed_at ? formatDate(exec.executed_at) : "Hoy",
      type: "Test",
      delta: exec.total_time_seconds ? formatTimeSeconds(exec.total_time_seconds) : undefined
    }));
  }, [executions]);

  return (
    <ScrollView className="flex-1 bg-surface px-4 pb-10">
      <View className="mt-6 gap-4">
        <Card className="bg-slate-900/80">
          <View className="flex-row items-center gap-3">
            <Avatar name={headerName} size={56} />
            <View className="flex-1">
              <Text className="text-xs uppercase tracking-[0.2em] text-slate-400">Atleta</Text>
              <Text className="text-2xl font-semibold text-white">{headerName}</Text>
              <Text className="text-sm text-slate-300">
                {levelLabel} · {formatNumber(xpLabel)} XP
              </Text>
            </View>
            <View className={`rounded-full border px-3 py-1 ${statusTone === "emerald" ? "border-emerald-400/40 bg-emerald-500/10" : "border-amber-400/40 bg-amber-500/10"}`}>
              <Text className="text-xs text-slate-100">Estado: {statusMessage}</Text>
            </View>
          </View>
          <View className="mt-4">
            <Text className="text-xs text-slate-400">Al siguiente nivel</Text>
            <View className="mt-2 h-2 w-full rounded-full bg-slate-800">
              <View className="h-2 rounded-full bg-cyan-400" style={{ width: `${progress}%` }} />
            </View>
            <Text className="mt-1 text-xs text-slate-400">{progress}% completado</Text>
          </View>
        </Card>

        {error ? <ErrorState message={error} /> : null}
        {loading ? (
          <Card>
            <Skeleton height={16} width="70%" className="mb-2" />
            <Skeleton height={12} width="40%" />
          </Card>
        ) : null}

        <Section title="Radar de capacidades" description="Comparado con tu referencia.">
          <View className="flex-row flex-wrap gap-2">
            {compareOptions.map((option) => (
              <Pressable key={option.key} onPress={() => setComparisonMode(option.key)}>
                <Text
                  className={`rounded-full border px-3 py-1 text-xs ${
                    comparisonMode === option.key
                      ? "border-cyan-400/60 bg-cyan-500/20 text-white"
                      : "border-white/10 bg-slate-900/60 text-slate-300"
                  }`}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
          <Card className="bg-slate-900/70">
            <View className="gap-3">
              {radarEntries.map((entry) => (
                <View key={entry.label} className="rounded-lg bg-white/5 px-3 py-2">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm text-slate-200">{entry.label}</Text>
                    <Text className="text-xs text-cyan-200">{entry.value}%</Text>
                  </View>
                  <View className="mt-2 h-2 w-full rounded-full bg-slate-800">
                    <View className="h-2 rounded-full bg-cyan-400" style={{ width: `${entry.value}%` }} />
                  </View>
                </View>
              ))}
            </View>
          </Card>
        </Section>

        <Section title="Historial reciente" description="Hitos y mejoras">
          <Card className="bg-slate-900/70">
            <View className="gap-3">
              {timelineItems.map((item, idx) => (
                <View key={`${item.title}-${idx}`} className="flex-row items-center gap-3 rounded-xl bg-white/5 px-3 py-2">
                  <View className="h-2 w-2 rounded-full bg-cyan-400" />
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-white">{item.title}</Text>
                    <Text className="text-xs text-slate-400">
                      {item.date} · {item.type}
                    </Text>
                  </View>
                  {item.delta ? <Text className="text-xs text-emerald-300">{item.delta}</Text> : null}
                </View>
              ))}
            </View>
          </Card>
        </Section>

        <Section title="Metricas y PRs" description="Tus estadisticas y records personales.">
          <Card className="bg-slate-900/70">
            <Text className="text-sm text-slate-300">Metricas</Text>
            <View className="mt-3 gap-2">
              {metrics.map((m) => (
                <View key={m.label} className="flex-row items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                  <Text className="text-sm text-slate-200">{m.label}</Text>
                  <Text className="text-sm font-semibold text-white">{m.value}</Text>
                </View>
              ))}
            </View>
          </Card>

          <Card className="bg-slate-900/70">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-slate-300">PRs y tests</Text>
              <Pressable onPress={() => setShowAllPrs((prev) => !prev)}>
                <Text className="text-xs text-cyan-200">{showAllPrs ? "Ocultar" : "Ver mas"}</Text>
              </Pressable>
            </View>
            <View className="mt-3 gap-3">
              {prs.map((pr) => (
                <View key={pr.name} className="rounded-lg bg-white/5 px-3 py-2">
                  <Text className="text-sm font-semibold text-white">{pr.name}</Text>
                  <Text className="text-slate-300">{pr.score}</Text>
                  <Text className="text-xs text-slate-400">{pr.date}</Text>
                </View>
              ))}
              {!prs.length ? <EmptyState title="Sin PRs registrados" /> : null}
            </View>

            {showAllPrs ? (
              <View className="mt-4 gap-4">
                {kgPrs.length > 0 ? (
                  <View className="gap-2">
                    <Text className="text-xs uppercase tracking-[0.12em] text-slate-400">Maximos kilos</Text>
                    {kgPrs.map((pr) => (
                      <View key={`kg-${pr.name}`} className="rounded-lg bg-white/5 px-3 py-2">
                        <Text className="font-semibold text-white">{pr.name}</Text>
                        <Text className="text-slate-300">
                          {formatNumber(pr.value)} {pr.unit ?? ""}
                        </Text>
                        {pr.date ? <Text className="text-xs text-slate-400">{formatDate(pr.date)}</Text> : null}
                      </View>
                    ))}
                  </View>
                ) : null}
                {timePrs.length > 0 ? (
                  <View className="gap-2">
                    <Text className="text-xs uppercase tracking-[0.12em] text-slate-400">Mejores tiempos</Text>
                    {timePrs.map((pr) => (
                      <View key={`time-${pr.name}`} className="rounded-lg bg-white/5 px-3 py-2">
                        <Text className="font-semibold text-white">{pr.name}</Text>
                        <Text className="text-slate-300">
                          {formatNumber(pr.value)} {pr.unit ?? ""}
                        </Text>
                        {pr.date ? <Text className="text-xs text-slate-400">{formatDate(pr.date)}</Text> : null}
                      </View>
                    ))}
                  </View>
                ) : null}
                {scorePrs.length > 0 ? (
                  <View className="gap-2">
                    <Text className="text-xs uppercase tracking-[0.12em] text-slate-400">Mejores scores</Text>
                    {scorePrs.map((pr) => (
                      <View key={`score-${pr.name}`} className="rounded-lg bg-white/5 px-3 py-2">
                        <Text className="font-semibold text-white">{pr.name}</Text>
                        <Text className="text-slate-300">
                          {formatNumber(pr.value)} {pr.unit ?? ""}
                        </Text>
                        {pr.date ? <Text className="text-xs text-slate-400">{formatDate(pr.date)}</Text> : null}
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            ) : null}
          </Card>
        </Section>
      </View>
    </ScrollView>
  );
}
