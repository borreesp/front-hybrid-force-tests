import { useCallback, useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Card, Section } from "@thrifty/ui";
import { api } from "../../../../src/core/api";
import type { WorkoutExecution } from "../../../../src/core/types";
import { Skeleton } from "../../../../src/components/Skeleton";
import { EmptyState, ErrorState } from "../../../../src/components/State";
import { formatDate, formatTimeSeconds } from "../../../../src/utils/format";

export default function ExecutionDetailScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const executionId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<WorkoutExecution | null>(null);

  const load = useCallback(async () => {
    if (!executionId) {
      setError("Ejecucion no encontrada.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await api.getWorkoutExecution(executionId);
      setDetail(response);
    } catch (err: any) {
      setError(err?.message ?? "No pudimos cargar la ejecucion.");
    } finally {
      setLoading(false);
    }
  }, [executionId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <ScrollView className="px-4 pb-10">
      <Section title="Ejecucion" description="Detalle del resultado registrado.">
        {loading ? (
          <Card>
            <Skeleton height={16} width="70%" className="mb-2" />
            <Skeleton height={12} width="40%" className="mb-2" />
            <Skeleton height={12} width="90%" />
          </Card>
        ) : null}

        {error && !loading ? <ErrorState message={error} onRetry={load} /> : null}

        {detail && !loading ? (
          <>
            <Card title={detail.workout?.title ?? `Workout ${detail.workout_id}`}>
              <Text className="text-xs text-slate-400 mb-2">Fecha: {formatDate(detail.executed_at)}</Text>
              <Text className="text-base text-white">
                Tiempo: {formatTimeSeconds(detail.total_time_seconds)}
              </Text>
            </Card>

            <Card title="Bloques">
              {detail.blocks && detail.blocks.length > 0 ? (
                detail.blocks.map((block, index) => (
                  <View key={block.id} className="flex flex-row justify-between mb-2">
                    <Text className="text-sm text-slate-200">Bloque {index + 1}</Text>
                    <Text className="text-sm text-slate-300">{formatTimeSeconds(block.time_seconds)}</Text>
                  </View>
                ))
              ) : (
                <EmptyState title="Sin tiempos por bloque" />
              )}
            </Card>
          </>
        ) : null}
      </Section>
    </ScrollView>
  );
}
