import { useCallback, useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { Card, Metric, Section } from "@thrifty/ui";
import { api } from "../src/core/api";
import type { CareerSnapshot } from "../src/core/types";
import { ErrorState } from "../src/components/State";
import { Skeleton } from "../src/components/Skeleton";
import { formatNumber } from "../src/utils/format";

export default function ProgressScreen() {
  const [career, setCareer] = useState<CareerSnapshot | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      const data = await api.getAthleteCareer();
      setCareer(data);
      setStatus("idle");
    } catch (err: any) {
      setError(err?.message ?? "No pudimos cargar tu progreso.");
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const progressPct = Math.min(Math.max(career?.progress_pct ?? 0, 0), 100);
  const nextLevel = career?.next_level ?? (career?.level ? career.level + 1 : 1);

  return (
    <ScrollView className="flex-1 bg-surface px-4 pb-10">
      <View className="mt-6 gap-4">
        <Section title="Modo carrera" description="Seguimiento de niveles y XP">
          {status === "loading" ? (
            <Card>
              <Skeleton height={16} width="70%" className="mb-2" />
              <Skeleton height={12} width="40%" />
            </Card>
          ) : null}
          {status === "error" && error ? <ErrorState message={error} onRetry={load} /> : null}
          {status === "idle" && career ? (
            <>
              <Metric label="Nivel actual" value={formatNumber(career.level)} hint={`${progressPct}% completado`} trend="up" />
              <Metric label="XP acumulado" value={formatNumber(career.xp_total)} hint="Total" trend="up" />
              <Metric label="Racha semanal" value={formatNumber(career.weekly_streak ?? 0)} hint="Tests consecutivos" trend="neutral" />
            </>
          ) : null}
        </Section>

        <Section title="Ruta de niveles" description="Progreso hacia el siguiente nivel">
          {status === "idle" && career ? (
            <Card>
              <View className="mb-3">
                <View className="mb-1 flex flex-row items-center justify-between">
                  <Text className="text-sm text-slate-200">Nivel {career.level}</Text>
                  <Text className="text-sm text-slate-400">{progressPct}%</Text>
                </View>
                <View className="h-2 w-full rounded-full bg-white/10">
                  <View className="h-2 rounded-full bg-brand" style={{ width: `${progressPct}%` }} />
                </View>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-xs text-slate-400">Siguiente nivel</Text>
                <Text className="text-xs text-slate-300">Nivel {nextLevel}</Text>
              </View>
            </Card>
          ) : null}
        </Section>
      </View>
    </ScrollView>
  );
}
