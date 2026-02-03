"use client";
import { useEffect, useMemo, useState } from "react";
import { Section } from "@thrifty/ui";
import { api } from "../../lib/api";
import type { RankingDashboardMetric, RankingEntry, RankingPeriod, RankingSummary } from "../../lib/types";
import { useAppStore } from "@thrifty/utils";
import { RankingCard } from "../../components/ranking/RankingCard";
import { Top10Modal } from "../../components/ranking/Top10Modal";

type CardConfig = {
  key: RankingDashboardMetric;
  title: string;
  helpKey?: string;
};

const periodOptions: { value: RankingPeriod; label: string }[] = [
  { value: "day", label: "Dia" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mes" },
  { value: "year", label: "Ano" }
];

const cardConfigs: CardConfig[] = [
  { key: "xp", title: "XP ganado" },
  { key: "movements", title: "Movimientos (teórico)", helpKey: "ranking.theoretical" },
  { key: "kg", title: "Kilos (teórico)", helpKey: "ranking.theoretical" },
  { key: "tests", title: "Tests completados" },
  { key: "best_time", title: "Mejor tiempo" },
  { key: "prs", title: "PRs logrados" }
];

const formatSeconds = (total?: number | null) => {
  if (!total || total <= 0) return "-";
  const minutes = Math.floor(total / 60);
  const seconds = Math.round(total % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}`;
};

const formatValue = (metric: RankingDashboardMetric, value: number) => {
  if (metric === "best_time") return formatSeconds(value);
  if (metric === "kg") return `${new Intl.NumberFormat("es-ES").format(Math.round(value))} kg`;
  if (metric === "movements") return `${new Intl.NumberFormat("es-ES").format(Math.round(value))} reps`;
  return new Intl.NumberFormat("es-ES").format(Math.round(value));
};

export default function RankingPage() {
  const [period, setPeriod] = useState<RankingPeriod>("week");
  const [summary, setSummary] = useState<RankingSummary>({});
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [activeMetric, setActiveMetric] = useState<RankingDashboardMetric | null>(null);
  const userId = useAppStore((s) => s.user?.id ?? null);

  useEffect(() => {
    setStatus("loading");
    setError(null);
    setActiveMetric(null);
    api
      .getRankingSummary(period, 10)
      .then((data) => {
        setSummary(data?.data || {});
        setStatus("idle");
      })
      .catch((err) => {
        setError(err.message);
        setStatus("error");
      });
  }, [period]);

  const visibleCards = useMemo(() => {
    const baseKeys = new Set<RankingDashboardMetric>(["xp", "movements", "kg"]);
    if (status === "loading") return cardConfigs;
    return cardConfigs.filter((config) => {
      if (baseKeys.has(config.key)) return true;
      return summary[config.key] !== undefined;
    });
  }, [summary, status]);

  const activeEntries: RankingEntry[] = activeMetric ? summary[activeMetric] ?? [] : [];
  const activeTitle = activeMetric
    ? cardConfigs.find((config) => config.key === activeMetric)?.title ?? "Top 10"
    : "Top 10";

  return (
    <div className="space-y-6">
      <Section title="Ranking" description="Dashboard de lideres por periodo y metrica.">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Periodo global</p>
            <p className="text-sm text-slate-300">Selecciona un periodo y actualiza todo el ranking.</p>
          </div>
          <select
            value={period}
            onChange={(event) => setPeriod(event.target.value as RankingPeriod)}
            className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-white"
          >
            {periodOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </Section>

      {status === "error" && (
        <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          Error al cargar ranking: {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visibleCards.map((config) => (
          <RankingCard
            key={config.key}
            title={config.title}
            metric={config.key}
            entries={summary[config.key] ?? []}
            isLoading={status === "loading"}
            currentUserId={userId}
            formatValue={formatValue}
            helpKey={config.helpKey}
            onOpenTop10={() => setActiveMetric(config.key)}
          />
        ))}
      </div>

      <Top10Modal
        open={Boolean(activeMetric)}
        title={activeTitle}
        metric={activeMetric ?? "xp"}
        entries={activeEntries}
        currentUserId={userId}
        formatValue={formatValue}
        onClose={() => setActiveMetric(null)}
      />
    </div>
  );
}
