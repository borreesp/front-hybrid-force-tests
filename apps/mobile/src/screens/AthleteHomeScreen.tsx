import { useEffect, useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
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

export default function AthleteHomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [data, setData] = useState<AthleteProfileResponse | null>(null);
  const [executions, setExecutions] = useState<WorkoutExecution[]>([]);
  const [topPrs, setTopPrs] = useState<AthletePrStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    items: capacityItems,
    mode: capacityMode,
    setMode: setCapacityMode,
    isLoading: capacitiesLoading,
    error: capacitiesError,
  } = useCapacities({ maxItems: 6, initialMode: "level" });

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    (async () => {
      try {
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
  }, []);

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
        title: "Registra tu primer test",
        detail: "Crea un workout tipo test y guarda tu resultado para medir progreso.",
        cta: "Crear test",
        tone: "emerald",
        href: "/workouts",
      });
    }

    if (quick.topCapacity) {
      out.push({
        title: `Enfoca ${quick.topCapacity.name}`,
        detail: "Disena un test especifico para validar avances en esta capacidad.",
        cta: "Planificar",
        tone: "cyan",
        href: "/workouts",
      });
    }

    if (!out.length) {
      out.push({
        title: "Sin recomendaciones",
        detail: "Registra un WOD para ver sugerencias personalizadas.",
        cta: "Ver WODs",
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
              items={capacityItems}
              isLoading={capacitiesLoading}
              error={capacitiesError}
              title="Capacidades"
              radarSize={200}
            />
          </Card>
        </Section>

        <MilestonesSection items={milestoneItems} />

        <PRsAndTestsSection profile={data} topPrs={topPrs} />

        <SuggestionsSection suggestions={suggestions} onSelect={handleNavigate} />
      </View>
    </ScrollView>
  );
}
