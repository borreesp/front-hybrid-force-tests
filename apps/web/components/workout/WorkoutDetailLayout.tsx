
"use client";
import React, { useEffect, useMemo } from "react";
import { Button, Card, Section } from "@thrifty/ui";
import { BarLevelChart } from "../charts/BarLevelChart";
import { LinearProgressBar } from "../charts/LinearProgressBar";
import { AthleteImpact } from "../wod-analysis/AthleteImpact";
import { expectedMetricKeys, recordMetrics } from "../../lib/metrics-debug";
import { adaptAthleteProfile, adaptAthleteImpact, adaptWorkoutComputedMetrics } from "../../lib/metrics/adapters";
import { AthleteRadarChart } from "./AthleteRadarChart";
import type { HyroxTransferResult } from "../../lib/hyrox";
import type {
  AthleteProfileResponse,
  AuthUser,
  Equipment,
  Workout,
  WorkoutAnalysis,
  WorkoutResult,
  WorkoutBlock,
  WorkoutBlockMovement
} from "../../lib/types";

type TimelineBlock = { label: string; blocks: WorkoutBlock[] };
type CapacityGap = { title: string; target: number; athlete: number; delta: number };
type ImpactMap = Record<string, number | undefined>;

type Props = {
  mode: "workout" | "analysis";
  workout: Workout;
  analysis?: WorkoutAnalysis | null;
  equipment?: Equipment[];
  athleteProfile?: AthleteProfileResponse | null;
  user?: AuthUser | null;
  results?: WorkoutResult[];
  similarWorkouts?: Workout[];
  versions?: Workout[];
  athleteImpact?: ImpactMap | null;
  applyHref?: string;
  onApplyTraining?: () => void;
  applyDisabled?: boolean;
  applyLoading?: boolean;
  applyMessage?: string | null;
  editHref?: string;
  onEditWorkout?: () => void;
};

const panelCard =
  "rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/70 via-slate-900/55 to-slate-950/75 shadow-[0_12px_45px_rgba(0,0,0,0.55)] ring-1 ring-white/5 backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-400/30 hover:shadow-[0_18px_60px_rgba(0,0,0,0.6)]";
const sectionShell =
  "rounded-3xl border border-white/5 bg-gradient-to-br from-slate-950/85 via-slate-950/60 to-slate-900/70 shadow-[0_12px_50px_rgba(0,0,0,0.45)] backdrop-blur px-6 md:px-8 py-6 md:py-8";
const heroShell =
  "overflow-hidden rounded-3xl border border-cyan-500/15 bg-gradient-to-br from-slate-950 via-slate-950/70 to-slate-900/70 p-8 ring-1 ring-white/10 shadow-[0_20px_80px_rgba(0,0,0,0.6)]";
const statCard =
  "rounded-3xl border border-white/15 bg-gradient-to-b from-slate-900/80 via-slate-900/60 to-slate-950/85 ring-1 ring-cyan-400/20 shadow-[0_14px_45px_rgba(0,0,0,0.55)]";

type PillProps = { children: React.ReactNode; variant?: "solid" | "outline" | "ghost" };
const Badge: React.FC<PillProps> = ({ children, variant = "solid" }) => {
  const base = "inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold tracking-wide";
  const styles: Record<NonNullable<PillProps["variant"]>, string> = {
    solid: "bg-gradient-to-r from-cyan-500/20 to-indigo-500/25 text-white shadow-[0_6px_18px_rgba(0,0,0,0.35)] ring-1 ring-cyan-400/20",
    outline: "border border-white/20 text-slate-100 bg-white/5",
    ghost: "bg-white/5 text-slate-200 border border-white/5"
  };
  return <span className={`${base} ${styles[variant]}`}>{children}</span>;
};

function formatSeconds(total?: number | null) {
  if (total === undefined || total === null) return "-";
  const minutes = Math.floor(total / 60);
  const seconds = Math.round(total % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function formatMinutesValue(total?: number | null) {
  if (total === undefined || total === null) return "-";
  return `${Math.round(total)} min`;
}

function movementMetrics(movement: WorkoutBlockMovement) {
  const parts: string[] = [];
  if (movement.reps) parts.push(`${movement.reps} reps`);
  if (movement.distance_meters) parts.push(`${movement.distance_meters} m`);
  if (movement.duration_seconds) parts.push(`${movement.duration_seconds} s`);
  if (movement.calories) parts.push(`${movement.calories} cal`);
  if (movement.load) parts.push(`${movement.load}${movement.load_unit ?? ""}`);
  return parts.join(" | ");
}

const buildFallbackImpact = (workout: Workout | null, analysis: WorkoutAnalysis | null): ImpactMap => {
  if (!workout && !analysis) return {};
  const impact: ImpactMap = {};
  const fatigueScore = analysis?.fatigue_score ?? (workout as any)?.fatigue_score;
  if (fatigueScore !== undefined && fatigueScore !== null) {
    impact.fatigue = Math.round(Number(fatigueScore));
  }

  const domain = (workout?.domain || "").toLowerCase();
  if (domain.includes("mixto") || domain.includes("largo")) impact.resistance = 1;

  const capacityFocusText = (analysis?.capacity_focus || []).map((c) => `${c.capacity} ${c.note ?? ""}`.toLowerCase()).join(" ");
  if (capacityFocusText.includes("metcon")) impact.metcon = 2;

  const muscles = (workout?.muscles || []).join(" ").toLowerCase();
  if (muscles.includes("pierna") || muscles.includes("legs")) impact.leg_load = 2;
  else impact.leg_load = 1;

  if (muscles.includes("core") || (workout?.main_muscle_chain || "").toLowerCase().includes("core")) impact.core = 1;

  const hasWallBall = (workout?.blocks || []).some((b) =>
    b.movements?.some((m) => (m.movement?.name || "").toLowerCase().includes("wall") && (m.reps ?? 0) >= 40)
  );
  if (hasWallBall) impact.wb_skill = 1;

  return impact;
};

const toMetricNumber = (value?: number | null) => {
  if (value === null || value === undefined) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const slugify = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");

const buildAthleteProfileMetrics = (profile?: AthleteProfileResponse | null) => {
  if (!profile) return {};
  const entries: [string, number][] = [];
  const seen = new Set<string>();
  const pushMetric = (key: string, value?: number | null) => {
    if (!key || seen.has(key)) return;
    entries.push([key, toMetricNumber(value)]);
    seen.add(key);
  };

  (profile.capacities ?? []).forEach((cap) => pushMetric(cap.capacity, cap.value));

  const bio = profile.biometrics;
  if (bio) {
    pushMetric("hr_rest", bio.hr_rest);
    pushMetric("hr_avg", bio.hr_avg);
    pushMetric("hr_max", bio.hr_max);
    pushMetric("vo2_est", bio.vo2_est);
    pushMetric("hrv", bio.hrv);
    pushMetric("sleep_hours", bio.sleep_hours);
    pushMetric("fatigue_score", bio.fatigue_score);
    pushMetric("recovery_time_hours", bio.recovery_time_hours);
  }

  const load = profile.training_load?.[0];
  if (load) {
    pushMetric("acute_load", load.acute_load);
    pushMetric("chronic_load", load.chronic_load);
    pushMetric("load_ratio", load.load_ratio);
  }

  (profile.skills ?? []).forEach((skill, index) => {
    const key = skill.movement ? `skill_${slugify(skill.movement)}` : `skill_${index}`;
    pushMetric(key, skill.score);
  });

  return Object.fromEntries(entries);
};

export const WorkoutDetailLayout: React.FC<Props> = ({
  mode,
  workout,
  analysis = null,
  equipment = [],
  athleteProfile,
  user,
  results = [],
  similarWorkouts = [],
  athleteImpact,
  applyHref,
  onApplyTraining,
  applyDisabled,
  applyLoading,
  applyMessage,
  editHref,
  onEditWorkout,
  versions = []
}) => {
  const levelTimes = useMemo(() => workout?.level_times ?? [], [workout]);
  const levelChartData = useMemo(
    () => levelTimes.map((lt) => ({ label: lt.athlete_level, value: lt.time_minutes, range: lt.time_range })),
    [levelTimes]
  );
  const equipmentMap = useMemo(() => Object.fromEntries(equipment.map((eq) => [eq.id, eq])), [equipment]);
  const equipmentList = useMemo(() => (workout?.equipment_ids ?? []).map((id) => equipmentMap[id]).filter(Boolean) as Equipment[], [workout, equipmentMap]);

  const athleteLevelCode = athleteProfile?.career?.level != null ? `L${athleteProfile.career.level}` : null;
  const estimatedForUser = levelTimes.find((lt) => lt.athlete_level === athleteLevelCode) ?? levelTimes[0];

  const timeline: TimelineBlock[] = useMemo(() => {
    if (!workout?.blocks) return [];
    const sorted = [...workout.blocks].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    const grouped = new Map<string, WorkoutBlock[]>();
    sorted.forEach((block) => {
      const key = block.block_type || "Bloque";
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)?.push(block);
    });
    return Array.from(grouped.entries()).map(([label, blocks]) => ({ label, blocks }));
  }, [workout]);

  const muscleGroups = useMemo(() => {
    const primary = new Set<string>();
    const secondary = new Set<string>();
    (workout?.muscles ?? []).forEach((m) => {
      if (m) primary.add(m);
    });
    (workout?.blocks ?? []).forEach((block) => {
      block.movements.forEach((mv) => {
        (mv.movement?.muscles ?? []).forEach((mm) => {
          if (!mm.muscle_group) return;
          if (mm.is_primary) {
            primary.add(mm.muscle_group);
          } else {
            secondary.add(mm.muscle_group);
          }
        });
      });
    });
    const filteredSecondary = Array.from(secondary).filter((item) => item && !primary.has(item));
    return { primary: Array.from(primary).filter(Boolean), secondary: filteredSecondary };
  }, [workout]);

  const capacityDetails = useMemo(() => workout?.capacities ?? [], [workout]);
  const hyroxStations = useMemo(() => workout?.hyrox_stations ?? [], [workout]);

  const sortedResults = useMemo(() => [...results].sort((a, b) => a.id - b.id), [results]);
  const userResults = useMemo(() => (user ? sortedResults.filter((r) => r.user_id === user.id) : []), [sortedResults, user]);
  const completionCount = userResults.length;
  const bestUserTime = useMemo(() => (userResults.length ? Math.min(...userResults.map((r) => r.time_seconds)) : null), [userResults]);
  const lastUserResult = useMemo(() => (userResults.length ? userResults[userResults.length - 1] : null), [userResults]);
  const averageDifficulty = useMemo(
    () => (userResults.length ? Math.round(userResults.reduce((acc, r) => acc + (r.difficulty ?? 0), 0) / userResults.length) : null),
    [userResults]
  );
  const globalSample = results.length;
  const globalAvgTime = useMemo(
    () => (globalSample ? Math.round(results.reduce((acc, r) => acc + r.time_seconds, 0) / globalSample) : null),
    [results, globalSample]
  );

  const capacityGap = useMemo<CapacityGap | null>(() => {
    if (!athleteProfile || !workout?.capacities?.length) return null;
    let gapItem: CapacityGap | null = null;
    const athleteCaps = athleteProfile.capacities ?? [];
    workout.capacities.forEach((cap) => {
      const athleteCap = athleteCaps.find((c) => c.capacity.toLowerCase() === (cap.capacity || "").toLowerCase());
      const athleteValue = athleteCap?.value ?? 0;
      const delta = cap.value - athleteValue;
      if (!gapItem || delta > gapItem.delta) {
        gapItem = { title: cap.capacity, target: cap.value, athlete: athleteValue, delta };
      }
    });
    return gapItem;
  }, [athleteProfile, workout]);

  const mainMovement = useMemo(() => workout?.blocks?.[0]?.movements?.[0]?.movement?.name ?? null, [workout]);
  const relevantPr = useMemo(() => {
    const prs = athleteProfile?.prs ?? [];
    if (!prs.length) return null;
    if (mainMovement) {
      const match = prs.find((pr) => pr.movement.toLowerCase() === mainMovement.toLowerCase());
      if (match) return match;
    }
    return prs[0];
  }, [athleteProfile, mainMovement]);

  const radarData = useMemo(() => {
    const baseCaps = ["Fuerza", "Resistencia", "Metcon", "Gimnásticos", "Velocidad", "Carga muscular"];
    const map = new Map<string, number>();
    baseCaps.forEach((c) => map.set(c, 0));

    capacityDetails.forEach((cap) => {
      if (!cap?.capacity) return;
      map.set(cap.capacity, Math.max(0, Math.min(100, cap.value ?? 0)));
    });

    if (!capacityDetails.length && analysis?.capacity_focus?.length) {
      analysis.capacity_focus.forEach((cap) => {
        const val = parseInt((cap.emphasis || "60").split("/")[0], 10) || 60;
        map.set(cap.capacity, Math.max(0, Math.min(100, val)));
      });
    }

    return Array.from(map.entries()).map(([label, value]) => ({ label, value }));
  }, [capacityDetails, analysis]);

  const impactData = useMemo(
    () => athleteImpact ?? ((analysis as any)?.athlete_impact as ImpactMap | undefined) ?? buildFallbackImpact(workout, analysis),
    [analysis, athleteImpact, workout]
  );
  const athleteProfileMetrics = useMemo(() => adaptAthleteProfile(buildAthleteProfileMetrics(athleteProfile)), [athleteProfile]);

  const hyroxTransfer = useMemo<HyroxTransferResult | null>(() => {
    const transferScore =
      workout?.hyrox_transfer_score ?? (analysis as any)?.hyrox_transfer_score ?? (analysis as any)?.hyrox_transfer;
    if (transferScore === undefined || transferScore === null) return null;
    const components = workout?.hyrox_components ?? (analysis as any)?.hyrox_components ?? {};
    const explanation = (analysis as any)?.hyrox_explanation ?? [];
    return {
      transferScore: Number(transferScore),
      components: components as HyroxTransferResult["components"],
      explanation: Array.isArray(explanation) ? explanation : []
    };
  }, [analysis, workout]);

  useEffect(() => {
    if (!workout) return;
    recordMetrics("workoutDetail", "athleteProfile", athleteProfileMetrics, [
      ...expectedMetricKeys.capacities,
      ...expectedMetricKeys.biometrics,
      ...expectedMetricKeys.load,
      ...expectedMetricKeys.state,
      ...expectedMetricKeys.skills
    ]);
    recordMetrics("workoutDetail", "workoutMetadata", adaptWorkoutComputedMetrics(workout as any), [
      ...expectedMetricKeys.hyrox,
      "estimated_difficulty",
      "avg_time_seconds",
      "avg_rating",
      "avg_difficulty",
      "work_rest_ratio",
      "pacing_tip",
      "pacing_detail"
    ]);
    recordMetrics("workoutDetail", "athleteImpact", adaptAthleteImpact(impactData as any));
  }, [athleteProfileMetrics, impactData, workout]);

  const workoutFatigueScore = analysis?.fatigue_score ?? (workout as any)?.fatigue_score;
  const fatigueValue = mode === "analysis" ? workoutFatigueScore : workout?.estimated_difficulty;
  const capacityFocus = mode === "analysis" ? analysis?.capacity_focus ?? [] : [];
  const capacityPreview = capacityFocus.length
    ? capacityFocus
    : capacityDetails.slice(0, 3).map((cap) => ({ capacity: cap.capacity, note: cap.note, emphasis: `${cap.value}/100` }));
  const pacingCopy = mode === "analysis" ? analysis?.pacing : { tip: workout.pacing_tip ?? "Mantener ritmo estable.", range: workout.work_rest_ratio ?? "" };

  const showComparative = mode === "workout" || Boolean(athleteProfile);
  const showResultsSection = mode === "workout";
  const showSimilar = (similarWorkouts?.length ?? 0) > 0;
  const rootWorkoutId = workout?.parent_workout_id ?? workout?.id;
  const versionsList = useMemo(() => {
    if (!workout) return [];
    const raw = [...(versions ?? []), workout];
    const filtered = raw.filter((v, idx, arr) => {
      if (!v) return false;
      if (v.parent_workout_id && v.parent_workout_id !== rootWorkoutId) return false;
      if (!v.parent_workout_id && v.id !== rootWorkoutId) return false;
      return arr.findIndex((other) => other?.id === v.id) === idx;
    });
    return filtered.sort((a, b) => {
      if (a.is_active && !b.is_active) return -1;
      if (!a.is_active && b.is_active) return 1;
      const versionA = a.version ?? 0;
      const versionB = b.version ?? 0;
      if (versionA !== versionB) return versionB - versionA;
      const dateA = a.updated_at ?? a.created_at ?? "";
      const dateB = b.updated_at ?? b.created_at ?? "";
      return dateA > dateB ? -1 : 1;
    });
  }, [versions, workout, rootWorkoutId]);

  const applyActionDisabled = applyDisabled || applyLoading || (!onApplyTraining && !applyHref);

  const applyButton = (
    <Button
      variant="secondary"
      onClick={onApplyTraining}
      href={onApplyTraining ? undefined : applyHref}
      disabled={applyActionDisabled}
    >
      {applyLoading ? "Aplicando..." : "Aplicar entrenamiento"}
    </Button>
  );

  const editButton =
    mode === "workout" && (onEditWorkout || editHref) ? (
      <Button variant="ghost" onClick={onEditWorkout} href={onEditWorkout ? undefined : editHref}>
        Editar
      </Button>
    ) : null;

  return (
    <div className="space-y-10">
      <section className={heroShell}>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-400">
              <span>{mode === "analysis" ? "Resultado de analisis" : "Detalle del WOD"}</span>
              {workout.official_tag && <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] text-white">{workout.official_tag}</span>}
              {mode === "analysis" && <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-[10px] font-semibold text-emerald-200">Analizado</span>}
            </div>
            <h1 className="text-4xl font-semibold text-white">{workout.title}</h1>
            <p className="max-w-3xl text-base text-slate-300">{workout.description}</p>
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge>{workout.wod_type}</Badge>
              {workout.domain && <Badge variant="outline">Dominio {workout.domain}</Badge>}
              {workout.intensity && <Badge variant="outline">Intensidad {workout.intensity}</Badge>}
              {hyroxTransfer && <Badge variant="outline">HYROX {hyroxTransfer.transferScore}/100</Badge>}
              {workout.main_muscle_chain && <Badge variant="outline">Musculo {workout.main_muscle_chain}</Badge>}
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-slate-300">
              {workout.work_rest_ratio && <span className="rounded-full bg-white/5 px-3 py-1">Trabajo/Descanso {workout.work_rest_ratio}</span>}
              {workout.volume_total && <span className="rounded-full bg-white/5 px-3 py-1">Volumen {workout.volume_total}</span>}
              {analysis?.pacing?.tip && <span className="rounded-full bg-white/5 px-3 py-1">Pacing: {analysis.pacing.tip}</span>}
            </div>
            <div className="flex flex-wrap gap-3">
              {mode === "analysis" ? (
                <Button variant="primary" href="/wod-analysis">
                  Nuevo analisis
                </Button>
              ) : (
                <Button variant="primary" href={`/wod-analysis?workoutId=${workout.id}`}>
                  Nuevo analisis
                </Button>
              )}
              <Button variant="ghost" href="/workouts">
                Ver WODs
              </Button>
              {editButton}
              {applyButton}
            </div>
            {applyMessage && <p className="text-xs text-emerald-200">{applyMessage}</p>}
          </div>
          <div className="grid w-full gap-3 sm:grid-cols-2 lg:w-[420px]">
            <Card className={statCard}>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{mode === "analysis" ? "Fatiga real" : "Dificultad estimada"}</p>
              <div className="mt-3 flex items-end justify-between">
                <span className="text-4xl font-semibold text-white">{fatigueValue ?? "-"}</span>
                <span className="text-xs text-slate-400">Valoraciones {workout.rating_count ?? 0}</span>
              </div>
              <LinearProgressBar value={((fatigueValue ?? 0) / 10) * 100} color="#22d3ee" />
              <p className="text-[11px] text-slate-400">
                Transferencia HYROX: {hyroxTransfer ? `${hyroxTransfer.transferScore}/100` : "-"}
              </p>
            </Card>
            <Card className={statCard}>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Tiempo esperado</p>
              <p className="mt-3 text-3xl font-semibold text-white">
                {estimatedForUser ? estimatedForUser.time_range : formatSeconds(workout.avg_time_seconds)}
              </p>
              <p className="text-xs text-slate-400">{athleteLevelCode ? `Segun tu nivel ${athleteLevelCode}` : "Nivel medio del WOD"}</p>
              {workout.avg_time_seconds && <p className="text-[11px] text-slate-500">Media global: {formatSeconds(workout.avg_time_seconds)}</p>}
            </Card>
            <Card className={statCard}>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Estado de sesion</p>
              <p className="mt-3 text-lg font-semibold text-white">{workout.session_load ?? "N/A"}</p>
              <p className="text-xs text-slate-400">Sensacion: {workout.session_feel ?? "-"}</p>
              {completionCount > 0 && mode === "workout" && (
                <p className="mt-2 rounded-xl bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
                  Completado {completionCount}x por ti{bestUserTime ? ` ú mejor ${formatSeconds(bestUserTime)}` : ""}
                </p>
              )}
            </Card>
          </div>
        </div>
      </section>

      <Section
        title="Claves del WOD"
        description="Fatiga, capacidades foco y pacing recomendado con el mismo layout en ambos modos."
        className={sectionShell}
      >
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className={panelCard}>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{mode === "analysis" ? "Fatiga real" : "Fatiga estimada"}</p>
            <p className="mt-2 text-3xl font-semibold text-white">{fatigueValue ?? "-"}</p>
            <p className="text-xs text-slate-500">
              HYROX transfer: {hyroxTransfer ? `${hyroxTransfer.transferScore}/100` : "-"}
            </p>
          </Card>
          <Card className={panelCard}>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Capacidades foco</p>
            <div className="mt-3 space-y-2 text-sm text-slate-200">
              {capacityPreview.map((cap) => (
                <div key={cap.capacity} className="rounded-xl bg-white/5 px-3 py-2">
                  <p className="font-semibold text-white">{cap.capacity}</p>
                  {cap.note && <p className="text-xs text-slate-400">{cap.note}</p>}
                  {cap.emphasis && <p className="text-[11px] text-slate-500">{cap.emphasis}</p>}
                </div>
              ))}
              {!capacityPreview.length && <p className="text-sm text-slate-400">Sin datos de capacidades.</p>}
            </div>
          </Card>
          <Card className={panelCard}>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Pacing recomendado</p>
            <p className="mt-2 text-sm text-white">{pacingCopy?.tip ?? "Mantener ritmo estable, controlando work/rest indicado."}</p>
            <p className="text-xs text-slate-400">{pacingCopy?.range ?? workout.pacing_detail ?? ""}</p>
            <p className="mt-3 text-xs text-slate-500">{analysis?.expected_feel ?? "Ajusta segun sensaciones."}</p>
          </Card>
        </div>
      </Section>

      <AthleteImpact athleteProfile={athleteProfileMetrics} athleteImpact={impactData} mode={mode} />

      <Section
        title="Detalles clave"
        description="Dominio, intensidad y carga real del WOD, sin datos mock."
        className={sectionShell}
      >
        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          <Card className={panelCard}>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Dominio</p>
            <p className="mt-2 text-xl font-semibold text-white">{workout.domain ?? "-"}</p>
            <p className="text-[11px] text-slate-500">Estimulo: {workout.dominant_stimulus ?? "-"}</p>
          </Card>
          <Card className={panelCard}>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Intensidad</p>
            <p className="mt-2 text-xl font-semibold text-white">{workout.intensity ?? "-"}</p>
            <p className="text-[11px] text-slate-500">Carga: {workout.load_type ?? "-"}</p>
          </Card>
          <Card className={panelCard}>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Transfer HYROX</p>
            <p className="mt-2 text-xl font-semibold text-white">{workout.hyrox_transfer ?? "-"}</p>
            <p className="text-[11px] text-slate-500">Stations: {hyroxStations.length}</p>
          </Card>
          <Card className={panelCard}>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Musculatura</p>
            <p className="mt-2 text-xl font-semibold text-white">{workout.main_muscle_chain ?? "-"}</p>
            <p className="text-[11px] text-slate-500">Primarios: {muscleGroups.primary.length}</p>
          </Card>
          <Card className={panelCard}>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Duracion / volumen</p>
            <p className="mt-2 text-xl font-semibold text-white">{workout.volume_total ?? "-"}</p>
            <p className="text-[11px] text-slate-500">Avg time: {formatSeconds(workout.avg_time_seconds)}</p>
          </Card>
          <Card className={panelCard}>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Carga del dia</p>
            <p className="mt-2 text-xl font-semibold text-white">{workout.session_load ?? "-"}</p>
            <p className="text-[11px] text-slate-500">Feel: {workout.session_feel ?? "-"}</p>
          </Card>
        </div>
      </Section>

      <Section
        title="Coach Insights"
        description="Metadata avanzada: perfil de atleta, pacing, variantes RX/Scaled y observaciones AI."
        className={sectionShell}
      >
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className={panelCard}>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Perfil y objetivo</p>
            <p className="mt-2 text-sm text-slate-200 leading-relaxed">{workout.athlete_profile_desc ?? "Perfil general"}</p>
            <p className="mt-3 text-xs text-slate-400">Objetivo: {workout.target_athlete_desc ?? "-"}</p>
          </Card>
          <Card className={panelCard}>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Pacing y descansos</p>
            <p className="mt-2 text-sm text-slate-200">Pacing tip: {workout.pacing_tip ?? "-"}</p>
            <p className="mt-2 text-sm text-slate-200">Detalle: {workout.pacing_detail ?? "-"}</p>
            <p className="mt-2 text-xs text-slate-400">Breaks: {workout.break_tip ?? "-"}</p>
          </Card>
          <Card className={panelCard}>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">RX, scaled y AI</p>
            <p className="mt-2 text-sm text-slate-200">RX: {workout.rx_variant ?? "-"}</p>
            <p className="mt-2 text-sm text-slate-200">Scaled: {workout.scaled_variant ?? "-"}</p>
            <p className="mt-3 text-[12px] text-slate-400">AI: {workout.ai_observation ?? "Sin nota AI"}</p>
          </Card>
        </div>
        {analysis && (
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <Card className={panelCard}>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Fatiga y transfer</p>
              <p className="mt-2 text-3xl font-semibold text-white">{analysis.fatigue_score.toFixed(1)}</p>
              <p className="text-xs text-slate-400">Transfer HYROX {analysis.hyrox_transfer.toFixed(1)}%</p>
            </Card>
            <Card className={panelCard}>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Capacidades foco</p>
              <div className="mt-3 space-y-2 text-sm text-slate-200">
                {analysis.capacity_focus.map((cap) => (
                  <div key={cap.capacity} className="rounded-xl bg-white/5 px-3 py-2">
                    <p className="font-semibold text-white">{cap.capacity}</p>
                    <p className="text-xs text-slate-400">{cap.note}</p>
                    <p className="text-[11px] text-slate-500">{cap.emphasis}</p>
                  </div>
                ))}
              </div>
            </Card>
            <Card className={panelCard}>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Pacing recomendado</p>
              <p className="mt-2 text-sm text-white">{analysis.pacing.tip}</p>
              <p className="text-xs text-slate-400">{analysis.pacing.range}</p>
              <p className="mt-3 text-xs text-slate-500">{analysis.expected_feel}</p>
            </Card>
          </div>
        )}
      </Section>

      <Section
        title="Bloques del WOD"
        description="Timeline real: warm-up, skill, main y finisher con cargas y notas."
        className={sectionShell}
      >
        {editButton && (
          <div className="mb-4 flex justify-end">
            <Button variant="primary" href={editHref} onClick={onEditWorkout}>
              Editar en Estructura
            </Button>
          </div>
        )}
        <div className="space-y-5 px-1 md:px-0">
          {timeline.map((group) => (
            <div
              key={group.label}
              className="relative rounded-2xl border border-cyan-500/10 bg-gradient-to-r from-slate-950/70 via-slate-950/45 to-slate-900/55 p-4 md:p-5 shadow-[0_12px_40px_rgba(0,0,0,0.45)]"
            >
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-cyan-400" />
                <p className="text-sm font-semibold text-white">{group.label}</p>
                <span className="text-[11px] text-slate-400">{group.blocks.length} bloques</span>
              </div>
              <div className="mt-3 grid gap-3 lg:grid-cols-2">
                {group.blocks.map((block) => (
                  <Card key={block.id} className={`${panelCard} h-full`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-white">{block.title || block.block_type || "Bloque"}</p>
                        <p className="text-xs text-slate-400">
                          {block.rounds ? `${block.rounds} rondas` : block.duration_seconds ? formatSeconds(block.duration_seconds) : "Sin duracion"}
                        </p>
                      </div>
                      {block.description && <p className="text-xs text-slate-400">{block.description}</p>}
                    </div>
                    <div className="mt-3 space-y-2 text-sm text-slate-200">
                      {block.movements.map((movement) => (
                        <div
                          key={movement.id}
                          className="flex items-center justify-between rounded-xl border border-white/10 bg-gradient-to-r from-slate-800/60 via-slate-800/40 to-slate-900/60 px-3 py-2 shadow-inner shadow-black/30"
                        >
                          <div>
                            <p className="font-semibold text-white">{movement.movement?.name ?? "Movimiento"}</p>
                            <p className="text-[11px] text-slate-400">{movement.movement?.category}</p>
                          </div>
                          <span className="text-xs text-slate-300">{movementMetrics(movement)}</span>
                        </div>
                      ))}
                    </div>
                    {block.notes && <p className="mt-3 text-xs text-slate-400">Notas: {block.notes}</p>}
                  </Card>
                ))}
              </div>
            </div>
          ))}
          {!timeline.length && <p className="text-sm text-slate-400">Sin bloques estructurados.</p>}
        </div>
      </Section>

      <Section
        title="Capacidades, musculos y equipamiento"
        description="Impacto real del WOD sobre capacidades, musculatura y estaciones HYROX."
        className={sectionShell}
      >
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className={panelCard}>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Capacidades clave</p>
            <div className="mt-3 space-y-2">
              {capacityDetails.map((cap) => (
                <div
                  key={cap.capacity}
                  className="rounded-xl border border-white/10 bg-gradient-to-r from-slate-900/70 via-slate-900/55 to-slate-950/70 px-3 py-2 shadow-inner shadow-black/30"
                >
                  <div className="flex items-center justify-between text-sm text-white">
                    <span>{cap.capacity}</span>
                    <span className="text-xs text-emerald-200">{cap.value}/100</span>
                  </div>
                  <LinearProgressBar value={cap.value} color="#22d3ee" variant="compact" />
                  {cap.note && <p className="text-[11px] text-slate-400">{cap.note}</p>}
                </div>
              ))}
              {!capacityDetails.length && <p className="text-sm text-slate-400">Sin capacidades registradas.</p>}
            </div>
          </Card>
          <Card className={panelCard}>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Musculos y equipo</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {muscleGroups.primary.map((muscle) => (
                <Badge key={muscle} variant="outline">
                  {muscle}
                </Badge>
              ))}
              {!muscleGroups.primary.length && <p className="text-sm text-slate-400">Sin musculos primarios.</p>}
            </div>
            {muscleGroups.secondary.length > 0 && (
              <>
                <p className="mt-4 text-[11px] uppercase tracking-wide text-slate-500">Secundarios</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {muscleGroups.secondary.map((muscle) => (
                    <Badge key={muscle} variant="ghost">
                      {muscle}
                    </Badge>
                  ))}
                </div>
              </>
            )}
            <p className="mt-4 text-[11px] uppercase tracking-wide text-slate-500">Equipamiento</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {equipmentList.map((eq) => (
                <div key={eq.id} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                  <p className="text-sm font-semibold text-white">{eq.name}</p>
                  <p className="text-[11px] text-slate-400">{eq.category}</p>
                </div>
              ))}
              {!equipmentList.length && <p className="text-sm text-slate-400">Sin equipo asociado.</p>}
            </div>
          </Card>
          <Card className={panelCard}>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Transfer HYROX por estacion</p>
            <div className="mt-3 space-y-2">
              {hyroxTransfer ? (
                <>
                  <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                    <span className="text-sm text-white">Score total</span>
                    <span className="text-base font-semibold text-amber-200">{hyroxTransfer.transferScore}/100</span>
                  </div>
                  {Object.entries(hyroxTransfer.components)
                    .filter(([, value]) => (value ?? 0) > 0)
                    .map(([key, value]) => (
                      <div
                        key={key}
                        className="rounded-xl border border-white/10 bg-gradient-to-r from-slate-900/70 via-slate-900/55 to-slate-950/70 px-3 py-2 shadow-inner shadow-black/30"
                      >
                        <div className="flex items-center justify-between text-sm text-white">
                          <span>{key.replace(/_/g, " ")}</span>
                          <span className="text-xs text-amber-200">{Math.round(value)}/100</span>
                        </div>
                        <LinearProgressBar value={value} color="#f59e0b" variant="compact" />
                      </div>
                    ))}
                  {hyroxTransfer.explanation.length > 0 && (
                    <ul className="mt-2 space-y-1 text-xs text-slate-300">
                      {hyroxTransfer.explanation.slice(0, 4).map((item) => (
                        <li key={item} className="rounded-lg bg-white/5 px-2 py-1">
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                <p className="text-sm text-slate-400">Sin estaciones HYROX definidas.</p>
              )}
            </div>
          </Card>
        </div>
      </Section>

      <Section title="Estadisticas globales y tiempos por nivel" className={sectionShell}>
        <div className="grid gap-4 lg:grid-cols-4">
          <Card className={panelCard}>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Dificultad estimada</p>
            <p className="mt-2 text-3xl font-semibold text-white">{workout.estimated_difficulty ?? "-"}</p>
            <p className="text-xs text-slate-500">Valoracion media: {workout.avg_rating ?? "-"}</p>
          </Card>
          <Card className={panelCard}>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Tiempo medio</p>
            <p className="mt-2 text-3xl font-semibold text-white">{formatSeconds(workout.avg_time_seconds)}</p>
            <p className="text-xs text-slate-500">Muestras: {workout.rating_count ?? "-"}</p>
          </Card>
          <Card className={panelCard}>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Nivel recomendado</p>
            <p className="mt-2 text-xl font-semibold text-white">{athleteLevelCode ?? "L1-L10"}</p>
            <p className="text-xs text-slate-500">Segun nivel medio del dataset</p>
          </Card>
          <Card className={panelCard}>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Tu estimacion</p>
            <p className="mt-2 text-3xl font-semibold text-white">
              {mode === "analysis" ? analysis?.pacing?.range ?? estimatedForUser?.time_range ?? "-" : estimatedForUser ? estimatedForUser.time_range : "-"}
            </p>
            <p className="text-xs text-slate-500">Comparado con niveles cargados</p>
          </Card>
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-5">
          <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-gradient-to-br from-slate-950/70 via-slate-950/50 to-slate-900/50 p-3 shadow-[0_10px_30px_rgba(0,0,0,0.45)]">
            <BarLevelChart data={levelChartData} color="#22d3ee" />
          </div>
          <div className="lg:col-span-3 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-950/70 via-slate-950/55 to-slate-900/55 shadow-[0_10px_30px_rgba(0,0,0,0.45)] ring-1 ring-white/5">
            <table className="min-w-full divide-y divide-white/5 text-sm text-slate-200">
              <thead className="bg-slate-900/60 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-2 text-left">Nivel</th>
                  <th className="px-4 py-2 text-left">Tiempo estimado</th>
                  <th className="px-4 py-2 text-left">Rango</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 bg-slate-900/30">
                {levelTimes.map((lt) => (
                  <tr key={`${lt.athlete_level}-${lt.time_range}`} className="hover:bg-slate-800/30">
                    <td className="px-4 py-2">{lt.athlete_level}</td>
                    <td className="px-4 py-2">{formatMinutesValue(lt.time_minutes)}</td>
                    <td className="px-4 py-2">{lt.time_range}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Section>
      {showComparative && (
        <Section
          title="Comparativa personal"
          description="Cruce con tu perfil HybridForce, PRs y gaps de capacidad."
          className={sectionShell}
        >
          {athleteProfile ? (
            <div className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-4">
                <Card className={panelCard}>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Nivel actual</p>
                  <p className="mt-2 text-3xl font-semibold text-white">L{athleteProfile?.career?.level ?? 0}</p>
                  <p className="text-xs text-slate-500">XP total {athleteProfile?.career?.xp_total ?? 0}</p>
                </Card>
                <Card className={panelCard}>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Capacidad critica</p>
                  {capacityGap ? (
                    <>
                      <p className="mt-2 text-lg font-semibold text-white">{capacityGap.title}</p>
                      <p className="text-xs text-slate-400">
                        Necesario {capacityGap.target}/100 ú Tu nivel {capacityGap.athlete}/100
                      </p>
                    </>
                  ) : (
                    <p className="mt-2 text-sm text-slate-300">Sin gap detectado.</p>
                  )}
                </Card>
                <Card className={panelCard}>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">PR relevante</p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {relevantPr ? `${relevantPr.movement}: ${relevantPr.value} ${relevantPr.unit ?? ""}` : "Sin PR registrado"}
                  </p>
                  {mainMovement && <p className="text-xs text-slate-400">Movimiento clave: {mainMovement}</p>}
                </Card>
                <Card className={panelCard}>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Pacing sugerido</p>
                  <p className="mt-2 text-sm text-white">{analysis?.pacing?.tip ?? "Mantener ritmo estable, controlando work/rest indicado."}</p>
                  <p className="text-xs text-slate-500">{analysis?.expected_feel ?? "Ajusta segun sensaciones."}</p>
                </Card>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <Card className={panelCard}>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Radar de capacidades del WOD</p>
                  {radarData.length ? <AthleteRadarChart data={radarData} /> : <p className="mt-3 text-sm text-slate-400">Sin datos de capacidades para graficar.</p>}
                </Card>
                <Card className={panelCard}>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Notas personalizadas</p>
                  <ul className="mt-3 space-y-2 text-sm text-slate-200">
                    {capacityGap && (
                      <li className="rounded-xl border border-white/10 bg-gradient-to-r from-slate-900/70 via-slate-900/55 to-slate-950/70 px-3 py-2 shadow-inner shadow-black/30">
                        Trabaja {capacityGap.title} para recortar {capacityGap.delta} puntos de gap.
                      </li>
                    )}
                    {relevantPr && (
                      <li className="rounded-xl border border-white/10 bg-gradient-to-r from-slate-900/70 via-slate-900/55 to-slate-950/70 px-3 py-2 shadow-inner shadow-black/30">
                        Tu PR de {relevantPr.movement} te coloca en {athleteLevelCode ?? "tu nivel actual"} para este WOD.
                      </li>
                    )}
                    {averageDifficulty && (
                      <li className="rounded-xl border border-white/10 bg-gradient-to-r from-slate-900/70 via-slate-900/55 to-slate-950/70 px-3 py-2 shadow-inner shadow-black/30">
                        Dificultad percibida media en tus intentos: {averageDifficulty}/10.
                      </li>
                    )}
                    {!capacityGap && !relevantPr && !averageDifficulty && (
                      <li className="rounded-xl border border-white/10 bg-gradient-to-r from-slate-900/70 via-slate-900/55 to-slate-950/70 px-3 py-2 shadow-inner shadow-black/30">
                        Sin datos personales aun. Registra tu resultado para activar comparativas.
                      </li>
                    )}
                  </ul>
                </Card>
              </div>
            </div>
          ) : (
            mode === "workout" && <p className="text-sm text-slate-400">Sin perfil cargado.</p>
          )}
        </Section>
      )}

      {showResultsSection && (
        <Section
          title="Ejecuciones y feedback real"
          description="Resultados guardados en backend por ti y por la comunidad."
          className={sectionShell}
        >
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className={panelCard}>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Tu historial</p>
              {userResults.length ? (
                <div className="mt-3 space-y-2 text-sm text-slate-200">
                  {userResults.slice(-3).map((res) => (
                    <div
                      key={res.id}
                      className="rounded-xl border border-white/10 bg-gradient-to-r from-slate-900/70 via-slate-900/55 to-slate-950/70 px-3 py-2 shadow-inner shadow-black/30"
                    >
                      <p className="font-semibold text-white">{formatSeconds(res.time_seconds)}</p>
                      <p className="text-[11px] text-slate-400">
                        Dificultad {res.difficulty ?? "-"} · Valoracion {res.rating ?? "-"} · ID {res.id}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm text-slate-400">Aun no has registrado este WOD.</p>
              )}
            </Card>
            <Card className={panelCard}>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Muestras globales</p>
              <p className="mt-2 text-3xl font-semibold text-white">{globalSample}</p>
              <p className="text-xs text-slate-500">Resultados totales guardados</p>
              <p className="mt-2 text-sm text-slate-200">Tiempo medio: {globalAvgTime ? formatSeconds(globalAvgTime) : "-"}</p>
            </Card>
            <Card className={panelCard}>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Estado</p>
              <p className="mt-2 text-sm text-slate-200">
                {lastUserResult
                  ? `Ultimo intento: ${formatSeconds(lastUserResult.time_seconds)} (diff ${lastUserResult.difficulty ?? "-"})`
                  : "Registra tu primer intento para comparar pacing y HR en futuras iteraciones."}
              </p>
            </Card>
          </div>
        </Section>
      )}

      {showSimilar && (
        <Section
          title="WODs similares"
          description="Recomendados por dominio, musculatura, transferencia y nivel."
          className={sectionShell}
        >
          <div className="grid gap-4 md:grid-cols-3">
            {similarWorkouts.map((sim) => (
              <Card key={sim.id} className={panelCard}>
                <p className="text-sm font-semibold text-white">{sim.title}</p>
                <p className="text-xs text-slate-400">{sim.description}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-300">
                  <Badge>{sim.domain}</Badge>
                  <Badge>{sim.intensity}</Badge>
                  <Badge>{sim.wod_type}</Badge>
                </div>
              </Card>
            ))}
          </div>
        </Section>
      )}

      <Section
        title="Versiones del WOD"
        description="Historial de revisiones de este entrenamiento."
        className={sectionShell}
      >
        <div className="space-y-3">
          {versionsList.length ? (
            versionsList.map((v) => (
              <Card key={v.id} className={panelCard}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      v{v.version ?? "?"} — {v.title}
                    </p>
                    <p className="text-xs text-slate-400">
                      {v.wod_type ?? "WOD"} • {v.domain ?? "Dominio N/A"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={v.is_active ? "solid" : "ghost"}>{v.is_active ? "ACTIVA" : "ANTERIOR"}</Badge>
                    <span className="text-xs text-slate-400">{v.updated_at ?? v.created_at ?? ""}</span>
                    <Button variant="ghost" href={`/workouts/${v.id}`}>
                      Ver
                    </Button>
                    <Button variant="secondary" href={`/workouts/structure?editWorkoutId=${v.id}`}>
                      Editar
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <p className="text-sm text-slate-400">Este WOD no tiene revisiones todavía.</p>
          )}
        </div>
      </Section>

    </div>
  );
};

export default WorkoutDetailLayout;

