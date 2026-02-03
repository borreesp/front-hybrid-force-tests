import { useCallback } from "react";

import {
  getAthleteProfile,
  getMyProfile,
  getRankingSummary,
  getWorkoutExecutions,
  getWorkouts
} from "../api/endpoints";
import { keys } from "./keys";
import { useQuery } from "./useQuery";

export function useAthleteProfile() {
  const fetcher = useCallback(() => getAthleteProfile(), []);
  return useQuery(keys.athleteProfile(), fetcher, { ttlMs: 30_000 });
}

export function useMyProfile() {
  const fetcher = useCallback(() => getMyProfile(), []);
  return useQuery(keys.myProfile(), fetcher, { ttlMs: 30_000 });
}

export function useWorkouts() {
  const fetcher = useCallback(() => getWorkouts(), []);
  return useQuery(keys.workouts(), fetcher, { ttlMs: 60_000 });
}

export function useExecutions() {
  const fetcher = useCallback(() => getWorkoutExecutions(), []);
  return useQuery(keys.executions(), fetcher, { ttlMs: 15_000 });
}

export function useRankingSummary(period: string) {
  const fetcher = useCallback(() => getRankingSummary(period), [period]);
  return useQuery(keys.ranking(period), fetcher, { ttlMs: 30_000 });
}
