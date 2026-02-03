import { useCallback, useEffect, useMemo, useState } from "react";
import { Modal, RefreshControl, ScrollView, Text, View } from "react-native";
import { Button, Card, Section } from "@thrifty/ui";
import { api } from "../../src/core/api";
import type {
  RankingDashboardMetric,
  RankingEntry,
  RankingPeriod,
  RankingSummary,
  RankingSummaryResponse
} from "../../src/core/types";
import { Avatar } from "../../src/components/Avatar";
import { Skeleton } from "../../src/components/Skeleton";
import { ErrorState, EmptyState } from "../../src/components/State";
import { formatNumber, formatTimeSeconds } from "../../src/utils/format";

type MetricCard = {
  key: RankingDashboardMetric;
  label: string;
  suffix?: string;
};

const METRICS: MetricCard[] = [
  { key: "xp", label: "XP ganado" },
  { key: "movements", label: "Movimientos (teorico)", suffix: "reps" },
  { key: "kg", label: "Kilos (teorico)", suffix: "kg" },
  { key: "tests", label: "Tests completados" },
  { key: "best_time", label: "Mejor tiempo" },
  { key: "prs", label: "PRs logrados" }
];

const PERIODS: { key: RankingPeriod; label: string }[] = [
  { key: "day", label: "Dia" },
  { key: "week", label: "Semana" },
  { key: "month", label: "Mes" },
  { key: "year", label: "Ano" }
];

function formatValue(metric: RankingDashboardMetric, value: number, suffix?: string) {
  if (metric === "best_time") return formatTimeSeconds(value);
  if (metric === "kg") return `${formatNumber(Math.round(value))} kg`;
  if (metric === "movements") return `${formatNumber(Math.round(value))} reps`;
  const text = formatNumber(value);
  return suffix ? `${text} ${suffix}` : text;
}

export default function RankingTab() {
  const [period, setPeriod] = useState<RankingPeriod>("week");
  const [summary, setSummary] = useState<RankingSummary>({});
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [activeMetric, setActiveMetric] = useState<MetricCard | null>(null);
  const [metadata, setMetadata] = useState<RankingSummaryResponse["metadata"] | null>(null);

  const load = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      const data = await api.getRankingSummary(period, 10);
      setSummary(data?.data || {});
      setMetadata(data?.metadata || null);
      setStatus("idle");
    } catch (err: any) {
      setError(err?.message ?? "No pudimos cargar el ranking.");
      setStatus("error");
    }
  }, [period]);

  useEffect(() => {
    load();
  }, [load]);

  const theoretical = metadata?.calculation_mode === "theoretical";

  const visibleCards = useMemo(() => {
    const baseKeys = new Set<RankingDashboardMetric>(["xp", "movements", "kg"]);
    if (status === "loading") return METRICS;
    return METRICS.filter((config) => {
      if (baseKeys.has(config.key)) return true;
      return summary[config.key] !== undefined;
    });
  }, [summary, status]);

  const activeEntries: RankingEntry[] = activeMetric ? summary[activeMetric.key] ?? [] : [];

  return (
    <ScrollView
      className="px-4 pb-10"
      refreshControl={
        <RefreshControl
          refreshing={status === "loading"}
          onRefresh={load}
          colors={["#38bdf8"]}
          tintColor="#38bdf8"
        />
      }
    >
      <Section title="Ranking" description="Top atletas por periodo.">
        <View className="flex flex-row flex-wrap gap-2">
          {PERIODS.map((item) => (
            <Button
              key={item.key}
              size="sm"
              variant={period === item.key ? "primary" : "secondary"}
              label={item.label}
              onPress={() => setPeriod(item.key)}
              disabled={status === "loading"}
            />
          ))}
        </View>

        {status === "loading" ? (
          <Card>
            <Skeleton height={16} width="60%" className="mb-2" />
            <Skeleton height={12} width="40%" className="mb-2" />
            <Skeleton height={12} width="80%" />
          </Card>
        ) : null}

        {status === "error" && error ? <ErrorState message={error} onRetry={load} /> : null}

        {status !== "loading" && status !== "error" ? (
          <View className="gap-3">
            {visibleCards.map((metric) => {
              const top1 = (summary?.[metric.key] ?? [])[0] as RankingEntry | undefined;
              const label =
                theoretical && (metric.key === "movements" || metric.key === "kg")
                  ? `${metric.label} (teorico)`
                  : metric.label;
              return (
                <Card key={metric.key} title={label}>
                  {top1 ? (
                    <View className="flex flex-row items-center gap-3">
                      <Avatar
                        uri={top1.avatar_url ?? undefined}
                        name={top1.display_name ?? top1.name}
                        size={44}
                      />
                      <View className="flex-1">
                        <Text className="text-sm font-semibold text-white">
                          {top1.display_name ?? top1.name}
                        </Text>
                        <Text className="text-xs text-slate-400">
                          #{top1.rank} - {formatValue(metric.key, top1.value, metric.suffix)}
                        </Text>
                      </View>
                      <Button
                        size="sm"
                        variant="ghost"
                        label="Ver Top 10"
                        onPress={() => setActiveMetric(metric)}
                        disabled={status === "loading"}
                      />
                    </View>
                  ) : (
                    <EmptyState title="Sin datos" description="No hay datos para este periodo." />
                  )}
                </Card>
              );
            })}
          </View>
        ) : null}
      </Section>

      <Modal
        visible={Boolean(activeMetric)}
        animationType="slide"
        transparent
        onRequestClose={() => setActiveMetric(null)}
      >
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-slate-900 rounded-t-2xl p-4" style={{ maxHeight: 520 }}>
            <View className="flex flex-row items-center justify-between mb-3">
              <Text className="text-lg font-semibold text-white">
                {activeMetric?.label ?? "Top 10"}
              </Text>
              <Button label="Cerrar" size="sm" variant="ghost" onPress={() => setActiveMetric(null)} />
            </View>
            <ScrollView>
              {activeEntries.length === 0 ? (
                <EmptyState title="Sin datos" description="No hay datos para este periodo." />
              ) : (
                activeEntries.map((entry) => (
                  <View
                    key={entry.user_id}
                    className={`flex flex-row items-center py-2 gap-3 ${
                      entry.rank === 1 ? "bg-white/5 rounded-lg px-2" : ""
                    }`}
                  >
                    <Text className="text-xs text-slate-400 w-6">#{entry.rank}</Text>
                    <Avatar
                      uri={entry.avatar_url ?? undefined}
                      name={entry.display_name ?? entry.name}
                      size={36}
                    />
                    <View className="flex-1">
                      <Text className="text-sm text-white">
                        {entry.display_name ?? entry.name}
                      </Text>
                    </View>
                    <Text className="text-xs text-slate-400">
                      {activeMetric
                        ? formatValue(activeMetric.key, entry.value, activeMetric.suffix)
                        : formatNumber(entry.value)}
                    </Text>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
