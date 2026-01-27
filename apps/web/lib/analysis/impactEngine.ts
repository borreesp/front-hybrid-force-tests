import rulesJson from "./movement_rules.json";

type MovementRule = {
  base_unit: "reps" | "meters" | "calories" | "seconds";
  base_value: number;
  base_score: number;
  exponent: number;
  supports_time?: boolean;
  pro_time_seconds?: number;
  level_time_factors?: Record<string, number>;
  main_muscle?: string;
  capacity_weights?: Record<string, number>;
};

export type ImpactMovementInput = {
  name: string;
  reps?: number;
  distance_meters?: number;
  load?: number;
  calories?: number;
  duration_seconds?: number;
  target_time_seconds?: number;
  execution_multiplier?: number;
};

export type ImpactBlockInput = {
  title?: string;
  rounds?: number;
  movements: ImpactMovementInput[];
};

export type ImpactMovementResult = {
  name: string;
  fatigue: number;
  quantity: number;
  unit: string;
  muscle: string;
  intensityMultiplier: number;
  musclePenalty: number;
  ruleApplied: string;
  target_time_seconds?: number;
};

export type ImpactBlockResult = {
  blockIndex: number;
  title?: string;
  fatigue: number;
  movements: ImpactMovementResult[];
};

export type WodImpactResult = {
  fatigue_total: number;
  raw_fatigue: number;
  capacities: Record<string, number>;
  muscle_load: Record<string, number>;
  muscle_counts: Record<string, number>;
  fatigue_by_block: ImpactBlockResult[];
  warnings: string[];
};

type RuleMatch = {
  name: string;
  rule: MovementRule;
};

const rulesLookup: RuleMatch[] = Object.entries(rulesJson as Record<string, MovementRule>).map(([name, rule]) => ({
  name,
  rule
}));

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export const findMovementRule = (movementName?: string): RuleMatch | undefined => {
  if (!movementName) return undefined;
  const target = movementName.toLowerCase();
  return rulesLookup.find((entry) => entry.name.toLowerCase() === target);
};

export const supportsTimeForMovement = (movementName?: string) => Boolean(findMovementRule(movementName)?.rule.supports_time);

const defaultRule: MovementRule = {
  base_unit: "reps",
  base_value: 10,
  base_score: 1,
  exponent: 0.9,
  supports_time: false,
  main_muscle: "general",
  capacity_weights: { metcon: 0.5 }
};

const resolveQuantity = (rule: MovementRule, mv: ImpactMovementInput) => {
  switch (rule.base_unit) {
    case "meters":
      return mv.distance_meters ?? 0;
    case "calories":
      return mv.calories ?? 0;
    case "seconds":
      return mv.duration_seconds ?? 0;
    case "reps":
    default:
      return mv.reps ?? 0;
  }
};

const levelFactor = (level_time_factors: Record<string, number> | undefined, athleteLevel: number) => {
  if (!level_time_factors) return 1;
  const ordered = Object.entries(level_time_factors)
    .map(([k, v]) => [Number(k), v] as const)
    .sort((a, b) => b[0] - a[0]);
  for (const [level, factor] of ordered) {
    if (athleteLevel >= level) return factor;
  }
  return ordered.at(-1)?.[1] ?? 1;
};

const musclePenaltyForCount = (count: number) => {
  if (count >= 4) return 1.5;
  if (count === 3) return 1.25;
  if (count === 2) return 1.1;
  return 1;
};

export const calculateWodImpact = (blocks: ImpactBlockInput[], athleteLevel: number): WodImpactResult => {
  const capacities: Record<string, number> = {};
  const muscleLoad: Record<string, number> = {};
  const muscleCounts: Record<string, number> = {};
  const warnings: Set<string> = new Set();
  const breakdown: ImpactBlockResult[] = [];
  let rawFatigueTotal = 0;

  blocks.forEach((block, blockIndex) => {
    const repeats = Math.max(1, block.rounds ?? 1);
    let blockFatigue = 0;
    const movementsResults: ImpactMovementResult[] = [];

    const processMovement = (mv: ImpactMovementInput) => {
      // Rest blocks reduce fatiga ligeramente y no cargan músculos/capacidades
      if (mv.name === "__REST__") {
        const duration = mv.duration_seconds ?? 0;
        const recovery = -((duration / 60) * 0.5); // -0.5 por minuto de descanso
        rawFatigueTotal += recovery;
        blockFatigue += recovery;
        movementsResults.push({
          name: "Descanso",
          fatigue: recovery,
          quantity: duration,
          unit: "seconds",
          muscle: "rest",
          intensityMultiplier: 1,
          musclePenalty: 1,
          ruleApplied: "rest"
        });
        return;
      }

      const ruleMatch = findMovementRule(mv.name);
      const rule = ruleMatch?.rule ?? defaultRule;
      const quantityRaw = resolveQuantity(rule, mv);
      const fallbackQuantity = mv.reps ?? mv.distance_meters ?? mv.calories ?? mv.duration_seconds ?? 0;
      const quantity = quantityRaw > 0 ? quantityRaw : fallbackQuantity > 0 ? fallbackQuantity : 0;
      const unit =
        quantityRaw > 0
          ? rule.base_unit ?? "reps"
          : mv.distance_meters
            ? "meters"
            : mv.duration_seconds
              ? "seconds"
              : rule.base_unit ?? "reps";
      if (!quantity) {
        movementsResults.push({
          name: mv.name,
          fatigue: 0,
          quantity,
          unit,
          muscle: rule.main_muscle ?? "general",
          intensityMultiplier: 1,
          musclePenalty: 1,
          ruleApplied: ruleMatch?.name ?? "default",
          target_time_seconds: mv.target_time_seconds
        });
        return;
      }

      const workScore = Math.pow(quantity / Math.max(1, rule.base_value), rule.exponent ?? 1) * (rule.base_score ?? 1);

      let intensityMultiplier = 1;
      if (rule.supports_time && mv.target_time_seconds && rule.pro_time_seconds) {
        const expected = rule.pro_time_seconds * levelFactor(rule.level_time_factors, athleteLevel);
        const ratio = expected / mv.target_time_seconds;
        intensityMultiplier = clamp(ratio, 0.8, 1.5);
      }

      const muscle = rule.main_muscle ?? "general";
      const muscleCount = (muscleCounts[muscle] ?? 0) + 1;
      muscleCounts[muscle] = muscleCount;
      const musclePenalty = musclePenaltyForCount(muscleCount);

      const movementFatigue = workScore * intensityMultiplier * musclePenalty;
      const executionMultiplier = mv.execution_multiplier ?? 1;
      const movementFatigueFinal = movementFatigue * executionMultiplier;
      rawFatigueTotal += movementFatigueFinal;
      blockFatigue += movementFatigueFinal;

      Object.entries(rule.capacity_weights ?? {}).forEach(([cap, weight]) => {
        capacities[cap] = (capacities[cap] ?? 0) + movementFatigueFinal * weight;
      });

      muscleLoad[muscle] = (muscleLoad[muscle] ?? 0) + movementFatigueFinal;

      if (muscleCount >= 4) {
        warnings.add(`Alta acumulacion de ${muscle} (x${muscleCount})`);
      }

      movementsResults.push({
        name: mv.name,
        fatigue: movementFatigue,
        quantity,
        unit,
        muscle,
        intensityMultiplier,
        musclePenalty,
        ruleApplied: ruleMatch?.name ?? "default",
        target_time_seconds: mv.target_time_seconds
      });
    };

    for (let i = 0; i < repeats; i += 1) {
      block.movements.forEach(processMovement);
    }

    breakdown.push({
      blockIndex,
      title: block.title ?? `Bloque ${blockIndex + 1}`,
      fatigue: blockFatigue,
      movements: movementsResults
    });
  });

  const fatigue_total = clamp(rawFatigueTotal, 0, 10);

  return {
    fatigue_total,
    raw_fatigue: rawFatigueTotal,
    capacities,
    muscle_load: muscleLoad,
    muscle_counts: muscleCounts,
    fatigue_by_block: breakdown,
    warnings: Array.from(warnings)
  };
};
