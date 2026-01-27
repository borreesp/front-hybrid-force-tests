export const MetricKey = {
  RESISTANCE: "resistance",
  STRENGTH: "strength",
  METCON: "metcon",
  GYMNASTICS: "gymnastics",
  SPEED: "speed",

  FATIGUE_SCORE: "fatigue_score",

  ACUTE_LOAD: "acute_load",
  CHRONIC_LOAD: "chronic_load",
  LOAD_RATIO: "load_ratio",
  RECOVERY_HOURS: "recovery_time_hours",

  HR_REST: "hr_rest",
  HR_AVG: "hr_avg",
  HR_MAX: "hr_max",
  HRV: "hrv",
  VO2_EST: "vo2_est",
  SLEEP_HOURS: "sleep_hours",

  HYROX_TRANSFER_SCORE: "hyrox_transfer_score",

  SKILL_ROW: "skill_row",
  SKILL_WALL_BALLS: "skill_wall_balls",
  SKILL_KB_LUNGE: "skill_kettlebell_lunge",
  SKILL_BURPEE_BJO: "skill_burpee_box_jump_over"
} as const;

export const MetricAliases: Record<string, string> = {
  resistencia: MetricKey.RESISTANCE,
  resistance: MetricKey.RESISTANCE,
  fuerza: MetricKey.STRENGTH,
  strength: MetricKey.STRENGTH,
  metcon: MetricKey.METCON,
  gimnasticos: MetricKey.GYMNASTICS,
  gimnasia: MetricKey.GYMNASTICS,
  gymnastics: MetricKey.GYMNASTICS,
  velocidad: MetricKey.SPEED,
  fatigue: MetricKey.FATIGUE_SCORE,
  fatigue_score: MetricKey.FATIGUE_SCORE,
  hyrox_transfer: MetricKey.HYROX_TRANSFER_SCORE,
  hyrox_transfer_score: MetricKey.HYROX_TRANSFER_SCORE,
  load_ratio: MetricKey.LOAD_RATIO,
  acute_load: MetricKey.ACUTE_LOAD,
  chronic_load: MetricKey.CHRONIC_LOAD,
  recovery_time_hours: MetricKey.RECOVERY_HOURS,
  hr_rest: MetricKey.HR_REST,
  hr_avg: MetricKey.HR_AVG,
  hr_max: MetricKey.HR_MAX,
  hrv: MetricKey.HRV,
  vo2_est: MetricKey.VO2_EST,
  sleep_hours: MetricKey.SLEEP_HOURS,
  skill_row: MetricKey.SKILL_ROW,
  wallball_skill: MetricKey.SKILL_WALL_BALLS,
  skill_wall_balls: MetricKey.SKILL_WALL_BALLS,
  skill_kettlebell_lunge: MetricKey.SKILL_KB_LUNGE,
  skill_burpee_box_jump_over: MetricKey.SKILL_BURPEE_BJO
};

export function normalizeMetricKey(key: string): string {
  const base = key.toLowerCase();
  return MetricAliases[base] ?? base;
}

