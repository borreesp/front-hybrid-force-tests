import type { Workout, WorkoutBlockMovement, Movement } from "./types";

export type HyroxComponents = {
  run: number;
  kb_lunges: number;
  wall_balls: number;
  sled_push: number;
  sled_pull: number;
  ski: number;
  row: number;
  burpee_broad_jump: number;
};

export type HyroxTransferResult = {
  transferScore: number;
  components: HyroxComponents;
  explanation: string[];
};

export const hyroxStationWeights: HyroxComponents = {
  run: 40,
  kb_lunges: 20,
  wall_balls: 10,
  sled_push: 10,
  sled_pull: 10,
  ski: 10,
  row: 10,
  burpee_broad_jump: 10
};

type HyroxInput = Partial<Omit<Workout, "blocks">> & {
  blocks?: Array<{
    notes?: string | null;
    movements: Array<
      Pick<WorkoutBlockMovement, "reps" | "distance_meters" | "duration_seconds"> & {
        movement?: Pick<Movement, "name" | "category"> | null;
      }
    >;
  }>;
  work_rest_ratio?: string | null;
  intensity?: string | null;
  volume_total?: string | null;
};

const includesAll = (name: string, parts: string[]) => parts.every((p) => name.includes(p));

const parseWorkRestRatio = (workRest?: string | null) => {
  if (!workRest) return 1;
  const match = workRest.match(/(\d+(?:\.\d+)?)\s*[:/]\s*(\d+(?:\.\d+)?)/);
  if (!match) return 1;
  const work = Number(match[1]);
  const rest = Number(match[2]);
  if (!Number.isFinite(work) || !Number.isFinite(rest) || rest === 0) return 1;
  return work / rest;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const sumVolume = (blocks: HyroxInput["blocks"]) => {
  let volume = 0;
  blocks?.forEach((block) => {
    block.movements.forEach((mv) => {
      volume += mv.distance_meters ?? 0;
      volume += (mv.reps ?? 0) * 5;
      volume += (mv.duration_seconds ?? 0) * 2;
    });
  });
  return volume;
};

export const calculateHyroxTransfer = (workout: HyroxInput): HyroxTransferResult => {
  const blocks = workout.blocks ?? [];
  const explanation: string[] = [];

  let runDistance = 0;
  let hasKB = false;
  let hasBurpeeBroad = false;
  let hasRow = false;
  let hasSki = false;
  let hasWallBall = false;
  let hasSledPush = false;
  let hasSledPull = false;

  blocks.forEach((block) => {
    block.movements.forEach((mv) => {
      const name = (mv.movement?.name || "").toLowerCase();
      const cat = (mv.movement?.category || "").toLowerCase();
      if (name.includes("run") || cat.includes("run")) {
        runDistance += mv.distance_meters ?? 0;
      }
      if (includesAll(name, ["lunge"]) || cat.includes("lunge")) hasKB = true;
      if (includesAll(name, ["burpee", "jump"])) hasBurpeeBroad = true;
      if (name.includes("row") || cat.includes("row")) hasRow = true;
      if (name.includes("ski")) hasSki = true;
      if (includesAll(name, ["wall", "ball"])) hasWallBall = true;
      if (includesAll(name, ["sled", "push"])) hasSledPush = true;
      if (includesAll(name, ["sled", "pull"])) hasSledPull = true;
    });
  });

  const components: HyroxComponents = {
    run: clamp((runDistance / 8000) * hyroxStationWeights.run, 0, hyroxStationWeights.run),
    kb_lunges: hasKB ? hyroxStationWeights.kb_lunges : 0,
    wall_balls: hasWallBall ? hyroxStationWeights.wall_balls : 0,
    sled_push: hasSledPush ? hyroxStationWeights.sled_push : 0,
    sled_pull: hasSledPull ? hyroxStationWeights.sled_pull : 0,
    ski: hasSki ? hyroxStationWeights.ski : 0,
    row: hasRow ? hyroxStationWeights.row : 0,
    burpee_broad_jump: hasBurpeeBroad ? hyroxStationWeights.burpee_broad_jump : 0
  };

  const baseScore = Object.values(components).reduce((acc, val) => acc + val, 0);

  const volumeScore = clamp(sumVolume(blocks) / 4000 * 10, 0, 10);
  const ratio = parseWorkRestRatio(workout.work_rest_ratio);
  const ratioAdj = ratio <= 1 ? 3 : ratio >= 2 ? -2 : 0;
  const intensity = (workout.intensity || "").toLowerCase();
  const intensityAdj = intensity.includes("alta") ? 5 : intensity.includes("media") ? 3 : 0;

  let transferScore = clamp(baseScore + volumeScore + ratioAdj + intensityAdj, 0, 100);

  if (runDistance > 0) explanation.push(`Carrera: ${Math.round(runDistance)}m (${Math.round(components.run)}/${hyroxStationWeights.run})`);
  if (hasKB) explanation.push("Incluye KB Lunges (transfer directa)");
  if (hasBurpeeBroad) explanation.push("Incluye Burpees Broad Jump");
  if (hasRow) explanation.push("Incluye Row");
  if (hasSki) explanation.push("Incluye SkiErg");
  if (hasWallBall) explanation.push("Incluye Wall Balls (fatiga global)");
  if (hasSledPush || hasSledPull) explanation.push(`Incluye Sled ${hasSledPush ? "Push" : ""}${hasSledPush && hasSledPull ? " y " : ""}${hasSledPull ? "Pull" : ""}`);
  explanation.push(`Volumen: +${volumeScore.toFixed(1)} por densidad`);
  explanation.push(`Work/Rest: ratio ${ratio.toFixed(2)} (${ratioAdj >= 0 ? "+" : ""}${ratioAdj})`);
  if (intensityAdj) explanation.push(`Intensidad (${workout.intensity}): +${intensityAdj}`);

  return {
    transferScore: Math.round(transferScore),
    components,
    explanation
  };
};
