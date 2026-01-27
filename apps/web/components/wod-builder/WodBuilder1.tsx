"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Section } from "@thrifty/ui";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useDraggable,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { calculateHyroxTransfer, HyroxTransferResult } from "../../lib/hyrox";
import { expectedMetricKeys, recordMetrics } from "../../lib/metrics-debug";
import { adaptAthleteProfile, adaptAthleteImpact } from "../../lib/metrics/adapters";
import { api } from "../../lib/api";
import type { AthleteProfileResponse, Movement, Workout, WorkoutCreatePayload } from "../../lib/types";
import { computeXpEstimate } from "../../lib/xp";
import { AthleteImpact } from "../wod-analysis/AthleteImpact";
import {
  calculateWodImpact,
  ImpactBlockResult,
  ImpactBlockInput,
  findMovementRule,
  supportsTimeForMovement
} from "../../lib/analysis/impactEngine";
import { getUIConfigForMovement } from "../../lib/movementUi";
import { HelpTooltip } from "../ui/HelpTooltip";

type WodMovement = {
  uid: string;
  source_key?: string;
  movement: Movement;
  reps?: number;
  load?: number;
  load_unit?: string | null;
  distance_meters?: number;
  calories?: number;
  duration_seconds?: number;
  target_time_seconds?: number;
  execution_mode?: "INDIVIDUAL" | "SYNC" | "SHARED";
  comment?: string;
  pace?: string;
};

const CALORIE_CODES = new Set(["row", "skierg", "bike_erg", "assault_bike", "echo_bike"]);
const isCalorieMovement = (movement?: Movement) => {
  if (!movement) return false;
  const code = (movement.code || "").toLowerCase();
  if (CALORIE_CODES.has(code)) return true;
  if (movement.supports_calories !== true) return false;
  const name = (movement.name || "").toLowerCase();
  return ["row", "ski", "bike"].some((k) => name.includes(k));
};

type WodBlock = {
  id: string;
  block_type?: "STANDARD" | "INTERVALS" | "ROUNDS";
  title: string;
  type?: string;
  notes?: string;
  scenario_work_seconds?: number;
  scenario_rest_seconds?: number;
  rounds?: number;
  pattern?: string[];
  synchro?: boolean;
  team_mode?: "individual" | "pairs";
  default_team_mode?: "individual" | "pairs";
  scenarios?: Array<{
    label: string;
    tasks: Array<{ movement_uid?: string; movement_key?: string; role: "CAP" | "REMAINING" | "STANDARD" }>;
  }>;
  movements: WodMovement[];
};

type DraftParsedWod = {
  title?: string;
  notes?: string;
  blocks?: Array<{
    block_type?: string;
    title?: string;
    rounds?: number;
    work_seconds?: number;
    rest_seconds?: number;
    pattern?: string[] | null;
    scenarios?: Array<{
      code?: string;
      movements?: Array<{
        name_raw?: string;
        movement_id?: number;
        reps?: number;
        load?: number;
        load_unit?: string;
        distance_meters?: number;
        duration_seconds?: number;
        calories?: number;
      }>;
    }>;
  }>;
};

type DragItem =
  | { type: "template"; movementId: number }
  | { type: "movement"; blockId: string; uid: string };

type DropZone =
  | { type: "block"; blockId: string }
  | { type: "movement"; blockId: string; uid: string };

type AnalysisResult = {
  fatigue: number;
  xpEstimate?: number;
  domain: string;
  intensity: string;
  hyroxTransfer: number;
  hyroxDetail: HyroxTransferResult;
  totalTime: number;
  difficulty: number;
  pacing: string;
  capacities: { key: string; value: number; raw?: number }[];
  muscles: { key: string; value: number }[];
  impact: Record<string, number>;
  breakdown: ImpactBlockResult[];
  warnings: string[];
  muscleCounts: Record<string, number>;
  patternPreview?: string[];
};

const pill =
  "inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-200";

const sectionShell =
  "rounded-3xl border border-white/5 bg-gradient-to-br from-slate-950/85 via-slate-950/60 to-slate-900/70 shadow-[0_12px_50px_rgba(0,0,0,0.45)] backdrop-blur px-5 md:px-7 py-5 md:py-7";

const cardShell =
  "rounded-2xl border border-white/10 bg-gradient-to-br from-slate-950/80 via-slate-950/60 to-slate-900/70 shadow-[0_10px_35px_rgba(0,0,0,0.45)]";

const uid = () => Math.random().toString(36).slice(2, 9);

const WORKOUT_TYPE_OPTIONS = [
  { value: "FOR_TIME", label: "For Time" },
  { value: "AMRAP", label: "AMRAP" },
  { value: "EMOM", label: "EMOM" },
  { value: "INTERVALS", label: "Intervals" },
  { value: "STRENGTH", label: "Strength" },
  { value: "SKILL", label: "Skill/Technique" },
  { value: "METCON", label: "Metcon" },
  { value: "TEMPLATE", label: "Template" }
];

const BLOCK_TYPE_OPTIONS = [
  { value: "FOR_TIME", label: "For Time" },
  { value: "AMRAP", label: "AMRAP" },
  { value: "EMOM", label: "EMOM" },
  { value: "INTERVAL", label: "Interval" },
  { value: "STRENGTH", label: "Strength" },
  { value: "SKILL", label: "Skill" },
  { value: "WARMUP", label: "Warm-up" },
  { value: "COOLDOWN", label: "Cool down" }
];

// Mapea claves internas del análisis HYROX a los códigos/labels válidos que acepta el backend (enum HyroxStation)
const HYROX_STATION_MAP: Record<string, string> = {
  sled_push: "Sled Push",
  sled_pull: "Sled Pull",
  ski: "SkiErg",
  row: "Row",
  burpee_broad_jump: "Burpee Broad Jump",
  wall_balls: "Wall Balls",
  kb_lunges: "Sandbag Lunges",
  farmers_carry: "Farmers Carry"
};

const categorizeMovement = (movement: Movement) => {
  const name = (movement.name || "").toLowerCase();
  const category = (movement.category || "").toLowerCase();
  if (category.includes("gimn")) return "Gimnasticos";
  if (category.includes("strength") || category.includes("fuerza")) return "Fuerza";
  if (category.includes("cardio")) return "Monoestructurales";
  if (name.includes("run") || name.includes("row") || name.includes("bike")) return "Monoestructurales";
  if (name.includes("sled") || name.includes("wall ball") || category.includes("hyrox")) return "HYROX Stations";
  if (category.includes("metcon")) return "Metcon";
  return "Auxiliares";
};

const getPrimaryMuscle = (movement: Movement) =>
  movement.muscles?.find((m) => m.is_primary)?.muscle_group ?? movement.muscles?.[0]?.muscle_group ?? "General";

const getEquipment = (movement: Movement) => {
  if (movement.default_load_unit) return `Carga (${movement.default_load_unit})`;
  if ((movement.category || "").toLowerCase().includes("bodyweight")) return "Bodyweight";
  return "General";
};

const getTags = (movement: Movement) => {
  const baseTags = new Set<string>();
  if (movement.category) baseTags.add(movement.category);
  const primaryMuscle = getPrimaryMuscle(movement);
  if (primaryMuscle) baseTags.add(primaryMuscle);
  return Array.from(baseTags);
};

const clampValue = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const levelFactorSimple = (factors: Record<string, number> | undefined, level: number) => {
  if (!factors) return 1;
  const ordered = Object.entries(factors)
    .map(([k, v]) => [Number(k), v] as const)
    .sort((a, b) => b[0] - a[0]);
  for (const [lvl, factor] of ordered) {
    if (level >= lvl) return factor;
  }
  return ordered.at(-1)?.[1] ?? 1;
};

const expectedTimeForMovement = (mv: WodMovement, athleteLevel: number) => {
  const rule = findMovementRule(mv.movement.name)?.rule;
  if (!rule?.pro_time_seconds) return undefined;
  const factor = levelFactorSimple(rule.level_time_factors, athleteLevel);
  return rule.pro_time_seconds * factor;
};

const movementToImpact = (mv: WodMovement, quantityOverride?: number): ImpactBlockInput["movements"][number] => {
  const rule = findMovementRule(mv.movement.name)?.rule;
  const baseUnit = rule?.base_unit ?? "reps";
  const allowsCalories = isCalorieMovement(mv.movement);
  const impactMv: ImpactBlockInput["movements"][number] = {
    name: mv.movement.name ?? "Movimiento",
    reps: mv.reps,
    distance_meters: mv.distance_meters,
    duration_seconds: mv.duration_seconds,
    calories: allowsCalories ? mv.calories : undefined,
    load: mv.load,
    target_time_seconds: mv.target_time_seconds,
    execution_multiplier:
      mv.execution_mode === "SYNC" ? 1.1 : mv.execution_mode === "SHARED" ? 0.75 : 1
  };

  if (quantityOverride !== undefined) {
    if (baseUnit === "meters") impactMv.distance_meters = quantityOverride;
    else if (baseUnit === "calories") impactMv.calories = allowsCalories ? quantityOverride : undefined;
    else if (baseUnit === "seconds") impactMv.duration_seconds = quantityOverride;
    else impactMv.reps = quantityOverride;
  }

  return impactMv;
};

"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Section } from "@thrifty/ui";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useDraggable,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { calculateHyroxTransfer, HyroxTransferResult } from "../../lib/hyrox";
import { expectedMetricKeys, recordMetrics } from "../../lib/metrics-debug";
import { adaptAthleteProfile, adaptAthleteImpact } from "../../lib/metrics/adapters";
import { api } from "../../lib/api";
import type { AthleteProfileResponse, Movement, Workout, WorkoutCreatePayload } from "../../lib/types";
import { computeXpEstimate } from "../../lib/xp";
import { AthleteImpact } from "../wod-analysis/AthleteImpact";
import {
  calculateWodImpact,
  ImpactBlockResult,
  ImpactBlockInput,
  findMovementRule,
  supportsTimeForMovement
} from "../../lib/analysis/impactEngine";
import { getUIConfigForMovement } from "../../lib/movementUi";
import { HelpTooltip } from "../ui/HelpTooltip";

type WodMovement = {
  uid: string;
  source_key?: string;
  movement: Movement;
  reps?: number;
  load?: number;
  load_unit?: string | null;
  distance_meters?: number;
  calories?: number;
  duration_seconds?: number;
  target_time_seconds?: number;
  execution_mode?: "INDIVIDUAL" | "SYNC" | "SHARED";
  comment?: string;
  pace?: string;
};

const CALORIE_CODES = new Set(["row", "skierg", "bike_erg", "assault_bike", "echo_bike"]);
const isCalorieMovement = (movement?: Movement) => {
  if (!movement) return false;
  const code = (movement.code || "").toLowerCase();
  if (CALORIE_CODES.has(code)) return true;
  if (movement.supports_calories !== true) return false;
  const name = (movement.name || "").toLowerCase();
  return ["row", "ski", "bike"].some((k) => name.includes(k));
};

type WodBlock = {
  id: string;
  block_type?: "STANDARD" | "INTERVALS" | "ROUNDS";
  title: string;
  type?: string;
  notes?: string;
  scenario_work_seconds?: number;
  scenario_rest_seconds?: number;
  rounds?: number;
  pattern?: string[];
  synchro?: boolean;
  team_mode?: "individual" | "pairs";
  default_team_mode?: "individual" | "pairs";
  scenarios?: Array<{
    label: string;
    tasks: Array<{ movement_uid?: string; movement_key?: string; role: "CAP" | "REMAINING" | "STANDARD" }>;
  }>;
  movements: WodMovement[];
};

type DraftParsedWod = {
  title?: string;
  notes?: string;
  blocks?: Array<{
    block_type?: string;
    title?: string;
    rounds?: number;
    work_seconds?: number;
    rest_seconds?: number;
    pattern?: string[] | null;
    scenarios?: Array<{
      code?: string;
      movements?: Array<{
        name_raw?: string;
        movement_id?: number;
        reps?: number;
        load?: number;
        load_unit?: string;
        distance_meters?: number;
        duration_seconds?: number;
        calories?: number;
      }>;
    }>;
  }>;
};

type DragItem =
  | { type: "template"; movementId: number }
  | { type: "movement"; blockId: string; uid: string };

type DropZone =
  | { type: "block"; blockId: string }
  | { type: "movement"; blockId: string; uid: string };

type AnalysisResult = {
  fatigue: number;
  xpEstimate?: number;
  domain: string;
  intensity: string;
  hyroxTransfer: number;
  hyroxDetail: HyroxTransferResult;
  totalTime: number;
  difficulty: number;
  pacing: string;
  capacities: { key: string; value: number; raw?: number }[];
  muscles: { key: string; value: number }[];
  impact: Record<string, number>;
  breakdown: ImpactBlockResult[];
  warnings: string[];
  muscleCounts: Record<string, number>;
  patternPreview?: string[];
};

const pill =
  "inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-200";

const sectionShell =
  "rounded-3xl border border-white/5 bg-gradient-to-br from-slate-950/85 via-slate-950/60 to-slate-900/70 shadow-[0_12px_50px_rgba(0,0,0,0.45)] backdrop-blur px-5 md:px-7 py-5 md:py-7";

const cardShell =
  "rounded-2xl border border-white/10 bg-gradient-to-br from-slate-950/80 via-slate-950/60 to-slate-900/70 shadow-[0_10px_35px_rgba(0,0,0,0.45)]";

const uid = () => Math.random().toString(36).slice(2, 9);

const WORKOUT_TYPE_OPTIONS = [
  { value: "FOR_TIME", label: "For Time" },
  { value: "AMRAP", label: "AMRAP" },
  { value: "EMOM", label: "EMOM" },
  { value: "INTERVALS", label: "Intervals" },
  { value: "STRENGTH", label: "Strength" },
  { value: "SKILL", label: "Skill/Technique" },
  { value: "METCON", label: "Metcon" },
  { value: "TEMPLATE", label: "Template" }
];

const BLOCK_TYPE_OPTIONS = [
  { value: "FOR_TIME", label: "For Time" },
  { value: "AMRAP", label: "AMRAP" },
  { value: "EMOM", label: "EMOM" },
  { value: "INTERVAL", label: "Interval" },
  { value: "STRENGTH", label: "Strength" },
  { value: "SKILL", label: "Skill" },
  { value: "WARMUP", label: "Warm-up" },
  { value: "COOLDOWN", label: "Cool down" }
];

// Mapea claves internas del análisis HYROX a los códigos/labels válidos que acepta el backend (enum HyroxStation)
const HYROX_STATION_MAP: Record<string, string> = {
  sled_push: "Sled Push",
  sled_pull: "Sled Pull",
  ski: "SkiErg",
  row: "Row",
  burpee_broad_jump: "Burpee Broad Jump",
  wall_balls: "Wall Balls",
  kb_lunges: "Sandbag Lunges",
  farmers_carry: "Farmers Carry"
};

const categorizeMovement = (movement: Movement) => {
  const name = (movement.name || "").toLowerCase();
  const category = (movement.category || "").toLowerCase();
  if (category.includes("gimn")) return "Gimnasticos";
  if (category.includes("strength") || category.includes("fuerza")) return "Fuerza";
  if (category.includes("cardio")) return "Monoestructurales";
  if (name.includes("run") || name.includes("row") || name.includes("bike")) return "Monoestructurales";
  if (name.includes("sled") || name.includes("wall ball") || category.includes("hyrox")) return "HYROX Stations";
  if (category.includes("metcon")) return "Metcon";
  return "Auxiliares";
};

const getPrimaryMuscle = (movement: Movement) =>
  movement.muscles?.find((m) => m.is_primary)?.muscle_group ?? movement.muscles?.[0]?.muscle_group ?? "General";

const getEquipment = (movement: Movement) => {
  if (movement.default_load_unit) return `Carga (${movement.default_load_unit})`;
  if ((movement.category || "").toLowerCase().includes("bodyweight")) return "Bodyweight";
  return "General";
};

const getTags = (movement: Movement) => {
  const baseTags = new Set<string>();
  if (movement.category) baseTags.add(movement.category);
  const primaryMuscle = getPrimaryMuscle(movement);
  if (primaryMuscle) baseTags.add(primaryMuscle);
  return Array.from(baseTags);
};

const clampValue = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const levelFactorSimple = (factors: Record<string, number> | undefined, level: number) => {
  if (!factors) return 1;
  const ordered = Object.entries(factors)
    .map(([k, v]) => [Number(k), v] as const)
    .sort((a, b) => b[0] - a[0]);
  for (const [lvl, factor] of ordered) {
    if (level >= lvl) return factor;
  }
  return ordered.at(-1)?.[1] ?? 1;
};

const expectedTimeForMovement = (mv: WodMovement, athleteLevel: number) => {
  const rule = findMovementRule(mv.movement.name)?.rule;
  if (!rule?.pro_time_seconds) return undefined;
  const factor = levelFactorSimple(rule.level_time_factors, athleteLevel);
  return rule.pro_time_seconds * factor;
};

const movementToImpact = (mv: WodMovement, quantityOverride?: number): ImpactBlockInput["movements"][number] => {
  const rule = findMovementRule(mv.movement.name)?.rule;
  const baseUnit = rule?.base_unit ?? "reps";
  const allowsCalories = isCalorieMovement(mv.movement);
  const impactMv: ImpactBlockInput["movements"][number] = {
    name: mv.movement.name ?? "Movimiento",
    reps: mv.reps,
    distance_meters: mv.distance_meters,
    duration_seconds: mv.duration_seconds,
    calories: allowsCalories ? mv.calories : undefined,
    load: mv.load,
    target_time_seconds: mv.target_time_seconds,
    execution_multiplier:
      mv.execution_mode === "SYNC" ? 1.1 : mv.execution_mode === "SHARED" ? 0.75 : 1
  };

  if (quantityOverride !== undefined) {
    if (baseUnit === "meters") impactMv.distance_meters = quantityOverride;
    else if (baseUnit === "calories") impactMv.calories = allowsCalories ? quantityOverride : undefined;
    else if (baseUnit === "seconds") impactMv.duration_seconds = quantityOverride;
    else impactMv.reps = quantityOverride;
  }

  return impactMv;
};


const buildAthleteProfileMetrics = (profile?: AthleteProfileResponse | null) => {
  if (!profile) return {};
  const map: Record<string, number> = {};
  (profile.capacities ?? []).forEach((c) => {
    if (c.capacity) map[c.capacity.toLowerCase()] = c.value;
  });
  const bio = profile.biometrics;
  if (bio) {
    if (bio.fatigue_score !== undefined && bio.fatigue_score !== null) map.fatigue_score = Number(bio.fatigue_score);
    if (bio.hr_rest) map.hr_rest = Number(bio.hr_rest);
    if (bio.vo2_est) map.vo2_est = Number(bio.vo2_est);
  }
  const load = profile.training_load?.[0];
  if (load) {
    if (load.acute_load) map.acute_load = Number(load.acute_load);
    if (load.load_ratio) map.load_ratio = Number(load.load_ratio);
  }
  return map;
};

const normalizeCapacity = (raw: string) => {
  const base = raw.toLowerCase();
  if (base.includes("resis")) return "Resistencia";
  if (base.includes("fuerza")) return "Fuerza";
  if (base.includes("gim")) return "Gimnasticos";
  if (base.includes("metcon")) return "Metcon";
  if (base.includes("velocidad")) return "Velocidad";
  return "Metcon";
};

const normalizeMuscle = (raw: string) => {
  const base = raw.toLowerCase();
  if (base.includes("pierna")) return "Piernas";
  if (base.includes("core")) return "Core";
  if (base.includes("hombro")) return "Hombros";
  if (base.includes("posterior")) return "Posterior";
  if (base.includes("grip") || base.includes("agarre")) return "Grip";
  if (base.includes("pecho")) return "Pecho";
  if (base.includes("brazo") || base.includes("bicep") || base.includes("tricep")) return "Brazos";
  return "Core";
};

const normalizeDomain = (raw: string) => {
  const base = raw.toLowerCase();
  if (base.includes("aer")) return "Aerobico";
  if (base.includes("anaer")) return "Anaerobico";
  return "Mixto";
};

const normalizeIntensity = (raw: string) => {
  const base = raw.toLowerCase();
  if (base.includes("alta")) return "Alta";
  if (base.includes("media")) return "Media";
  return "Baja";
};

const toNumber = (value: number | undefined) =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

const inferRepeatsForStandard = (block: WodBlock) => {
  let repeats = 1;
  const text = `${block.title || ""} ${block.notes || ""}`.toLowerCase();
  const numMatch = text.match(/(\d+)\b/);
  const num = numMatch ? Number(numMatch[1]) : null;

  if ((block.type === "EMOM" || text.includes("emom")) && num && num > 0) {
    repeats = num;
  } else if ((block.type === "AMRAP" || text.includes("amrap")) && num && num > 0) {
    repeats = Math.max(1, Math.round(num / 2));
  }

  return Math.max(1, repeats);
};

const hydrateWorkoutToBuilder = (
  workout: Workout,
  catalog: Movement[]
): { blocks: WodBlock[]; title: string; notes: string } => {
  const movementSettings = (workout.extra_attributes_json as any)?.movement_settings ?? {};
  const intervalBlocks = (workout.extra_attributes_json as any)?.interval_blocks ?? {};
  const title = workout.title ?? "WOD";
  const notes = workout.description ?? "";

  const blocks: WodBlock[] =
    workout.blocks?.map((block, blockIndex) => {
      const intervalMeta = intervalBlocks[`blockId:${block.id}`] ?? null;
      const engineRaw = (intervalMeta?.engine as string | undefined) ?? undefined;

      const blockType: WodBlock["block_type"] =
        engineRaw === "ROUNDS"
          ? "ROUNDS"
          : engineRaw?.startsWith("INTERVAL")
            ? "INTERVALS"
            : intervalMeta
              ? "INTERVALS"
              : block.rounds && block.rounds > 1
                ? "ROUNDS"
                : "STANDARD";

      const wbmMap = new Map<string, string>();

      const movementsHydrated: WodMovement[] = (block.movements ?? []).map((bm, mvIndex) => {
        const movement =
          bm.movement ??
          catalog.find((m) => m.id === bm.movement_id) ?? {
            id: bm.movement_id,
            name: `Movimiento ${bm.movement_id}`,
            muscles: [],
            category: ""
          };

        const sourceKey = bm.id ? `wbm:${bm.id}` : undefined;
        const settings = sourceKey ? movementSettings[sourceKey] ?? {} : {};
        const uidLocal = `bm-${bm.id ?? `${blockIndex}-${mvIndex}`}`;

        const hydrated: WodMovement = {
          uid: uidLocal,
          source_key: sourceKey,
          movement,
          reps: bm.reps ?? undefined,
          load: bm.load ?? undefined,
          load_unit: bm.load_unit ?? undefined,
          distance_meters: bm.distance_meters ?? undefined,
          duration_seconds: bm.duration_seconds ?? undefined,
          calories: bm.calories ?? undefined,
          target_time_seconds: settings?.target_time_seconds ?? undefined,
          execution_mode: settings?.execution_mode ?? "INDIVIDUAL",
          comment: (bm as any).description ?? (bm as any).comment ?? undefined
        };

        if (sourceKey) wbmMap.set(sourceKey, uidLocal);
        return sanitizeMovementMetrics(hydrated);
      });

      // warmup legacy placeholder
      if (!movementsHydrated.length) {
        const warmupText = block.notes || block.description || block.title;
        if (warmupText && warmupText.trim().length > 0) {
          movementsHydrated.push({
            uid: `warmup-${blockIndex}`,
            movement: {
              id: -1000 - blockIndex,
              name: warmupText.substring(0, 60),
              category: "Warm-up",
              default_load_unit: null,
              muscles: [],
              video_url: null,
              description: warmupText
            } as any,
            reps: 1,
            comment: warmupText
          });
        }
      }

      let scenarios: WodBlock["scenarios"] | undefined = undefined;
      let pattern: string[] | undefined = undefined;
      let scenario_work_seconds: number | undefined = undefined;
      let scenario_rest_seconds: number | undefined = undefined;
      let rounds: number | undefined = block.rounds ?? undefined;

      if (intervalMeta) {
        scenario_work_seconds =
          blockType === "INTERVALS" ? intervalMeta.scenario_work_seconds ?? intervalMeta.work_seconds ?? 240 : undefined;
        scenario_rest_seconds =
          blockType === "INTERVALS" ? intervalMeta.scenario_rest_seconds ?? intervalMeta.rest_seconds ?? 60 : undefined;

        rounds = intervalMeta.rounds ?? block.rounds ?? 1;
        pattern = intervalMeta.pattern ?? pattern ?? (intervalMeta.scenarios?.map((s: any) => s.label) ?? ["A"]);

        scenarios =
          intervalMeta.scenarios?.map((sc: any) => ({
            label: sc.label,
            tasks:
              sc.tasks?.map((t: any) => ({
                role: (t.role as any) ?? "CAP",
                movement_uid: t.movement_key ? wbmMap.get(t.movement_key) : undefined,
                movement_key: t.movement_key
              })) ?? []
          })) ?? [];
      }

      // Legacy rounds
      if (!intervalMeta && blockType === "ROUNDS") {
        rounds = block.rounds ?? 1;
        pattern = ["A"];
        scenarios = [
          {
            label: "A",
            tasks: block.movements.map((mv, idx) => ({
              movement_uid: (mv as any).uid ?? `bm-${mv.id ?? idx}`,
              role: "STANDARD"
            }))
          }
        ];
      }

      // Safety net
      const resolveUidFromKey = (key?: string) => {
        if (!key) return undefined;
        const byMap = wbmMap.get(key);
        if (byMap) return byMap;

        const bySourceMv = block.movements.find((mv) => (mv as any).source_key === key);
        if (bySourceMv) return (bySourceMv as any).uid ?? `bm-${bySourceMv.id ?? key}`;

        const numeric = Number(key.replace(/[^0-9]/g, ""));
        const byIdMv = block.movements.find((mv) => mv.movement?.id === numeric);
        if (byIdMv) return (byIdMv as any).uid ?? `bm-${byIdMv.id ?? key}`;

        return undefined;
      };

      if (scenarios && scenarios.length) {
        scenarios = scenarios.map((sc) => ({
          ...sc,
          tasks: (sc.tasks ?? []).map((t) => ({
            ...t,
            role: (t.role as any) ?? "STANDARD",
            movement_uid: t.movement_uid ?? resolveUidFromKey((t as any).movement_key)
          }))
        }));
      }

      if (
        (!scenarios ||
          !scenarios.length ||
          !scenarios.some((s) => (s.tasks ?? []).some((t) => t.movement_uid))) &&
        block.movements.length
      ) {
        scenarios = [
          {
            label: "A",
            tasks: block.movements.map((mv, idx) => ({
              movement_uid: (mv as any).uid ?? `bm-${mv.id ?? idx}`,
              role: "STANDARD"
            }))
          }
        ];
        pattern = ["A"];
      }

      if (scenarios && scenarios.length) {
        scenarios = scenarios.map((sc) => {
          const tasks = (sc.tasks ?? []).map((t, idx) => {
            if (!t.movement_uid && block.movements[idx]) {
              const mv = block.movements[idx] as any;
              return { ...t, movement_uid: mv.uid ?? `bm-${mv.id ?? idx}` };
            }
            return t;
          });
          return { ...sc, tasks };
        });
      }

      return {
        id: block.id?.toString() ?? `block-${blockIndex}`,
        title: block.title ?? `Bloque ${blockIndex + 1}`,
        type: block.description ?? undefined,
        notes: block.notes ?? undefined,
        block_type: blockType,
        scenario_work_seconds,
        scenario_rest_seconds,
        rounds,
        pattern,
        scenarios,
        movements: movementsHydrated
      };
    }) ?? [];

  return { blocks, title, notes };
};

const validateBuilder = (title: string, blocks: WodBlock[]): string[] => {
  const errors: string[] = [];
  if (!title || title.trim().length < 3) errors.push("Título: mínimo 3 caracteres.");
  if (!blocks.length) errors.push("Al menos un bloque es obligatorio.");

  blocks.forEach((block, blockIndex) => {
    const label = block.title || `Bloque ${blockIndex + 1}`;
    const blockType = ["STANDARD", "INTERVALS", "ROUNDS"].includes(block.block_type || "")
      ? (block.block_type as any)
      : "STANDARD";

    if (!["STANDARD", "INTERVALS", "ROUNDS"].includes(block.block_type || "")) {
      errors.push(`${label}: tipo de bloque inválido.`);
    }

    if (blockType === "STANDARD") {
      if (!block.movements.length) errors.push(`${label}: requiere al menos un movimiento.`);
    }

    if (blockType === "ROUNDS") {
      if (!block.rounds || block.rounds < 1) errors.push(`${label}: rounds debe ser >= 1.`);
      const tasksCount =
        block.scenarios?.reduce((sum, sc) => sum + (sc.tasks?.filter((t) => t.movement_uid).length ?? 0), 0) ?? 0;
      if (tasksCount === 0 && !block.movements.length) errors.push(`${label}: requiere al menos un movimiento/tarea.`);
    }

    block.movements.forEach((mv) => {
      if (!mv.movement?.id) errors.push(`${label}: movimiento sin ID.`);
      const category = (mv.movement.category || "").toLowerCase();

      const hasReps = mv.reps != null && mv.reps > 0;
      const hasLoad = mv.load != null && mv.load > 0;
      const hasDistance = mv.distance_meters != null && mv.distance_meters > 0;
      const hasCals = isCalorieMovement(mv.movement) && mv.calories != null && mv.calories > 0;
      const hasDuration = mv.duration_seconds != null && mv.duration_seconds > 0;

      if (category.includes("cardio")) {
        if (!hasDistance && !hasCals && !hasDuration)
          errors.push(`${mv.movement.name}: cardio requiere distancia, calorías o duración.`);
      } else if (category.includes("strength") || category.includes("fuerza")) {
        if (!hasReps) errors.push(`${mv.movement.name}: fuerza requiere reps.`);
        if (mv.load != null && (mv.load_unit ?? "").trim() === "")
          errors.push(`${mv.movement.name}: si hay carga, carga/unidad obligatoria.`);
      } else {
        if (!hasReps && !hasDistance && !hasDuration)
          errors.push(`${mv.movement.name}: requiere cantidad (reps/distancia/tiempo).`);
        if (hasLoad && (mv.load_unit ?? "").trim() === "")
          errors.push(`${mv.movement.name}: si hay carga, unidad obligatoria.`);
      }
    });
  });

  return errors;
};


export function DraggableMovementItem({ movement }: { movement: Movement }) {
  const category = categorizeMovement(movement);
  const primaryMuscle = getPrimaryMuscle(movement);
  const equipment = getEquipment(movement);
  const tags = getTags(movement);
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `template-${movement.id}`,
    data: { type: "template", movementId: movement.id }
  });
  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.6 : 1
  };

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className="group cursor-grab rounded-xl border border-white/10 bg-white/5 p-3 text-white shadow-[0_10px_30px_rgba(0,0,0,0.35)] transition hover:-translate-y-0.5 hover:border-cyan-400/40"
      style={style}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-semibold leading-tight">{movement.name}</p>
          <p className="text-[11px] text-slate-400">Tipo: {movement.category || "Sin categoria"}</p>
        </div>
        <span className="rounded-full bg-slate-800 px-2 py-1 text-[11px] uppercase tracking-wide text-slate-200">{category}</span>
      </div>
      <div className="mt-2 grid gap-1 text-[11px] text-slate-300">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-slate-900/60 px-2 py-1">Grupo: {primaryMuscle}</span>
          <span className="rounded-full bg-slate-900/60 px-2 py-1">Equipamiento: {equipment}</span>
          <span className="rounded-full bg-slate-900/60 px-2 py-1">Codigo #{movement.id}</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => (
            <span key={`${movement.id}-${tag}`} className="rounded-full bg-slate-900/60 px-2 py-1">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function MovementPalette({ movements }: { movements: Movement[] }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return movements;
    return movements.filter((mv) => {
      const haystack = [mv.name, mv.category, getPrimaryMuscle(mv), mv.default_load_unit, ...getTags(mv)]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [movements, search]);

  const grouped = useMemo(() => {
    const map: Record<string, Movement[]> = {};
    filtered.forEach((mv) => {
      const cat = categorizeMovement(mv);
      if (!map[cat]) map[cat] = [];
      map[cat].push(mv);
    });
    return map;
  }, [filtered]);

  return (
    <div className={`${cardShell} p-4 space-y-3`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Movimientos disponibles</p>
          <p className="text-sm text-slate-300">Arrastra para construir el WOD</p>
        </div>
        <span className={pill}>{filtered.length} items</span>
      </div>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar por nombre, grupo o tipo..."
        className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white"
      />
      <div className="flex flex-wrap gap-2 text-[11px] text-slate-300">
        {Object.entries(grouped).map(([cat, items]) => (
          <span key={cat} className="rounded-full bg-slate-900/60 px-2 py-1">
            {cat} x {items.length}
          </span>
        ))}
      </div>
      <div className="space-y-3 max-h-[72vh] overflow-auto pr-1">
        {Object.entries(grouped).map(([cat, items]) => (
          <div key={cat} className="space-y-2">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">{cat}</p>
            <div className="grid gap-2">
              {items.map((mv) => (
                <DraggableMovementItem key={mv.id} movement={mv} />
              ))}
            </div>
          </div>
        ))}
        {!filtered.length && <p className="text-sm text-slate-400">No hay movimientos que coincidan.</p>}
      </div>
    </div>
  );
}

export function MovementEditor({
  movement,
  onChange,
  onRemove,
  dragHandleProps
}: {
  movement: WodMovement;
  onChange: (mv: WodMovement) => void;
  onRemove: () => void;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
}) {
  const showTargetTime = supportsTimeForMovement(movement.movement.name);
  const ui = getUIConfigForMovement(movement.movement);

  const formatSeconds = (seconds?: number) => {
    if (!seconds && seconds !== 0) return "";
    const s = Math.max(0, Math.round(seconds));
    const mPart = Math.floor(s / 60)
      .toString()
      .padStart(2, "0");
    const sPart = (s % 60).toString().padStart(2, "0");
    return `${mPart}:${sPart}`;
  };

  const parseTimeInput = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    if (/^\d+:\d{1,2}$/.test(trimmed)) {
      const [m, s] = trimmed.split(":").map((n) => Number(n));
      return m * 60 + s;
    }
    const num = Number(trimmed);
    return Number.isFinite(num) ? num : undefined;
  };

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            {...dragHandleProps}
            className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-slate-900/50 text-xs text-slate-300 hover:border-cyan-400/50"
            aria-label="Mover movimiento"
          >
            ::
          </button>
          <div>
            <p className="font-semibold leading-tight">{movement.movement.name}</p>
            <p className="text-[11px] text-slate-400">{movement.movement.category || "Sin categoria"}</p>
          </div>
        </div>
        <button type="button" onClick={onRemove} className="text-[11px] text-rose-200 hover:text-rose-100">
          Quitar
        </button>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {ui.showReps && (
          <label className="grid gap-1 text-[11px] text-slate-400">
            Reps
            <input
              type="number"
              value={movement.reps ?? ""}
              placeholder="30"
              onChange={(e) => onChange({ ...movement, reps: e.target.value === "" ? undefined : Number(e.target.value) })}
              className="w-full rounded-lg border border-white/10 bg-slate-900/60 px-2 py-2 text-xs text-white"
            />
          </label>
        )}
        {ui.showLoad && (
          <label className="grid gap-1 text-[11px] text-slate-400">
            Carga
            <div className="grid grid-cols-[1fr_auto] gap-2 rounded-lg border border-white/10 bg-slate-900/60 px-2 py-2 text-xs text-white">
              <input
                type="number"
                value={movement.load ?? ""}
                placeholder="45"
                onChange={(e) => onChange({ ...movement, load: e.target.value === "" ? undefined : Number(e.target.value) })}
                className="w-full bg-transparent outline-none"
              />
              {ui.showUnit && (
                <input
                  type="text"
                  value={movement.load_unit ?? ""}
                  placeholder="Kg"
                  onChange={(e) => onChange({ ...movement, load_unit: e.target.value })}
                  className="w-16 bg-transparent text-right outline-none"
                />
              )}
            </div>
          </label>
        )}
        {ui.showDistance && (
          <label className="grid gap-1 text-[11px] text-slate-400">
            Distancia (m)
            <input
              type="number"
              value={movement.distance_meters ?? ""}
              placeholder="400"
              onChange={(e) =>
                onChange({ ...movement, distance_meters: e.target.value === "" ? undefined : Number(e.target.value) })
              }
              className="w-full rounded-lg border border-white/10 bg-slate-900/60 px-2 py-2 text-xs text-white"
            />
          </label>
        )}
        {ui.showCalories && (
          <label className="grid gap-1 text-[11px] text-slate-400">
            Calorias
            <input
              type="number"
              value={movement.calories ?? ""}
              placeholder="20"
              onChange={(e) => onChange({ ...movement, calories: e.target.value === "" ? undefined : Number(e.target.value) })}
              className="w-full rounded-lg border border-white/10 bg-slate-900/60 px-2 py-2 text-xs text-white"
            />
          </label>
        )}
        {ui.showDuration && (
          <label className="grid gap-1 text-[11px] text-slate-400">
            Duracion estimada (s)
            <input
              type="number"
              value={movement.duration_seconds ?? ""}
              placeholder="90"
              onChange={(e) =>
                onChange({ ...movement, duration_seconds: e.target.value === "" ? undefined : Number(e.target.value) })
              }
              className="w-full rounded-lg border border-white/10 bg-slate-900/60 px-2 py-2 text-xs text-white"
            />
          </label>
        )}
        {showTargetTime && ui.showTargetTime && (
          <label className="grid gap-1 text-[11px] text-slate-400">
            Tiempo objetivo (s)
            <input
              type="text"
              value={formatSeconds(movement.target_time_seconds)}
              placeholder="01:30"
              onChange={(e) =>
                onChange({
                  ...movement,
                  target_time_seconds: parseTimeInput(e.target.value)
                })
              }
              className="w-full rounded-lg border border-white/10 bg-slate-900/60 px-2 py-2 text-xs text-white"
            />
          </label>
        )}
        <label className="grid gap-1 text-[11px] text-slate-400 md:col-span-2">
          Ritmo objetivo / pacing
          <input
            type="text"
            value={movement.pace ?? ""}
            placeholder="RPE 7 / 1:1 trabajo-descanso"
            onChange={(e) => onChange({ ...movement, pace: e.target.value })}
            className="w-full rounded-lg border border-white/10 bg-slate-900/60 px-2 py-2 text-xs text-white"
          />
        </label>
        <label className="grid gap-1 text-[11px] text-slate-400 md:col-span-2">
          Comentarios / tecnica
          <input
            type="text"
            value={movement.comment ?? ""}
            placeholder="Controlar respiracion, mantener postura"
            onChange={(e) => onChange({ ...movement, comment: e.target.value })}
            className="w-full rounded-lg border border-white/10 bg-slate-900/60 px-2 py-2 text-xs text-white"
          />
        </label>
        <label className="grid gap-1 text-[11px] text-slate-400">
          Modo de ejecucion
          <select
            value={movement.execution_mode ?? "INDIVIDUAL"}
            onChange={(e) => onChange({ ...movement, execution_mode: e.target.value as WodMovement["execution_mode"] })}
            className="w-full rounded-lg border border-white/10 bg-slate-900/60 px-2 py-2 text-xs text-white"
          >
            <option value="INDIVIDUAL">Individual</option>
            <option value="SYNC">Síncro</option>
            <option value="SHARED">Compartido</option>
          </select>
        </label>
      </div>
    </div>
  );
}

function SortableMovementItem({
  movement,
  blockId,
  onChange,
  onRemove
}: {
  movement: WodMovement;
  blockId: string;
  onChange: (mv: WodMovement) => void;
  onRemove: () => void;
}) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: movement.uid,
    data: { type: "movement", blockId, uid: movement.uid }
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };
  const dragHandleProps = { ...attributes, ...listeners } as React.HTMLAttributes<HTMLButtonElement>;
  return (
    <div ref={setNodeRef} style={style}>
      <MovementEditor movement={movement} onChange={onChange} onRemove={onRemove} dragHandleProps={dragHandleProps} />
    </div>
  );
}

export function DroppableWodArea({ block, children }: { block: WodBlock; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `block-${block.id}`,
    data: { type: "block", blockId: block.id }
  });
  return (
    <div
      ref={setNodeRef}
      className={`rounded-xl border border-dashed px-3 py-2 text-xs ${
        isOver ? "border-cyan-400/60 bg-cyan-400/10 text-cyan-100" : "border-white/15 bg-slate-900/40 text-slate-400"
      }`}
    >
      {children}
    </div>
  );
}

export function BlockCard({
  block,
  onUpdateMovement,
  onRemoveMovement,
  onUpdateBlock,
  onRemoveBlock
}: {
  block: WodBlock;
  onUpdateMovement: (blockId: string, movement: WodMovement) => void;
  onRemoveMovement: (blockId: string, movementUid: string) => void;
  onUpdateBlock: (blockId: string, update: Partial<WodBlock>) => void;
  onRemoveBlock: (blockId: string) => void;
}) {
  const blockType = block.block_type ?? "STANDARD";
  const scenarios = block.scenarios ?? [{ label: "A", tasks: [] }];
  const pattern = block.pattern ?? scenarios.map((s) => s.label);

  const nextLabel = String.fromCharCode(65 + scenarios.length);
  const resolveMovementUid = (task: { movement_uid?: string; movement_key?: string }, idx: number) => {
    if (task.movement_uid) return task.movement_uid;
    const key = task.movement_key;
    if (key) {
      const bySourceMv = block.movements.find((mv) => (mv as any).source_key === key);
      if (bySourceMv) {
        const idFallback = (bySourceMv as any).id ?? bySourceMv.movement?.id ?? key;
        return (bySourceMv as any).uid ?? `bm-${idFallback}`;
      }
      const numeric = Number(key.replace(/[^0-9]/g, ""));
      const byIdMv = block.movements.find((mv) => mv.movement?.id === numeric);
      if (byIdMv) {
        const idFallback = (byIdMv as any).id ?? byIdMv.movement?.id ?? key;
        return (byIdMv as any).uid ?? `bm-${idFallback}`;
      }
    }
    return (block.movements[idx] as any)?.uid ?? "";
  };

  const handleScenarioChange = (idx: number, update: Partial<NonNullable<WodBlock["scenarios"]>[number]>) => {
    const updated = scenarios.map((s, i) => (i === idx ? { ...s, ...update } : s));
    onUpdateBlock(block.id, { scenarios: updated });
  };

  const handleAddScenario = () => {
    onUpdateBlock(block.id, { scenarios: [...scenarios, { label: nextLabel, tasks: [] }] });
  };

  const handleAddPatternEntry = (label?: string) => {
    const chosen = label || scenarios[0]?.label || "A";
    onUpdateBlock(block.id, { pattern: [...pattern, chosen] });
  };

  const handleRemovePatternEntry = (index: number) => {
    const next = [...pattern];
    next.splice(index, 1);
    onUpdateBlock(block.id, { pattern: next });
  };

  return (
    <div className={`${cardShell} p-4`}>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex w-full flex-col gap-2">
          <input
            value={block.title}
            onChange={(e) => onUpdateBlock(block.id, { title: e.target.value })}
            className="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white"
            placeholder="Nombre del bloque"
          />
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-300">
            <span className="rounded-full bg-slate-900/60 px-2 py-1">{block.movements.length} movimientos</span>
            {block.type && <span className="rounded-full bg-cyan-500/10 px-2 py-1 text-cyan-200">{block.type}</span>}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 md:w-72">
          <select
            value={blockType}
            onChange={(e) => {
              const value = e.target.value as WodBlock["block_type"];
              if (value === "INTERVALS") {
                onUpdateBlock(block.id, {
                  block_type: value,
                  scenario_work_seconds: block.scenario_work_seconds ?? 240,
                  scenario_rest_seconds: block.scenario_rest_seconds ?? 60,
                  rounds: block.rounds ?? 4,
                  scenarios: block.scenarios ?? [{ label: "A", tasks: [] }],
                  pattern: block.pattern ?? (block.scenarios?.map((s) => s.label) ?? ["A"])
                });
              } else if (value === "ROUNDS") {
                onUpdateBlock(block.id, {
                  block_type: value,
                  scenario_work_seconds: undefined,
                  scenario_rest_seconds: undefined,
                  rounds: block.rounds ?? 4,
                  scenarios: block.scenarios ?? [{ label: "A", tasks: [] }],
                  pattern: block.pattern ?? (block.scenarios?.map((s) => s.label) ?? ["A"])
                });
              } else {
                onUpdateBlock(block.id, { block_type: "STANDARD" });
              }
            }}
            className="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-xs text-white"
          >
            <option value="STANDARD">Bloque estándar</option>
            <option value="ROUNDS">Rounds (sin descanso)</option>
            <option value="INTERVALS">Intervals (work/rest)</option>
          </select>

          <select
            value={block.type ?? ""}
            onChange={(e) => onUpdateBlock(block.id, { type: e.target.value })}
            className="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-xs text-white"
          >
            <option value="">Tipo de bloque</option>
            {BLOCK_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <textarea
            value={block.notes ?? ""}
            onChange={(e) => onUpdateBlock(block.id, { notes: e.target.value })}
            placeholder="Notas del bloque, pacing o esquema"
            className="h-16 w-full resize-none rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-xs text-white"
          />

          <button
            type="button"
            onClick={() => onRemoveBlock(block.id)}
            className="text-[11px] text-rose-200 hover:text-rose-100"
          >
            Eliminar bloque
          </button>
        </div>
      </div>

      {(blockType === "INTERVALS" || blockType === "ROUNDS") && (
        <div className="mt-3 grid gap-3 rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-3 text-xs text-white md:grid-cols-2">
          {blockType === "INTERVALS" && (
            <>
              <label className="grid gap-1">
                Trabajo por escenario (s)
                <input
                  type="number"
                  value={block.scenario_work_seconds ?? 240}
                  onChange={(e) => onUpdateBlock(block.id, { scenario_work_seconds: Number(e.target.value) || 0 })}
                  className="rounded-lg border border-white/10 bg-slate-900/60 px-2 py-2 text-xs text-white"
                />
              </label>
              <label className="grid gap-1">
                Descanso entre escenarios (s)
                <input
                  type="number"
                  value={block.scenario_rest_seconds ?? 60}
                  onChange={(e) => onUpdateBlock(block.id, { scenario_rest_seconds: Number(e.target.value) || 0 })}
                  className="rounded-lg border border-white/10 bg-slate-900/60 px-2 py-2 text-xs text-white"
                />
              </label>
            </>
          )}

          <label className="grid gap-1">
            Rounds
            <input
              type="number"
              value={block.rounds ?? 4}
              onChange={(e) => onUpdateBlock(block.id, { rounds: Number(e.target.value) || 1 })}
              className="rounded-lg border border-white/10 bg-slate-900/60 px-2 py-2 text-xs text-white"
            />
          </label>

          {blockType === "INTERVALS" && (
            <div className="grid gap-1">
              <span>Team / Sync</span>
              <div className="flex gap-2">
                <select
                  value={block.team_mode ?? "individual"}
                  onChange={(e) => onUpdateBlock(block.id, { team_mode: e.target.value as "individual" | "pairs" })}
                  className="w-full rounded-lg border border-white/10 bg-slate-900/60 px-2 py-2 text-xs text-white"
                >
                  <option value="individual">Individual</option>
                  <option value="pairs">Parejas</option>
                </select>
                <label className="flex items-center gap-1 text-[11px]">
                  <input
                    type="checkbox"
                    checked={block.synchro ?? false}
                    onChange={(e) => onUpdateBlock(block.id, { synchro: e.target.checked })}
                  />
                  Synchro
                </label>
              </div>
            </div>
          )}

          <div className="md:col-span-2 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className={pill}>Patron</span>
              {(Array.isArray(pattern) ? pattern : typeof pattern === "string" ? [pattern] : []).map((p, idx) => (
                <span key={`${p}-${idx}`} className="flex items-center gap-1 rounded-full bg-slate-900/60 px-2 py-1">
                  {p}
                  <button
                    type="button"
                    onClick={() => handleRemovePatternEntry(idx)}
                    className="text-rose-200 hover:text-rose-100"
                  >
                    ×
                  </button>
                </span>
              ))}
              <select
                onChange={(e) => handleAddPatternEntry(e.target.value)}
                className="rounded-lg border border-white/10 bg-slate-900/60 px-2 py-1 text-xs text-white"
                defaultValue=""
              >
                <option value="" disabled>
                  Añadir escenario
                </option>
                {scenarios.map((s) => (
                  <option key={s.label} value={s.label}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              {scenarios.map((scenario, idx) => (
                <div key={scenario.label} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-white">Escenario {scenario.label}</span>
                    {idx === scenarios.length - 1 && (
                      <button type="button" onClick={handleAddScenario} className="text-[11px] text-cyan-200">
                        + Añadir escenario ({nextLabel})
                      </button>
                    )}
                  </div>
                  <div className="mt-2 space-y-2">
                    {(scenario.tasks ?? []).map((task, tIdx) => (
                      <div key={`${scenario.label}-${tIdx}`} className="grid gap-2 md:grid-cols-[1fr_auto_auto] items-center">
                        <select
                          value={resolveMovementUid(task, tIdx)}
                          onChange={(e) => {
                            const tasks = [...(scenario.tasks ?? [])];
                            tasks[tIdx] = { ...tasks[tIdx], movement_uid: e.target.value || undefined };
                            handleScenarioChange(idx, { tasks });
                          }}
                          className="rounded-lg border border-white/10 bg-slate-900/60 px-2 py-2 text-xs text-white"
                        >
                          <option value="">Selecciona movimiento</option>
                          {block.movements.map((mv) => (
                            <option key={mv.uid} value={mv.uid}>
                              {mv.movement.name}
                            </option>
                          ))}
                        </select>

                        <select
                          value={task.role}
                          onChange={(e) => {
                            const tasks = [...(scenario.tasks ?? [])];
                            tasks[tIdx] = { ...tasks[tIdx], role: e.target.value as "CAP" | "REMAINING" | "STANDARD" };
                            handleScenarioChange(idx, { tasks });
                          }}
                          className="rounded-lg border border-white/10 bg-slate-900/60 px-2 py-2 text-xs text-white"
                        >
                          <option value="CAP">CAP</option>
                          <option value="REMAINING">REMAINING</option>
                          <option value="STANDARD">STANDARD</option>
                        </select>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            className="rounded border border-white/10 px-2 py-1 text-[11px]"
                            onClick={() => {
                              if (tIdx === 0) return;
                              const tasks = [...(scenario.tasks ?? [])];
                              const [item] = tasks.splice(tIdx, 1);
                              tasks.splice(tIdx - 1, 0, item);
                              handleScenarioChange(idx, { tasks });
                            }}
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            className="rounded border border-white/10 px-2 py-1 text-[11px]"
                            onClick={() => {
                              const tasks = [...(scenario.tasks ?? [])];
                              if (tIdx >= tasks.length - 1) return;
                              const [item] = tasks.splice(tIdx, 1);
                              tasks.splice(tIdx + 1, 0, item);
                              handleScenarioChange(idx, { tasks });
                            }}
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            className="rounded border border-white/10 px-2 py-1 text-[11px] text-rose-200"
                            onClick={() => {
                              const tasks = [...(scenario.tasks ?? [])];
                              tasks.splice(tIdx, 1);
                              handleScenarioChange(idx, { tasks });
                            }}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        handleScenarioChange(idx, {
                          tasks: [...(scenario.tasks ?? []), { role: blockType === "INTERVALS" ? "CAP" : "STANDARD" }]
                        })
                      }
                      className="text-[11px] text-cyan-200"
                    >
                      + Añadir ejercicio
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mt-3 space-y-2">
        <SortableContext items={block.movements.map((mv) => mv.uid)} strategy={verticalListSortingStrategy}>
          {block.movements.map((mv) => (
            <SortableMovementItem
              key={mv.uid}
              movement={mv}
              blockId={block.id}
              onChange={(updated) => onUpdateMovement(block.id, updated)}
              onRemove={() => onRemoveMovement(block.id, mv.uid)}
            />
          ))}
        </SortableContext>
        <DroppableWodArea block={block}>Arrastra aqui para agregar o reordenar en {block.title}</DroppableWodArea>
      </div>
    </div>
  );
}

export function WodBlocksEditor({
  blocks,
  onUpdateMovement,
  onRemoveMovement,
  onAddBlock,
  onUpdateBlock,
  onRemoveBlock
}: {
  blocks: WodBlock[];
  onUpdateMovement: (blockId: string, movement: WodMovement) => void;
  onRemoveMovement: (blockId: string, movementUid: string) => void;
  onAddBlock: () => void;
  onUpdateBlock: (blockId: string, update: Partial<WodBlock>) => void;
  onRemoveBlock: (blockId: string) => void;
}) {
  return (
    <div className="space-y-3">
      {blocks.map((block) => (
        <BlockCard
          key={block.id}
          block={block}
          onUpdateMovement={onUpdateMovement}
          onRemoveMovement={onRemoveMovement}
          onUpdateBlock={onUpdateBlock}
          onRemoveBlock={onRemoveBlock}
        />
      ))}
      <Button variant="primary" onClick={onAddBlock}>
        + Anadir bloque
      </Button>
    </div>
  );
}

// =====================
// OCR draft -> bloques
// =====================

function mapDraftToBlocks(
  draft: DraftParsedWod | any,
  movements: Movement[]
): { blocks: WodBlock[]; title?: string; unresolved: any[] } {
  console.debug("[wod-builder] mapDraftToBlocks raw draft", draft);
  if (!draft?.blocks?.length) return { blocks: [], title: draft.title, unresolved: draft?.unresolved ?? [] };

  const normalizeBlockType = (raw?: string) => {
    const bt = String(raw || "").toLowerCase();
    if (["intervals", "interval", "work_rest", "workrest"].includes(bt)) return "INTERVALS";
    if (["rounds", "round"].includes(bt)) return "ROUNDS";
    return "STANDARD";
  };

  const fuzzyIncludes = (a: string, b: string) => a.includes(b) || b.includes(a);

  const findMovement = (mvDraft: any): Movement | null => {
    const normName = (mvDraft?.name_raw || "").toLowerCase().trim();
    const rawName = (mvDraft?.raw || mvDraft?.unresolved_label || "").toLowerCase().trim();
    const candidates = [mvDraft?.movement_id, normName, rawName].filter(Boolean);
    for (const candidate of candidates) {
      if (typeof candidate === "number") {
        const byId = movements.find((m) => m.id === candidate);
        if (byId) return byId;
      } else if (typeof candidate === "string") {
        const exact = movements.find((m) => m.name.toLowerCase() === candidate);
        if (exact) return exact;
        const loose = movements.find((m) => fuzzyIncludes(m.name.toLowerCase(), candidate));
        if (loose) return loose;
      }
    }
    return null;
  };

  const isRemaining = (mvDraft: any) => {
    const raw = `${mvDraft?.raw || ""} ${mvDraft?.name_raw || ""} ${mvDraft?.unit || ""}`.toLowerCase();
    if (mvDraft?.is_max === true) return true;
    if (raw.includes("max") || raw.includes("máx")) return true;
    return false;
  };

  const hasQuantity = (mvDraft: any) =>
    mvDraft?.reps || mvDraft?.calories || mvDraft?.distance_meters || mvDraft?.duration_seconds || mvDraft?.metric?.value;

  const unresolved: any[] = [];

  const blocks: WodBlock[] = draft.blocks.map((b: any, idx: number) => {
    console.debug("[wod-builder] mapping block", b);
    const blockMovements: WodMovement[] = [];
    const scenarios = b.scenarios || [];
    const scenarioDefs =
      scenarios.map((scenario: any, sIdx: number) => {
        const tasks: Array<{ movement_uid: string; role: "CAP" | "REMAINING" | "STANDARD" }> = [];
        (scenario.items || scenario.movements || []).forEach((mv: any, mvIdx: number) => {
          const tpl = findMovement(mv);
          const uidVal = `${idx}-${sIdx}-${mvIdx}-${Date.now()}`;
          const role: "CAP" | "REMAINING" | "STANDARD" = isRemaining(mv)
            ? "REMAINING"
            : hasQuantity(mv)
              ? "CAP"
              : "STANDARD";

          if (tpl) {
            blockMovements.push({
              uid: uidVal,
              movement: tpl,
              reps: mv.reps,
              load: mv.load,
              load_unit: mv.load_unit,
              distance_meters: mv.distance_meters,
              calories: mv.calories,
              duration_seconds: mv.duration_seconds
            });
          } else {
            const placeholder: Movement = {
              id: -1000 - blockMovements.length,
              name: mv.raw || mv.name_raw || "Movimiento no resuelto",
              category: "Unresolved",
              default_load_unit: mv.load_unit ?? null,
              muscles: [],
              video_url: null,
              description: mv.raw || mv.name_raw || ""
            } as any;

            blockMovements.push({
              uid: uidVal,
              movement: placeholder,
              reps: mv.reps,
              load: mv.load,
              load_unit: mv.load_unit,
              distance_meters: mv.distance_meters,
              calories: mv.calories,
              duration_seconds: mv.duration_seconds
            });

            unresolved.push({
              scenario: scenario.label || scenario.code || `Escenario ${sIdx + 1}`,
              index: mvIdx,
              raw: mv.raw || mv.name_raw,
              reason: "no_match_catalog"
            });
          }

          tasks.push({
            movement_uid: uidVal,
            role
          });
        });

        console.debug("[wod-builder] scenario built", { label: scenario.label, tasks });
        return {
          label: scenario.label || scenario.code || `Escenario ${sIdx + 1}`,
          tasks
        };
      }) || [];

    const mappedType = normalizeBlockType(b.block_type);
    console.debug("[wod-builder] block result", {
      mappedType,
      scenarios: scenarioDefs,
      movements: blockMovements
    });

    return {
      id: `draft-${idx}-${Date.now()}`,
      title: (b as any).title || draft.title || `Bloque ${idx + 1}`,
      block_type: mappedType as WodBlock["block_type"],
      movements: blockMovements,
      rounds: b.rounds,
      scenario_work_seconds: b.work_seconds,
      scenario_rest_seconds: b.rest_seconds,
      pattern: (b as any).pattern || (b.scenarios ? b.scenarios.map((s: any) => s.code || s.label || "A") : undefined),
      scenarios: scenarioDefs
    };
  });

  const finalUnresolved = unresolved.length ? unresolved : draft.unresolved ?? [];
  console.debug("[wod-builder] mapDraftToBlocks final", { blocks, unresolved: finalUnresolved });
  return { blocks, title: draft.title, unresolved: finalUnresolved };
}


export function WodBuilder({ editWorkoutId, draftKey }: { editWorkoutId?: string; draftKey?: string }) {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [blocks, setBlocks] = useState<WodBlock[]>([
    {
      id: uid(),
      title: "Bloque 1",
      block_type: "STANDARD",
      movements: [],
      rounds: 4,
      scenario_work_seconds: 240,
      scenario_rest_seconds: 60,
      pattern: ["A"]
    }
  ]);
  const [athleteProfile, setAthleteProfile] = useState<AthleteProfileResponse | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [workoutTitle, setWorkoutTitle] = useState("WOD personalizado");
  const [workoutType, setWorkoutType] = useState<string>("FOR_TIME");
  const [workoutNotes, setWorkoutNotes] = useState("");
  const [activeDrag, setActiveDrag] = useState<DragItem | null>(null);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
  const router = useRouter();
  const [showConfirmSave, setShowConfirmSave] = useState(false);
  const [pendingKind, setPendingKind] = useState<"wod" | "template" | "ai" | null>(null);
  const [unresolvedDraft, setUnresolvedDraft] = useState<any[]>([]);
  const [draftLoaded, setDraftLoaded] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  useEffect(() => {
    api.getMovements().then(setMovements).catch(() => setMovements([]));
    api.getAthleteProfile().then(setAthleteProfile).catch(() => setAthleteProfile(null));
  }, []);

  useEffect(() => {
    if (!movements.length || draftLoaded) return;
    try {
      const raw = localStorage.getItem("wod_builder_draft");
      if (!raw) return;
      console.debug("[wod-builder] loading draft from localStorage");
      const parsed = JSON.parse(raw) as { parsed: DraftParsedWod | any };
      const mapped = mapDraftToBlocks(parsed.parsed, movements);
      if (mapped.blocks.length) {
        setBlocks(mapped.blocks);
        if (mapped.title) setWorkoutTitle(mapped.title);
        setStatus("Draft cargado desde OCR.");
      }
      setUnresolvedDraft(mapped.unresolved || []);
      setDraftLoaded(true);
      if (draftKey) {
        localStorage.removeItem("wod_builder_draft");
      }
    } catch (err) {
      console.warn("No se pudo cargar draft OCR", err);
    }
  }, [movements, draftLoaded, draftKey]);

  useEffect(() => {
    if (!editWorkoutId) return;
    setStatus("Cargando WOD...");
    api
      .getWorkoutStructure(editWorkoutId)
      .then((workoutPayload) => {
        setEditingWorkout(workoutPayload);
        const hydrated = hydrateWorkoutToBuilder(workoutPayload, movements);
        setBlocks((prev) => (hydrated.blocks.length ? hydrated.blocks : prev));
        setWorkoutTitle(hydrated.title);
        setWorkoutNotes(hydrated.notes);
        setStatus("WOD cargado en modo edición.");
      })
      .catch(() => setStatus("No se pudo cargar el WOD para edición."));
  }, [editWorkoutId, movements]);

  const analysis = useMemo(() => computeAnalysis(blocks, athleteProfile), [blocks, athleteProfile]);
  const athleteMetrics = useMemo(() => adaptAthleteProfile(buildAthleteProfileMetrics(athleteProfile)), [athleteProfile]);

  const findMovementTemplate = (id: number) => movements.find((m) => m.id === id);

  const addMovementFromTemplate = (movementId: number, blockId: string, targetIndex?: number) => {
    const template = findMovementTemplate(movementId);
    if (!template) return;
    const newMv: WodMovement = { uid: uid(), movement: template };
    setBlocks((prev) =>
      prev.map((block) => {
        if (block.id !== blockId) return block;
        const list = [...block.movements];
        const index = targetIndex !== undefined ? Math.max(0, Math.min(targetIndex, list.length)) : list.length;
        list.splice(index, 0, newMv);
        return { ...block, movements: list };
      })
    );
  };

  const moveExistingMovement = (uidToMove: string, fromBlockId: string, toBlockId: string, targetIndex?: number) => {
    setBlocks((prev) => {
      const source = prev.find((b) => b.id === fromBlockId);
      const destination = prev.find((b) => b.id === toBlockId);
      if (!source || !destination) return prev;

      const moving = source.movements.find((mv) => mv.uid === uidToMove);
      if (!moving) return prev;

      const destinationList = destination.movements.filter((mv) => !(fromBlockId === toBlockId && mv.uid === uidToMove));
      const insertAt =
        targetIndex !== undefined ? Math.max(0, Math.min(targetIndex, destinationList.length)) : destinationList.length;
      destinationList.splice(insertAt, 0, moving);

      return prev.map((block) => {
        if (block.id === fromBlockId && block.id !== toBlockId) {
          return { ...block, movements: block.movements.filter((mv) => mv.uid !== uidToMove) };
        }
        if (block.id === toBlockId) {
          return { ...block, movements: destinationList };
        }
        if (block.id === fromBlockId && block.id === toBlockId) {
          return { ...block, movements: destinationList };
        }
        return block;
      });
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    const dragData = event.active.data.current as DragItem | undefined;
    if (dragData) setActiveDrag(dragData);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const activeData = active.data.current as DragItem | undefined;
    const overData = over?.data.current as DropZone | undefined;
    setActiveDrag(null);
    if (!activeData || !overData) return;

    const targetBlockId = overData.blockId;
    const targetIndex =
      overData.type === "movement"
        ? blocks.find((b) => b.id === targetBlockId)?.movements.findIndex((mv) => mv.uid === (over?.id as string))
        : undefined;

    if (activeData.type === "template") {
      addMovementFromTemplate(activeData.movementId, targetBlockId, targetIndex);
      return;
    }
    moveExistingMovement(activeData.uid, activeData.blockId, targetBlockId, targetIndex);
  };

  const handleUpdateMovement = (blockId: string, movement: WodMovement) => {
    const sanitized = sanitizeMovementMetrics(movement);
    setBlocks((prev) =>
      prev.map((block) => {
        if (block.id !== blockId) return block;
        return { ...block, movements: block.movements.map((mv) => (mv.uid === movement.uid ? sanitized : mv)) };
      })
    );
  };

  const handleRemoveMovement = (blockId: string, movementUid: string) => {
    setBlocks((prev) =>
      prev.map((block) => {
        if (block.id !== blockId) return block;
        return { ...block, movements: block.movements.filter((mv) => mv.uid !== movementUid) };
      })
    );
  };

  const handleAddBlock = () =>
    setBlocks((prev) => [
      ...prev,
      {
        id: uid(),
        title: `Bloque ${prev.length + 1}`,
        block_type: "STANDARD",
        movements: [],
        rounds: 4,
        scenario_work_seconds: 240,
        scenario_rest_seconds: 60,
        pattern: ["A"]
      }
    ]);

  const handleUpdateBlock = (blockId: string, update: Partial<WodBlock>) =>
    setBlocks((prev) => prev.map((block) => (block.id === blockId ? { ...block, ...update } : block)));

  const handleRemoveBlock = (blockId: string) => setBlocks((prev) => prev.filter((block) => block.id !== blockId));

  const hyroxStationsFromBlocks = useMemo(() => {
    const hyroxDetail = analysis.hyroxDetail;
    return Object.entries(hyroxDetail.components)
      .filter(([, v]) => v > 0)
      .map(([key, value]) => {
        const station = HYROX_STATION_MAP[key];
        if (!station) return null;
        return { station, transfer_pct: Math.round(value) };
      })
      .filter((h): h is { station: string; transfer_pct: number } => Boolean(h));
  }, [analysis.hyroxDetail]);

  const buildPayload = (purpose: "wod" | "template" | "ai"): WorkoutCreatePayload => {
    const sanitizedBlocks = blocks.map((b) => ({
      ...b,
      movements: b.movements.map((mv) => sanitizeMovementMetrics(mv))
    }));

    const primaryCapacity = normalizeCapacity(analysis.capacities[0]?.key ?? "Metcon");
    const mainMuscle = normalizeMuscle(analysis.muscles[0]?.key ?? "Core");
    const domain = normalizeDomain(analysis.domain);
    const intensity = normalizeIntensity(analysis.intensity);

    const volumeTotal = blocks
      .map((b) =>
        b.movements
          .map((m) => m.reps ?? m.distance_meters ?? m.duration_seconds ?? 0)
          .reduce((sum, val) => sum + (Number.isFinite(val) ? Number(val) : 0), 0)
      )
      .reduce((a, b) => a + b, 0)
      .toString();

    const movementKeyMap = new Map<string, string>();
    sanitizedBlocks.forEach((block, bIndex) =>
      block.movements.forEach((mv, mIndex) => {
        movementKeyMap.set(mv.uid, mv.source_key ?? `tmp:${bIndex}:${mIndex}`);
      })
    );

    const movementSettings: Record<string, { execution_mode?: string; target_time_seconds?: number }> = {};
    sanitizedBlocks.forEach((block) =>
      block.movements.forEach((mv) => {
        const key = movementKeyMap.get(mv.uid) ?? mv.uid;
        if (mv.target_time_seconds || mv.execution_mode) {
          movementSettings[key] = {
            execution_mode: mv.execution_mode,
            target_time_seconds: mv.target_time_seconds
          };
        }
      })
    );

    const intervalsMeta: Record<
      string,
      {
        block_type?: "INTERVALS";
        engine?: "INTERVALS_WORK_REST" | "ROUNDS";
        rounds?: number;
        scenario_work_seconds?: number;
        scenario_rest_seconds?: number;
        pattern?: string[];
        default_team_mode?: string;
        scenarios?: Array<{ label: string; tasks: Array<{ movement_key?: string; role: "CAP" | "REMAINING" }> }>;
      }
    > = {};

    sanitizedBlocks.forEach((block) => {
      if ((block.block_type ?? "STANDARD") === "STANDARD") return;

      const scenarios =
        block.scenarios?.map((sc) => ({
          label: sc.label,
          tasks:
            sc.tasks?.map((t) => ({
              movement_key: t.movement_uid ? movementKeyMap.get(t.movement_uid) ?? t.movement_uid : undefined,
              role: t.role
            })) ?? []
        })) ?? [];

      const isIntervals = (block.block_type ?? "STANDARD") === "INTERVALS";
      const meta: any = {
        block_type: isIntervals ? "INTERVALS" : undefined,
        engine: isIntervals ? "INTERVALS_WORK_REST" : "ROUNDS",
        rounds: block.rounds,
        pattern: block.pattern,
        default_team_mode: block.default_team_mode,
        scenarios
      };
      if (isIntervals) {
        meta.scenario_work_seconds = block.scenario_work_seconds;
        meta.scenario_rest_seconds = block.scenario_rest_seconds;
      }
      intervalsMeta[`blockId:${block.id}`] = meta;
    });

    const musclesNormalized = Array.from(
      new Set(
        analysis.muscles
          .map((m) => normalizeMuscle(m.key))
          .filter(Boolean)
      )
    ).slice(0, 3);

    return {
      title: workoutTitle || "WOD personalizado",
      description: workoutNotes || "Generado desde el WOD Builder interactivo.",
      domain,
      intensity,
      hyrox_transfer: intensity,
      wod_type: workoutType || "FOR_TIME",
      volume_total: volumeTotal || "0",
      work_rest_ratio: "1:1",
      dominant_stimulus: primaryCapacity,
      load_type: hyroxStationsFromBlocks.length ? "Hybrid" : "Standard",
      estimated_difficulty: analysis.difficulty,
      main_muscle_chain: mainMuscle,
      extra_attributes_json: {
        builder_blocks: sanitizedBlocks,
        pacing: analysis.pacing,
        hyrox_transfer_score: analysis.hyroxDetail.transferScore,
        hyrox_components: analysis.hyroxDetail.components,
        movement_settings: Object.keys(movementSettings).length ? movementSettings : undefined,
        interval_blocks: Object.keys(intervalsMeta).length ? intervalsMeta : undefined,
        generated_from: "wod-builder",
        generated_at: new Date().toISOString()
      },
      athlete_profile_desc: "Auto generado segun tu perfil y el constructor visual.",
      target_athlete_desc: `Orientado a ${intensity} intensidad y dominio ${domain}`,
      session_load: `${analysis.fatigue}/10`,
      session_feel: analysis.intensity,
      official_tag: purpose === "template" ? "template" : undefined,
      pacing_tip: analysis.pacing,
      pacing_detail: analysis.pacing,
      break_tip: "Descansos controlados, evita llegar a fallo",
      rx_variant: "RX auto",
      scaled_variant: "Scaled auto",
      ai_observation: "Generado desde interfaz inteligente",
      avg_time_seconds: toNumber(analysis.totalTime),
      avg_rating: null,
      avg_difficulty: analysis.difficulty,
      rating_count: 0,
      level_times: [],
      capacities: analysis.capacities.map((c) => ({
        capacity: normalizeCapacity(c.key),
        value: Math.max(1, Math.round(c.raw ?? c.value)),
        note: "Auto"
      })),
      hyrox_stations: hyroxStationsFromBlocks,
      muscles: musclesNormalized,
      equipment_ids: [],
      similar_workout_ids: []
    };
  };

  const buildErrorMessage = (error: any) => {
    const statusCode = error?.status ?? "N/A";
    const detail = error?.message || "Error desconocido";
    const detailArray = Array.isArray(error?.details)
      ? error.details
      : Array.isArray(error?.details?.detail)
        ? error.details.detail
        : null;

    const errorsList =
      Array.isArray(error?.details?.errors) && error.details.errors.length
        ? error.details.errors.map((e: any) => `Campo ${e.field ?? "?"}: ${e.message ?? JSON.stringify(e)}`)
        : detailArray
          ? detailArray.map((e: any) => {
              const loc = Array.isArray(e?.loc) ? e.loc.join(".") : e?.loc ?? "";
              const msg = e?.msg ?? e?.message ?? JSON.stringify(e);
              return `${loc ? `${loc}: ` : ""}${msg}`;
            })
          : [];

    const detailText = errorsList.length ? errorsList.join(" | ") : detail;
    return `No se pudo guardar el WOD. Código: ${statusCode}. Detalle: ${detailText}`;
  };

  const proceedSave = async (kind: "wod" | "template" | "ai", mode: "create" | "version" | "overwrite" = "create") => {
    setStatus(
      kind === "ai"
        ? "Analizando con IA..."
        : mode === "overwrite"
          ? "Sobrescribiendo WOD..."
          : editWorkoutId
            ? "Actualizando WOD..."
            : "Guardando..."
    );

    try {
      const payload = buildPayload(kind);
      let saved: Workout | null = null;

      if (kind === "ai") {
        await api.analyzeWorkoutPayload(payload);
        setStatus("Analisis enviado al backend.");
        return;
      }

      if (mode === "version" && editingWorkout) {
        payload.parent_workout_id = editingWorkout.parent_workout_id ?? editingWorkout.id;
        payload.version = (editingWorkout.version ?? 0) + 1;
        payload.is_active = true;
        saved = await api.createWorkout(payload);
        setStatus("Nueva versión creada.");
      } else if (mode === "overwrite" && editWorkoutId) {
        saved = await api.updateWorkout(editWorkoutId, payload);
        setStatus("WOD actualizado.");
      } else {
        saved = await api.createWorkout(payload);
        setStatus(kind === "template" ? "Plantilla guardada." : "Workout guardado.");
      }

      if (saved?.id) {
        router.push(`/workouts/${saved.id}`);
      }
    } catch (error: any) {
      setStatus(buildErrorMessage(error));
    } finally {
      setShowConfirmSave(false);
      setPendingKind(null);
    }
  };

  const handleSave = (kind: "wod" | "template" | "ai") => {
    const validation = validateBuilder(workoutTitle, blocks);
    if (validation.length) {
      setStatus("Revisa los campos obligatorios: " + validation.slice(0, 3).join(" | "));
      return;
    }
    if (editWorkoutId && kind === "wod") {
      setPendingKind(kind);
      setShowConfirmSave(true);
      return;
    }
    proceedSave(kind, "create");
  };

  const handleGenerateRandom = () => {
    if (!movements.length) return;

    const pick = (filter: (m: Movement) => boolean, count: number) => {
      const pool = movements.filter(filter);
      return Array.from({ length: count }, () => pool[Math.floor(Math.random() * pool.length)]).filter(Boolean) as Movement[];
    };

    const blocksGenerated: WodBlock[] = [
      {
        id: uid(),
        title: "Bloque 1",
        block_type: "STANDARD",
        type: "Engine",
        movements: pick((m) => categorizeMovement_toggle(m) === "Monoestructurales", 2).map((mv) => ({
          uid: uid(),
          movement: mv,
          distance_meters: 400,
          pace: "Ritmo sostenible"
        }))
      },
      {
        id: uid(),
        title: "Bloque 2",
        block_type: "STANDARD",
        type: "Strength",
        movements: pick((m) => categorizeMovement_toggle(m) === "Fuerza" || categorizeMovement_toggle(m) === "Metcon", 2).map((mv) => ({
          uid: uid(),
          movement: mv,
          reps: 15,
          load: mv.default_load_unit ? 20 : undefined
        }))
      }
    ];

    setBlocks(blocksGenerated);
    setStatus("WOD aleatorio generado.");
  };

  const overlayLabel =
    activeDrag?.type === "template"
      ? movements.find((m) => m.id === (activeDrag as { movementId: number }).movementId)?.name
      : activeDrag?.type === "movement"
        ? "Mover movimiento"
        : null;

  useEffect(() => {
    if (!athleteProfile && !analysis) return;
    recordMetrics("wodBuilder", "athleteProfile", athleteMetrics, [
      ...expectedMetricKeys.capacities,
      ...expectedMetricKeys.biometrics,
      ...expectedMetricKeys.load,
      ...expectedMetricKeys.state
    ]);
    recordMetrics("wodBuilder", "analysis", adaptAthleteImpact(analysis as any), [
      ...expectedMetricKeys.hyrox,
      "fatigue",
      "difficulty",
      "totalTime"
    ]);
  }, [analysis, athleteMetrics, athleteProfile]);

  return (
    <div className="space-y-6">
      {showConfirmSave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900/90 p-5 text-white shadow-xl">
            <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Guardar cambios</p>
            <h3 className="mt-2 text-xl font-semibold">¿Cómo quieres guardar este WOD?</h3>
            <p className="mt-1 text-sm text-slate-300">
              Nueva versión mantiene el historial. Sobrescribir reemplaza la versión actual.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button
                variant="primary"
                onClick={() => {
                  if (!pendingKind) return;
                  proceedSave(pendingKind, "version");
                }}
              >
                Guardar como nueva versión
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  if (!pendingKind) return;
                  proceedSave(pendingKind, "overwrite");
                }}
              >
                Sobrescribir esta versión
              </Button>
              <Button variant="ghost" onClick={() => setShowConfirmSave(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      <Section
        title="WOD Builder inteligente"
        description="Construye un WOD visualmente, arrastra movimientos y observa el analisis en tiempo real."
        className={sectionShell}
      >
        {unresolvedDraft.length > 0 && (
          <div className="mb-2 rounded-xl border border-amber-300/40 bg-amber-300/10 px-3 py-2 text-sm text-amber-100">
            {unresolvedDraft.length} movimientos sin resolver desde el OCR. Añádelos manualmente o selecciónalos antes de guardar.
            <Button size="sm" variant="ghost" className="ml-2" onClick={() => setUnresolvedDraft([])}>
              Marcar como resuelto
            </Button>
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-2">
          <div className="flex flex-wrap gap-3">
            <Button variant="primary" onClick={() => handleSave("wod")} disabled={unresolvedDraft.length > 0}>
              Guardar WOD
            </Button>
            <Button variant="secondary" onClick={() => handleSave("template")} disabled={unresolvedDraft.length > 0}>
              Guardar como plantilla
            </Button>
            <Button variant="ghost" onClick={() => handleSave("ai")} disabled={unresolvedDraft.length > 0}>
              Analizar con IA
            </Button>
            <Button variant="ghost" onClick={handleGenerateRandom}>
              Generar WOD aleatorio
            </Button>
          </div>

          <div className="grid gap-2 md:grid-cols-3">
            <input
              value={workoutTitle}
              onChange={(e) => setWorkoutTitle(e.target.value)}
              placeholder="Titulo del WOD"
              className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white"
            />
            <select
              value={workoutType}
              onChange={(e) => setWorkoutType(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white"
            >
              {WORKOUT_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <input
              value={workoutNotes}
              onChange={(e) => setWorkoutNotes(e.target.value)}
              placeholder="Notas generales / objetivo"
              className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white"
            />
          </div>
        </div>

        {status && <span className="text-sm text-slate-300">{status}</span>}

        <div className="mt-4 grid gap-2 md:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white">
            <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Fatiga</p>
            <p className="text-xl font-semibold">{analysis.fatigue}/10</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white">
            <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Dominio</p>
            <p className="text-lg font-semibold">{analysis.domain}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white">
            <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">HYROX transfer</p>
            <p className="text-lg font-semibold">{analysis.hyroxTransfer}/100</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white">
            <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Tiempo total</p>
            <p className="text-lg font-semibold">{formatTotalTime(analysis.totalTime)}</p>
          </div>
        </div>
      </Section>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid gap-4 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <MovementPalette movements={movements} />
          </div>
          <div className="lg:col-span-2">
            <WodBlocksEditor
              blocks={blocks}
              onUpdateMovement={handleUpdateMovement}
              onRemoveMovement={handleRemoveMovement}
              onAddBlock={handleAddBlock}
              onUpdateBlock={handleUpdateBlock}
              onRemoveBlock={handleRemoveBlock}
            />
          </div>
          <div className="lg:col-span-1 space-y-3 lg:sticky lg:top-4">
            <WodAnalysisPanel analysis={analysis} />
            <AthleteImpact athleteProfile={athleteMetrics} athleteImpact={analysis.impact} mode="preview" />
          </div>
        </div>

        <DragOverlay>
          {overlayLabel && (
            <div className="rounded-xl border border-cyan-400/40 bg-slate-900/80 px-4 py-3 text-sm text-white shadow-lg">
              {overlayLabel}
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

export default WodBuilder;
