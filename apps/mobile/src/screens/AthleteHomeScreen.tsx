import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Card, Section } from "@thrifty/ui";
import { api } from "../core/api";
import type { AthleteProfileResponse, AthletePrStat, WorkoutExecution } from "../core/types";
import { useAuth } from "../hooks/useAuth";
import { CapacityWidget } from "../components/capacities";
import { ErrorState } from "../components/State";
import { AthleteHeader } from "../components/athlete/AthleteHeader";
import { MilestonesSection, type MilestoneItem } from "../components/athlete/MilestonesSection";
import { PRsAndTestsSection } from "../components/athlete/PRsAndTestsSection";
import { SuggestionsSection, type Suggestion } from "../components/athlete/SuggestionsSection";
import { useCapacities, getTopCapacity } from "../features/capacities";
import { formatDate, formatTimeSeconds } from "../utils/format";

type QuickMetrics = {
  xp: number;
  sessions7d: number;
  testsTotal: number;
  topCapacity?: { name: string; value: number };
};

const CAPACITY_PREVIEW_LIMIT = 6;
const CAPACITY_ALL_LIMIT = Number.MAX_SAFE_INTEGER;

export default function AthleteHomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [data, setData] = useState<AthleteProfileResponse | null>(null);
  const [executions, setExecutions] = useState<WorkoutExecution[]>([]);
  const [topPrs, setTopPrs] = useState<AthletePrStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [capacitiesExpanded, setCapacitiesExpanded] = useState(false);

  const {
    items: capacityItems,
    mode: capacityMode,
    setMode: setCapacityMode,
    isLoading: capacitiesLoading,
    error: capacitiesError,
    refetch: refetchCapacities,
  } = useCapacities({ maxItems: CAPACITY_ALL_LIMIT, initialMode: "level" });

  const loadProfile = useCallback(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        refetchCapacities();
        const profile = await api.getAthleteProfile();
        if (!mounted) return;
        setData(profile);
        api
          .getWorkoutExecutions()
          .then((rows) => mounted && setExecutions(rows))
          .catch(() => mounted && setExecutions([]));
      } catch (err: any) {
        if (!mounted) return;
        setError(err?.message ?? "No se pudieron cargar los datos del atleta.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [refetchCapacities]);

  useFocusEffect(
    useCallback(() => {
      const cleanup = loadProfile();
      return () => {
        if (cleanup) cleanup();
      };
    }, [loadProfile])
  );

  useEffect(() => {
    if (!user?.id) return;
    api
      .getAthletePrsTop(user.id, 5)
      .then((res) => setTopPrs(res as AthletePrStat[]))
      .catch(() => setTopPrs([]));
  }, [user?.id]);

  const testsSummary = data?.tests;
  const testsTotal = testsSummary?.tests_total ?? 0;
  const statusMessage = data ? (testsTotal > 0 ? "Progreso activo" : "Sin tests registrados") : null;
  const statusTone = testsTotal > 0 ? "emerald" : "amber";

  const progress = data?.career?.progress_pct ?? 0;
  const level = data?.career?.level ?? 0;
  const xpTotal = data?.career?.xp_total ?? 0;
  const team = (user as { team?: string | null } | null)?.team ?? null;

  const topCapacityItem = useMemo(() => getTopCapacity(capacityItems), [capacityItems]);

  const quick: QuickMetrics = useMemo(() => {
    if (!data) {
      return {
        xp: 0,
        sessions7d: 0,
        testsTotal: 0,
        topCapacity: topCapacityItem
          ? { name: topCapacityItem.label, value: topCapacityItem.rawScore }
          : undefined,
      };
    }

    return {
      xp: data.career?.xp_total ?? 0,
      sessions7d: testsSummary?.tests_7d ?? 0,
      testsTotal: testsSummary?.tests_total ?? 0,
      topCapacity: topCapacityItem
        ? { name: topCapacityItem.label, value: topCapacityItem.rawScore }
        : undefined,
    };
  }, [data, testsSummary, topCapacityItem]);

  const suggestions: Suggestion[] = useMemo(() => {
    const out: Suggestion[] = [];
    if (quick.sessions7d === 0) {
      out.push({
        title: "Realiza tu primer test",
        detail: "Aplica un test y registra tu resultado para medir tu progreso.",
        cta: "Ver tests",
        tone: "emerald",
        href: "/workouts",
      });
    }

    if (quick.topCapacity) {
      out.push({
        title: `Enfoca ${quick.topCapacity.name}`,
        detail: "Busca un test especifico para validar avances en esta capacidad.",
        cta: "Ver tests",
        tone: "cyan",
        href: "/workouts",
      });
    }

    if (!out.length) {
      out.push({
        title: "Sin recomendaciones",
        detail: "Realiza un test para ver sugerencias personalizadas.",
        cta: "Ver tests",
        tone: "slate",
        href: "/workouts",
      });
    }

    return out;
  }, [quick.sessions7d, quick.topCapacity]);

  const milestoneItems = useMemo<MilestoneItem[]>(() => {
    if (!executions.length) {
      return [];
    }

    return executions.slice(0, 4).map((exec) => ({
      title: exec.workout?.title ?? "Test",
      date: exec.executed_at ? formatDate(exec.executed_at) : "Hoy",
      type: "Test",
      delta: exec.total_time_seconds ? formatTimeSeconds(exec.total_time_seconds) : undefined,
    }));
  }, [executions]);

  const visibleCapacityItems = useMemo(() => {
    return capacitiesExpanded
      ? capacityItems
      : capacityItems.slice(0, CAPACITY_PREVIEW_LIMIT);
  }, [capacityItems, capacitiesExpanded]);

  const canToggleCapacities = capacityItems.length > CAPACITY_PREVIEW_LIMIT;

  const handleNavigate = (href: string) => {
    router.push(href);
  };

  return (
    <ScrollView className="flex-1 bg-surface px-4 pb-10">
      <View className="mt-6 gap-4">
        <AthleteHeader
          name={user?.name ?? "Atleta"}
          avatarUri={user?.avatar ?? null}
          level={level}
          xpTotal={xpTotal}
          team={team}
          status={statusMessage ?? undefined}
          statusTone={statusTone}
          progressPct={progress}
        />

        {error && !loading ? <ErrorState message={error} /> : null}

        <Section title="Capacidades" description="Radar y comparativa por nivel.">
          <Card className="bg-slate-900/70">
            <CapacityWidget
              variant="both"
              mode={capacityMode}
              onModeChange={setCapacityMode}
              showModeSelector
              items={visibleCapacityItems}
              isLoading={capacitiesLoading}
              error={capacitiesError}
              title="Capacidades"
              radarSize={200}
            />
          </Card>
          {canToggleCapacities ? (
            <Pressable
              onPress={() => setCapacitiesExpanded((prev) => !prev)}
              className="mt-3 items-center"
            >
              <Text className="text-xs text-slate-300">
                {capacitiesExpanded ? "Ver menos" : "Ver mas"}
              </Text>
            </Pressable>
          ) : null}
        </Section>

        <MilestonesSection items={milestoneItems} />

        <PRsAndTestsSection profile={data} topPrs={topPrs} />

        <SuggestionsSection suggestions={suggestions} onSelect={handleNavigate} />
      </View>
    </ScrollView>
  );
}
