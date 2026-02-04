import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Card, Section } from "@thrifty/ui";
import type { AthleteProfileResponse, AthletePrStat } from "../../core/types";
import { EmptyState } from "../State";
import { formatDate, formatNumber } from "../../utils/format";

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

type PRsAndTestsSectionProps = {
  profile: AthleteProfileResponse | null;
  topPrs: AthletePrStat[];
};

export const PRsAndTestsSection: React.FC<PRsAndTestsSectionProps> = ({ profile, topPrs }) => {
  const [showAllPrs, setShowAllPrs] = useState(false);

  const testsSummary = profile?.tests;
  const metrics = useMemo(() => {
    const testsTotal = testsSummary?.tests_total ?? 0;
    const tests7d = testsSummary?.tests_7d ?? 0;
    const weeklyStreak = testsSummary?.weekly_streak ?? profile?.career?.weekly_streak ?? null;
    const lastTest = testsSummary?.last_test_at ? formatDate(testsSummary.last_test_at) : "Sin datos";
    return [
      { label: "Tests totales", value: `${testsTotal}` },
      { label: "Tests 7d", value: `${tests7d}` },
      { label: "Racha semanal", value: weeklyStreak != null ? `${weeklyStreak}` : "-" },
      { label: "Ultimo test", value: lastTest },
    ];
  }, [profile?.career?.weekly_streak, testsSummary]);

  const prs = useMemo(() => {
    const source = topPrs.length ? topPrs : profile?.prs ?? [];
    return source.slice(0, 5).map((pr) => ({
      name: (pr as any).name ?? (pr as any).movement ?? "PR",
      score: `${pr.value}${pr.unit ? ` ${pr.unit}` : ""}`,
      date: pr.achieved_at ? formatDate(pr.achieved_at) : "-",
    }));
  }, [profile?.prs, topPrs]);

  const allPrs = useMemo(() => {
    return (profile?.prs ?? []).map((pr) => ({
      name: pr.movement ?? pr.pr_type ?? "PR",
      value: pr.value ?? 0,
      unit: pr.unit ?? undefined,
      type: pr.pr_type ?? undefined,
      date: pr.achieved_at ?? null,
    }));
  }, [profile?.prs]);

  const kgPrs = dedupeBestByName(allPrs.filter(isKg), (next, current) => next.value > current.value);
  const timePrs = dedupeBestByName(
    allPrs.filter((pr) => !isKg(pr) && isTime(pr)),
    (next, current) => next.value < current.value
  );
  const scorePrs = dedupeBestByName(
    allPrs.filter((pr) => !isKg(pr) && !isTime(pr)),
    (next, current) => next.value > current.value
  );

  return (
    <Section title="PRs y Tests" description="Records personales y estado de tus tests.">
      <Card className="bg-slate-900/70">
        <Text className="text-sm text-slate-300">Resumen de tests</Text>
        <View className="mt-3 gap-2">
          {metrics.map((metric) => (
            <View key={metric.label} className="flex-row items-center justify-between rounded-lg bg-white/5 px-3 py-2">
              <Text className="text-sm text-slate-200">{metric.label}</Text>
              <Text className="text-sm font-semibold text-white">{metric.value}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Card className="bg-slate-900/70">
        <View className="flex-row items-center justify-between">
          <Text className="text-sm text-slate-300">PRs recientes</Text>
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
  );
};
