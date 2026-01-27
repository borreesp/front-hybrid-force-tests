import { normalizeMetricKey } from "./metric-keys";
import type { AthleteImpactDelta, AthleteProfileMetrics, WorkoutComputedMetrics } from "./metrics-types";

const toNumber = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export function adaptAthleteProfile(raw: Record<string, any>): AthleteProfileMetrics {
  const out: AthleteProfileMetrics = {};
  Object.entries(raw ?? {}).forEach(([k, v]) => {
    const normalized = normalizeMetricKey(k) as keyof AthleteProfileMetrics;
    out[normalized] = toNumber(v);
  });
  return out;
}

export function adaptWorkoutComputedMetrics(raw: Record<string, any>): WorkoutComputedMetrics {
  const out: WorkoutComputedMetrics = {};
  Object.entries(raw ?? {}).forEach(([k, v]) => {
    const normalized = normalizeMetricKey(k) as keyof WorkoutComputedMetrics;
    out[normalized] = toNumber(v) ?? (Array.isArray(v) ? (v as any) : undefined);
  });
  return out;
}

export function adaptAthleteImpact(raw: Record<string, any>): AthleteImpactDelta {
  const out: AthleteImpactDelta = {};
  Object.entries(raw ?? {}).forEach(([k, v]) => {
    const normalized = normalizeMetricKey(k);
    out[normalized] = toNumber(v) ?? 0;
  });
  return out;
}

