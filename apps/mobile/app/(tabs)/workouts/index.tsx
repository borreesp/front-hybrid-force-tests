import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Card, Section } from "@thrifty/ui";
import { api } from "../../../src/core/api";
import type { Workout, WorkoutExecution } from "../../../src/core/types";
import { ErrorState, EmptyState } from "../../../src/components/State";
import { Skeleton } from "../../../src/components/Skeleton";
import { formatDate, formatNumber, formatTimeSeconds } from "../../../src/utils/format";

const statTone = {
  cardio: "text-cyan-200",
  strength: "text-orange-200",
  hybrid: "text-indigo-200"
} as const;

const historyRanges: { key: "2w" | "1m" | "all"; label: string }[] = [
  { key: "2w", label: "Ultimas 2 semanas" },
  { key: "1m", label: "Ultimo mes" },
  { key: "all", label: "Todo" }
];

const chipBase = "rounded-full border px-3 py-1 text-xs";

export default function WorkoutsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [executions, setExecutions] = useState<WorkoutExecution[]>([]);
  const [execStatus, setExecStatus] = useState<"idle" | "loading" | "error">("idle");
  const [execError, setExecError] = useState<string | null>(null);
  const [filters, setFilters] = useState({ domain: "", intensity: "", hyrox: "" });
  const [search, setSearch] = useState("");
  const [historyRange, setHistoryRange] = useState<"2w" | "1m" | "all">("2w");
  const tabParam = Array.isArray(params?.tab) ? params.tab[0] : params?.tab;
  const [activeTab, setActiveTab] = useState<"available" | "completed">(
    tabParam === "completed" ? "completed" : "available"
  );

  useEffect(() => {
    setStatus("loading");
    api
      .getWorkouts()
      .then((data) => {
        setWorkouts(data);
        setStatus("idle");
      })
      .catch((err: any) => {
        setError(err?.message ?? "No pudimos cargar workouts.");
        setStatus("error");
      });
  }, []);

  useEffect(() => {
    if (!tabParam) return;
    setActiveTab(tabParam === "completed" ? "completed" : "available");
  }, [tabParam]);

  useEffect(() => {
    setExecStatus("loading");
    api
      .getWorkoutExecutions()
      .then((data) => {
        setExecutions(data);
        setExecStatus("idle");
      })
      .catch((err: any) => {
        if (err?.status === 403) {
          setExecutions([]);
          setExecStatus("idle");
          return;
        }
        setExecError(err?.message ?? "No pudimos cargar historial.");
        setExecStatus("error");
      });
  }, []);

  const uniqueStrings = (items: (string | null | undefined)[]) => {
    const seen = new Set<string>();
    return items
      .filter(Boolean)
      .map((s) => s as string)
      .reduce<string[]>((acc, val) => {
        const key = val.toLowerCase();
        if (seen.has(key)) return acc;
        seen.add(key);
        acc.push(val);
        return acc;
      }, [])
      .sort((a, b) => a.localeCompare(b));
  };

  const primaryResult = (execution: WorkoutExecution) => {
    const total = typeof execution.total_time_seconds === "number" ? execution.total_time_seconds : null;
    if (total && total > 0) return `Tiempo ${formatTimeSeconds(total)}`;
    const meta = (execution.execution_meta ?? {}) as Record<string, unknown>;
    const scoreRaw = meta.score ?? meta.total_score;
    const repsRaw = meta.reps ?? meta.total_reps;
    if (typeof scoreRaw === "number") return `Score ${scoreRaw}`;
    if (typeof repsRaw === "number") return `Reps ${repsRaw}`;
    return "Resultado no disponible";
  };

  const domains = useMemo(() => uniqueStrings(workouts.map((w) => w.domain)), [workouts]);
  const intensities = useMemo(() => uniqueStrings(workouts.map((w) => w.intensity)), [workouts]);
  const hyroxStations = useMemo(
    () => uniqueStrings(workouts.flatMap((w) => w.hyrox_stations?.map((h) => h.station) ?? [])),
    [workouts]
  );

  const filtered = useMemo(() => {
    return workouts
      .filter((workout) => (filters.domain ? workout.domain === filters.domain : true))
      .filter((workout) => (filters.intensity ? workout.intensity === filters.intensity : true))
      .filter((workout) =>
        filters.hyrox ? workout.hyrox_stations?.some((station) => station.station === filters.hyrox) : true
      )
      .filter((workout) =>
        search ? `${workout.title} ${workout.description}`.toLowerCase().includes(search.toLowerCase()) : true
      )
      .sort((a, b) => (b.avg_rating ?? 0) - (a.avg_rating ?? 0));
  }, [workouts, filters, search]);

  const completedFiltered = useMemo(() => {
    if (historyRange === "all") return executions;
    const now = new Date();
    const cutoff = new Date(now);
    if (historyRange === "2w") {
      cutoff.setDate(now.getDate() - 14);
    } else {
      cutoff.setMonth(now.getMonth() - 1);
    }
    return executions.filter((exec) => {
      if (!exec.executed_at) return false;
      const date = new Date(exec.executed_at);
      return !Number.isNaN(date.getTime()) && date >= cutoff;
    });
  }, [executions, historyRange]);

  const renderTags = (workout: Workout) => {
    const tags = uniqueStrings([workout.domain, workout.intensity, workout.hyrox_transfer, ...(workout.muscles ?? [])]).slice(
      0,
      4
    );
    return (
      <View className="mt-2 flex flex-row flex-wrap gap-2">
        {tags.map((tag, idx) => (
          <View key={`${tag?.toLowerCase()}-${idx}`} className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
            <Text className="text-xs text-slate-300">{tag}</Text>
          </View>
        ))}
      </View>
    );
  };

  const handleFilterPress = (key: "domain" | "intensity" | "hyrox", value: string) => {
    setFilters((prev) => ({ ...prev, [key]: prev[key] === value ? "" : value }));
  };

  const renderChipList = (items: string[], key: "domain" | "intensity" | "hyrox") => {
    if (!items.length) return null;
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
        <View className="flex-row gap-2">
          {items.map((item) => {
            const active = filters[key] === item;
            return (
              <Pressable key={item} onPress={() => handleFilterPress(key, item)}>
                <Text
                  className={`${chipBase} ${active ? "border-cyan-400/60 bg-cyan-500/20 text-white" : "border-white/10 bg-slate-900/60 text-slate-300"}`}
                >
                  {item}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    );
  };

  return (
    <ScrollView className="flex-1 bg-surface px-4 pb-10">
      <View className="mt-6">
        <View className="flex-row gap-2 rounded-2xl border border-white/10 bg-slate-900/70 p-1">
          <Pressable
            className={`flex-1 rounded-2xl px-4 py-2 ${activeTab === "available" ? "bg-white/10" : ""}`}
            onPress={() => setActiveTab("available")}
          >
            <Text className={`text-center text-sm ${activeTab === "available" ? "text-white" : "text-slate-400"}`}>
              Disponibles ({workouts.length})
            </Text>
          </Pressable>
          <Pressable
            className={`flex-1 rounded-2xl px-4 py-2 ${activeTab === "completed" ? "bg-white/10" : ""}`}
            onPress={() => setActiveTab("completed")}
          >
            <Text className={`text-center text-sm ${activeTab === "completed" ? "text-white" : "text-slate-400"}`}>
              Realizados ({executions.length})
            </Text>
          </Pressable>
        </View>

        {activeTab === "available" && (
          <>
            <Section title="Workouts" description="Todos los WODs disponibles para tu perfil.">
              <TextInput
                placeholder="Buscador"
                placeholderTextColor="#64748b"
                value={search}
                onChangeText={setSearch}
                className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-white"
              />
              <View className="gap-2">
                {renderChipList(domains, "domain")}
                {renderChipList(intensities, "intensity")}
                {renderChipList(hyroxStations, "hyrox")}
              </View>
            </Section>

            {status === "error" ? (
              <ErrorState message={error ?? undefined} />
            ) : null}

            {status === "loading" ? (
              <Card>
                <Skeleton height={16} width="70%" className="mb-2" />
                <Skeleton height={12} width="40%" className="mb-2" />
                <Skeleton height={12} width="90%" />
              </Card>
            ) : null}

            {filtered.length === 0 && status === "idle" ? (
              <EmptyState title="Sin resultados" description="No se encontraron WODs con estos filtros." />
            ) : null}

            <View className="gap-4">
              {filtered.map((workout) => {
                const typeHint = workout.wod_type?.toLowerCase() ?? "";
                const tone: keyof typeof statTone = typeHint.includes("strength")
                  ? "strength"
                  : typeHint.includes("cardio")
                    ? "cardio"
                    : "hybrid";
                return (
                  <Card key={workout.id} className="bg-slate-900/70">
                    <View className="flex-row justify-between gap-3">
                      <View className="flex-1">
                        <Text className="text-xs uppercase tracking-[0.2em] text-slate-400">{workout.wod_type}</Text>
                        <Text className="text-lg font-semibold text-white">{workout.title}</Text>
                        <Text className="mt-1 text-sm text-slate-300">{workout.description}</Text>
                      </View>
                      <View className="items-end">
                        <Text className="text-xs text-slate-400">XP: {formatNumber(workout.xp_estimate)}</Text>
                        <Text className="text-xs text-slate-400">
                          {workout.avg_difficulty ? `${workout.avg_difficulty.toFixed(1)} KP` : "KP: -"}
                        </Text>
                        <Text className="text-xs text-slate-400">
                          {workout.avg_rating ? `${workout.avg_rating.toFixed(1)} *` : "Rating: -"}
                        </Text>
                      </View>
                    </View>
                    {renderTags(workout)}
                    <View className="mt-3 flex-row items-center justify-between">
                      <Text className="text-xs text-slate-400">Dificultad: {workout.estimated_difficulty ?? "N/A"}</Text>
                      <Text className={`text-xs font-semibold ${statTone[tone]}`}>{tone.toUpperCase()}</Text>
                    </View>
                    <View className="mt-3 flex-row items-center justify-between">
                      <Pressable onPress={() => router.push(`/workouts/${workout.id}`)}>
                        <Text className="text-sm font-semibold text-cyan-300">Ver detalle</Text>
                      </Pressable>
                      <Text className="text-xs text-slate-500">
                        {workout.avg_time_seconds ? `${Math.round(workout.avg_time_seconds / 60)} min` : "Tiempo s/n"}
                      </Text>
                    </View>
                  </Card>
                );
              })}
            </View>
          </>
        )}

        {activeTab === "completed" && (
          <>
            <Section title="Workouts realizados" description="Historico inmutable de tus ejecuciones completadas.">
              <View className="flex-row flex-wrap gap-2">
                {historyRanges.map((range) => (
                  <Pressable key={range.key} onPress={() => setHistoryRange(range.key)}>
                    <Text
                      className={`${chipBase} ${
                        historyRange === range.key
                          ? "border-cyan-400/60 bg-cyan-500/20 text-white"
                          : "border-white/10 bg-slate-900/60 text-slate-300"
                      }`}
                    >
                      {range.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </Section>

            {execStatus === "error" ? <ErrorState message={execError ?? undefined} /> : null}
            {execStatus === "loading" ? (
              <Card>
                <Skeleton height={16} width="70%" className="mb-2" />
                <Skeleton height={12} width="40%" className="mb-2" />
                <Skeleton height={12} width="90%" />
              </Card>
            ) : null}
            {completedFiltered.length === 0 && execStatus === "idle" ? (
              <EmptyState title="Sin historial" description="No hay workouts completados en este periodo." />
            ) : null}

            <View className="gap-4">
              {completedFiltered.map((execution) => {
                const tagList = uniqueStrings([
                  execution.workout?.domain,
                  execution.workout?.intensity,
                  ...(execution.workout?.hyrox_stations?.map((station) => station.station) ?? [])
                ]).slice(0, 4);
                return (
                  <Card key={execution.id} className="bg-slate-900/70">
                    <View className="flex-row items-center justify-between gap-3">
                      <View className="flex-1">
                        <Text className="text-xs uppercase tracking-[0.2em] text-slate-400">Completado</Text>
                        <Text className="text-lg font-semibold text-white">
                          {execution.workout?.title ?? "Workout"}
                        </Text>
                        <Text className="mt-1 text-xs text-slate-400">{formatDate(execution.executed_at)}</Text>
                      </View>
                      <View className="items-end">
                        <Text className="text-xs font-semibold text-white">{primaryResult(execution)}</Text>
                        <Text className="text-[11px] text-slate-500">ID #{execution.id}</Text>
                      </View>
                    </View>
                    {tagList.length > 0 && (
                      <View className="mt-3 flex-row flex-wrap gap-2">
                        {tagList.map((tag, idx) => (
                          <View
                            key={`${tag?.toString().toLowerCase()}-${idx}`}
                            className="rounded-full border border-white/10 bg-white/5 px-3 py-1"
                          >
                            <Text className="text-xs text-slate-300">{tag}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                    <View className="mt-4 flex-row items-center justify-between">
                      <Pressable onPress={() => router.push(`/workouts/executions/${execution.id}`)}>
                        <Text className="text-sm font-semibold text-cyan-300">Ver detalle</Text>
                      </Pressable>
                      {execution.notes ? <Text className="text-xs text-slate-500">Notas: {execution.notes}</Text> : null}
                    </View>
                  </Card>
                );
              })}
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}
