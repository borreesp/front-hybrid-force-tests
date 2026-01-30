export const MetricKey = {
  RESISTANCE: "resistance",
  STRENGTH: "strength",
  METCON: "metcon",
  GYMNASTICS: "gymnastics",
  SPEED: "speed",

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
  hyrox_transfer: MetricKey.HYROX_TRANSFER_SCORE,
  hyrox_transfer_score: MetricKey.HYROX_TRANSFER_SCORE,
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
