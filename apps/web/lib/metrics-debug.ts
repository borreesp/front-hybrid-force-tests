/* Debug-only helpers to audit metric usage across pages, normalized to canonical metric keys. */

import { MetricKey, normalizeMetricKey } from "./metrics/metric-keys";

type AnyRecord = Record<string, unknown>;

export const expectedMetricKeys = {
  capacities: [MetricKey.RESISTANCE, MetricKey.STRENGTH, MetricKey.METCON, MetricKey.GYMNASTICS, MetricKey.SPEED],
  biometrics: [MetricKey.HR_REST, MetricKey.HR_AVG, MetricKey.HR_MAX, MetricKey.HRV, MetricKey.VO2_EST, MetricKey.SLEEP_HOURS],
  load: [MetricKey.ACUTE_LOAD, MetricKey.CHRONIC_LOAD, MetricKey.LOAD_RATIO, MetricKey.RECOVERY_HOURS],
  state: [MetricKey.FATIGUE_SCORE],
  skills: [MetricKey.SKILL_ROW, MetricKey.SKILL_WALL_BALLS, MetricKey.SKILL_KB_LUNGE, MetricKey.SKILL_BURPEE_BJO],
  hyrox: [MetricKey.HYROX_TRANSFER_SCORE]
};

const flattenExpected = () => Object.values(expectedMetricKeys).flat();

const nullishValues = (value: unknown) =>
  value === null || value === undefined || value === "" || value === "-" || Number.isNaN(value as number);

export type MetricsReport = {
  pages: Record<
    string,
    {
      sources: Array<{
        source: string;
        keysPresent: string[];
        missing: string[];
        nullish: string[];
      }>;
      duplicated: string[];
    }
  >;
  duplicated: string[];
  missing: string[];
  frontendCalculated: string[];
};

export const metricsReport: MetricsReport = {
  pages: {},
  duplicated: [],
  missing: [],
  frontendCalculated: []
};

export function debugMetrics(label: string, payload: AnyRecord | null | undefined, expected: string[] = flattenExpected()) {
  const obj = payload || {};
  const normalizedEntries = Object.keys(obj).map((k) => normalizeMetricKey(k));
  const keysPresent = Array.from(new Set(normalizedEntries));
  const missing = expected.filter((k) => !keysPresent.includes(k));
  const nullish = Object.entries(obj)
    .map(([k, v]) => ({ k: normalizeMetricKey(k), v }))
    .filter((entry) => nullishValues(entry.v))
    .map((entry) => entry.k);
  // eslint-disable-next-line no-console
  console.groupCollapsed(`[METRICS DEBUG] ${label}`);
  // eslint-disable-next-line no-console
  console.log("payload", payload);
  // eslint-disable-next-line no-console
  console.log("keysPresent", keysPresent);
  // eslint-disable-next-line no-console
  console.log("missing", missing);
  // eslint-disable-next-line no-console
  console.log("nullish", nullish);
  // eslint-disable-next-line no-console
  console.groupEnd();
  return { keysPresent, missing, nullish };
}

export function recordMetrics(page: string, source: string, payload: AnyRecord | null | undefined, expected?: string[]) {
  const { keysPresent, missing, nullish } = debugMetrics(`${page} :: ${source}`, payload as AnyRecord, expected ?? flattenExpected());
  if (!metricsReport.pages[page]) {
    metricsReport.pages[page] = { sources: [], duplicated: [] };
  }
  metricsReport.pages[page].sources.push({ source, keysPresent, missing, nullish });

  missing.forEach((m) => {
    if (!metricsReport.missing.includes(m)) metricsReport.missing.push(m);
  });

  const existingKeys = metricsReport.pages[page].sources.flatMap((s) => s.keysPresent);
  keysPresent.forEach((k) => {
    if (existingKeys.filter((ek) => ek === k).length > 1 && !metricsReport.pages[page].duplicated.includes(k)) {
      metricsReport.pages[page].duplicated.push(k);
      if (!metricsReport.duplicated.includes(k)) metricsReport.duplicated.push(k);
    }
  });

  return { keysPresent, missing, nullish };
}

export const frontendCalculatedCandidates = [
  MetricKey.HYROX_TRANSFER_SCORE,
  "fatigue",
  "estimated_difficulty",
  "pacing_tip",
  "pacing_detail"
];

