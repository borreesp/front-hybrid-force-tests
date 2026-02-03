import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Button, Card, Section } from "@thrifty/ui";
import { api } from "../../../src/core/api";
import type { Workout } from "../../../src/core/types";
import { Skeleton } from "../../../src/components/Skeleton";
import { EmptyState, ErrorState } from "../../../src/components/State";
import { formatNumber, formatTimeSeconds } from "../../../src/utils/format";

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
    }, []);
};

export default function WorkoutDetailScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const workoutId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [repeatLoading, setRepeatLoading] = useState(false);

  const load = useCallback(async () => {
    if (!workoutId) {
      setError("Workout no encontrado.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const found = await api.getWorkout(workoutId);
      setWorkout(found ?? null);
    } catch (err: any) {
      setError(err?.message ?? "No pudimos cargar el workout.");
    } finally {
      setLoading(false);
    }
  }, [workoutId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRepeat = async () => {
    if (!workout) return;
    setRepeatLoading(true);
    try {
      await api.repeatWorkout(workout.id);
    } catch (err: any) {
      setError(err?.message ?? "No pudimos repetir el workout.");
    } finally {
      setRepeatLoading(false);
    }
  };

  const tags = workout
    ? uniqueStrings([workout.domain, workout.intensity, workout.hyrox_transfer, ...(workout.muscles ?? [])]).slice(0, 4)
    : [];

  return (
    <ScrollView className="px-4 pb-10">
      <Section title="Workout" description="Detalle de entrenamiento.">
        {loading ? (
          <Card>
            <Skeleton height={16} width="70%" className="mb-2" />
            <Skeleton height={12} width="40%" className="mb-2" />
            <Skeleton height={12} width="90%" />
          </Card>
        ) : null}

        {error && !loading ? <ErrorState message={error} onRetry={load} /> : null}

        {workout && !loading ? (
          <Card title={workout.title} subtitle={workout.wod_type}>
            <Text className="text-xs text-slate-400 mb-2">
              {workout.domain ?? "General"} · Intensidad {workout.intensity ?? "-"}
            </Text>
            {workout.description ? (
              <Text className="text-sm text-slate-200 mb-3">{workout.description}</Text>
            ) : null}
            {tags.length ? (
              <View className="mb-3 flex-row flex-wrap gap-2">
                {tags.map((tag, idx) => (
                  <View key={`${tag.toLowerCase()}-${idx}`} className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                    <Text className="text-xs text-slate-300">{tag}</Text>
                  </View>
                ))}
              </View>
            ) : null}
            <View className="flex-row flex-wrap gap-2">
              <View className="rounded-lg border border-white/10 bg-surface-alt/70 px-3 py-2">
                <Text className="text-xs text-slate-400">Dificultad</Text>
                <Text className="text-base text-white">{formatNumber(workout.estimated_difficulty)}</Text>
              </View>
              <View className="rounded-lg border border-white/10 bg-surface-alt/70 px-3 py-2">
                <Text className="text-xs text-slate-400">XP estimada</Text>
                <Text className="text-base text-white">{formatNumber(workout.xp_estimate)}</Text>
              </View>
              <View className="rounded-lg border border-white/10 bg-surface-alt/70 px-3 py-2">
                <Text className="text-xs text-slate-400">Tiempo promedio</Text>
                <Text className="text-base text-white">
                  {workout.avg_time_seconds ? formatTimeSeconds(workout.avg_time_seconds) : "-"}
                </Text>
              </View>
            </View>
            <Button
              className="mt-4"
              label={repeatLoading ? "Repitiendo..." : "Repetir"}
              onPress={handleRepeat}
              disabled={repeatLoading}
            />
          </Card>
        ) : null}

        {!loading && !workout && !error ? (
          <EmptyState title="Workout no encontrado" description="No pudimos cargar el detalle solicitado." />
        ) : null}
      </Section>
    </ScrollView>
  );
}
