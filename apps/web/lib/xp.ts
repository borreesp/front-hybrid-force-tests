const XP_MIN = 40;
const XP_MAX = 600;
const LEVEL_FACTOR_MAX = 1.15;
const LEVEL_FACTOR_MIN = 0.65;
const FATIGUE_EXPONENT = 1.3;

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const levelFactor = (level?: number | null) => {
  if (level == null) return 1;
  return clamp(LEVEL_FACTOR_MAX - 0.01 * level, LEVEL_FACTOR_MIN, LEVEL_FACTOR_MAX);
};

export const computeXpEstimate = (fatigue0to10: number, athleteLevel?: number | null) => {
  const norm = clamp(fatigue0to10 / 10, 0, 1);
  const xpBase = XP_MIN + (XP_MAX - XP_MIN) * norm ** FATIGUE_EXPONENT;
  const factor = levelFactor(athleteLevel);
  const xp = Math.round(xpBase * factor);
  return { xp, xpBase, levelFactor: factor, fatigueNorm: norm };
};
