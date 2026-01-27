"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { Route } from "next";
import { useParams, useRouter } from "next/navigation";
import { WorkoutDetailLayout } from "../../../../components/workout/WorkoutDetailLayout";
import { api } from "../../../../lib/api";
import type {
  AthleteProfileResponse,
  AuthUser,
  Equipment,
  Workout,
  WorkoutAnalysis
} from "../../../../lib/types";
import { expectedMetricKeys, recordMetrics } from "../../../../lib/metrics-debug";
import { adaptAthleteImpact, adaptAthleteProfile, adaptWorkoutComputedMetrics } from "../../../../lib/metrics/adapters";

type LoadState<T> = { data: T | null; loading: boolean; error?: string | null };

export default function WodAnalysisResultPage() {
  const params = useParams<{ id: string }>();
  const workoutId = params?.id;
  const router = useRouter();

  const [workoutState, setWorkoutState] = useState<LoadState<Workout>>({ data: null, loading: true });
  const [analysisState, setAnalysisState] = useState<LoadState<WorkoutAnalysis>>({ data: null, loading: true });
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [similarState, setSimilarState] = useState<LoadState<Workout[]>>({ data: null, loading: true });
  const [athleteProfile, setAthleteProfile] = useState<AthleteProfileResponse | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    if (!workoutId) return;
    setWorkoutState((prev) => ({ ...prev, loading: true }));
    setAnalysisState((prev) => ({ ...prev, loading: true }));
    setSimilarState((prev) => ({ ...prev, loading: true }));

    Promise.all([
      api.getWorkoutStructure(workoutId),
      api.getWorkoutAnalysis(workoutId).catch(() => null),
      api.getWorkoutSimilar?.(workoutId).catch(() => null),
      api.getEquipment().catch(() => []),
      api.getAthleteProfile().catch(() => null),
      api.me().catch(() => null)
    ])
      .then(([workoutPayload, analysisPayload, similarPayload, equipmentPayload, athletePayload, mePayload]) => {
        setWorkoutState({ data: workoutPayload, loading: false });
        setAnalysisState({ data: analysisPayload, loading: false });
        setSimilarState({ data: similarPayload, loading: false });
        setEquipment(equipmentPayload ?? []);
        setAthleteProfile(athletePayload);
        setUser(mePayload?.user ?? null);
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : "Error";
        setWorkoutState({ data: null, loading: false, error: message });
        setAnalysisState({ data: null, loading: false, error: message });
        setSimilarState((prev) => ({ ...prev, loading: false, error: message }));
      });
  }, [workoutId]);

  const workout = workoutState.data;
  const analysis = analysisState.data;

  useEffect(() => {
    if (!workout) return;
    recordMetrics("wodAnalysisResult", "athleteProfile", adaptAthleteProfile(athleteProfile ?? undefined as any), [
      ...expectedMetricKeys.capacities,
      ...expectedMetricKeys.biometrics,
      ...expectedMetricKeys.load,
      ...expectedMetricKeys.state
    ]);
    recordMetrics("wodAnalysisResult", "workoutMetadata", adaptWorkoutComputedMetrics(workout as any), [
      ...expectedMetricKeys.hyrox,
      "estimated_difficulty",
      "avg_time_seconds",
      "avg_rating",
      "avg_difficulty",
      "work_rest_ratio"
    ]);
    if (analysis) {
      recordMetrics("wodAnalysisResult", "athleteImpact", adaptAthleteImpact((analysis as any).athlete_impact as any));
    }
  }, [analysis, athleteProfile, workout]);

  const similarWorkouts = useMemo(() => similarState.data ?? [], [similarState.data]);

  const timeRoute = useMemo(() => {
    const candidate = workout?.id ?? analysis?.workout_id ?? workoutId;
    return candidate ? `/workouts/${candidate}/time` : null;
  }, [analysis?.workout_id, workout?.id, workoutId]);

  const handleGoToTime = () => {
    if (!timeRoute) return;
    router.push(timeRoute as Route);
  };

  if (workoutState.loading) return <p className="text-sm text-slate-400">Cargando analisis...</p>;
  if (!workout) return <p className="text-sm text-rose-300">WOD no encontrado.</p>;

  return (
    <WorkoutDetailLayout
      mode="analysis"
      workout={workout}
      analysis={analysis}
      equipment={equipment}
      athleteProfile={athleteProfile}
      user={user}
      similarWorkouts={similarWorkouts}
      applyHref={timeRoute ?? undefined}
      onApplyTraining={handleGoToTime}
    />
  );
}
