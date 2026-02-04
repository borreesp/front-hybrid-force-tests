import { useCallback, useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Button, Card, Screen, Section } from "@thrifty/ui";
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
  const router = useRouter();
  const workoutId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [repeatLoading, setRepeatLoading] = useState(false);

  const load = useCallback(async () => {
    if (!workoutId) {
      setError("Test no encontrado.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const found = await api.getWorkoutStructure(workoutId);
      setWorkout(found ?? null);
    } catch (err: any) {
      try {
        const fallback = await api.getWorkout(workoutId);
        setWorkout(fallback ?? null);
      } catch (fallbackErr: any) {
        setError(fallbackErr?.message ?? err?.message ?? "No pudimos cargar el test.");
      }
    } finally {
      setLoading(false);
    }
  }, [workoutId]);

  useEffect(() => {
    load();
  }, [load]);

  // Extract test_code from official_tag (format: "TEST:SQUAT" -> "SQUAT")
  const testCode = workout?.official_tag?.startsWith("TEST:")
    ? workout.official_tag.replace("TEST:", "")
    : undefined;

  const handleApplyTest = async () => {
    if (!workout) return;
    if (testCode) {
      router.push({
        pathname: "/(tabs)/workouts/apply-test",
        params: { workout_id: String(workout.id), test_code: testCode },
      });
      return;
    }
    setRepeatLoading(true);
    try {
      await api.repeatWorkout(workout.id);
    } catch (err: any) {
      setError(err?.message ?? "No pudimos aplicar el test.");
    } finally {
      setRepeatLoading(false);
    }
  };

  const tags = workout
    ? uniqueStrings([
        workout.domain,
        workout.intensity,
        workout.hyrox_transfer,
        ...(workout.muscles ?? []),
      ]).slice(0, 4)
    : [];

  return (
    <Screen>
      <Section title="Test" description="Detalle del test.">
        {loading ? (
          <Card>
            <Skeleton height={16} width="70%" className="mb-2" />
            <Skeleton height={12} width="40%" className="mb-2" />
            <Skeleton height={12} width="90%" />
          </Card>
        ) : null}

        {error && !loading ? <ErrorState message={error} onRetry={load} /> : null}

        {workout && !loading ? (
          <>
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
                    <View
                      key={`${tag.toLowerCase()}-${idx}`}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1"
                    >
                      <Text className="text-xs text-slate-300">{tag}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
              <View className="flex-row flex-wrap gap-2">
                <View className="rounded-lg border border-white/10 bg-surface-alt/70 px-3 py-2">
                  <Text className="text-xs text-slate-400">Dificultad</Text>
                  <Text className="text-base text-white">
                    {formatNumber(workout.estimated_difficulty)}
                  </Text>
                </View>
                <View className="rounded-lg border border-white/10 bg-surface-alt/70 px-3 py-2">
                  <Text className="text-xs text-slate-400">XP estimada</Text>
                  <Text className="text-base text-white">
                    {formatNumber(workout.xp_estimate)}
                  </Text>
                </View>
                <View className="rounded-lg border border-white/10 bg-surface-alt/70 px-3 py-2">
                  <Text className="text-xs text-slate-400">Tiempo promedio</Text>
                  <Text className="text-base text-white">
                    {workout.avg_time_seconds
                      ? formatTimeSeconds(workout.avg_time_seconds)
                      : "-"}
                  </Text>
                </View>
              </View>
              <Button
                className="mt-4"
                label={repeatLoading ? "Aplicando..." : "Aplicar test"}
                onPress={handleApplyTest}
                disabled={repeatLoading}
              />
            </Card>

            {workout.blocks && workout.blocks.length > 0 ? (
              <Card title="Bloques del test">
                <View className="gap-4">
                  {workout.blocks.map((block, blockIndex) => (
                    <View key={block.id} className="rounded-lg border border-white/10 bg-white/5 p-3">
                      <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-sm font-semibold text-cyan-300">
                          {block.title || `Bloque ${blockIndex + 1}`}
                        </Text>
                        {block.duration_seconds ? (
                          <Text className="text-xs text-slate-400">
                            {Math.round(block.duration_seconds / 60)}'
                          </Text>
                        ) : block.rounds ? (
                          <Text className="text-xs text-slate-400">{block.rounds} rondas</Text>
                        ) : null}
                      </View>
                      {block.block_type && (
                        <Text className="text-xs text-slate-500 mb-2 uppercase">{block.block_type}</Text>
                      )}
                      {block.description && (
                        <Text className="text-xs text-slate-400 mb-2">{block.description}</Text>
                      )}
                      {block.movements && block.movements.length > 0 && (
                        <View className="gap-2 mt-1">
                          {block.movements.map((mv, mvIndex) => (
                            <View key={mv.id || mvIndex} className="flex-row items-center gap-2">
                              <Text className="text-white">•</Text>
                              <Text className="text-sm text-slate-200">
                                {mv.reps ? `${mv.reps} ` : ""}
                                {mv.movement?.name || "Movimiento"}
                                {mv.load ? ` @ ${mv.load}${mv.load_unit || "kg"}` : ""}
                                {mv.distance_meters ? ` ${mv.distance_meters}m` : ""}
                                {mv.duration_seconds ? ` ${mv.duration_seconds}s` : ""}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}
                      {block.notes && (
                        <Text className="text-xs text-slate-500 mt-2 italic">{block.notes}</Text>
                      )}
                    </View>
                  ))}
                </View>
              </Card>
            ) : (
              <Card title="Bloques del test">
                <EmptyState title="Sin bloques" description="Este test no tiene estructura registrada." />
              </Card>
            )}
          </>
        ) : null}

        {!loading && !workout && !error ? (
          <EmptyState title="Test no encontrado" description="No pudimos cargar el detalle del test." />
        ) : null}
      </Section>
    </Screen>
  );
}
