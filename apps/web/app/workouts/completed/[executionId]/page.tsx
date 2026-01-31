"use client";
"use client";
import React, { useEffect, useMemo, useState } from "react";
import type { Route } from "next";
import { useParams, useRouter } from "next/navigation";
import { Button, Card, Section } from "@thrifty/ui";
import { api } from "../../../../lib/api";
import type { Workout, WorkoutExecution } from "../../../../lib/types";
import { useAppStore } from "@thrifty/utils";

type LoadState<T> = { data: T | null; loading: boolean; error?: string | null };

const formatSeconds = (total?: number | null) => {
  if (total === undefined || total === null) return "-";
  const minutes = Math.floor(total / 60);
  const seconds = Math.round(total % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}`;
};

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric" }).format(date);
};

const primaryResult = (execution: WorkoutExecution | null) => {
  if (!execution) return "Resultado no disponible";
  const total = typeof execution.total_time_seconds === "number" ? execution.total_time_seconds : null;
  if (total && total > 0) return `Tiempo ${formatSeconds(total)}`;
  const meta = (execution.execution_meta ?? {}) as Record<string, unknown>;
  const scoreRaw = meta.score ?? meta.total_score;
  const repsRaw = meta.reps ?? meta.total_reps;
  if (typeof scoreRaw === "number") return `Score ${scoreRaw}`;
  if (typeof repsRaw === "number") return `Reps ${repsRaw}`;
  return "Resultado no disponible";
};

export default function WorkoutExecutionDetailPage() {
  const params = useParams<{ executionId: string }>();
  const executionId = params?.executionId;
  const router = useRouter();
  const role = useAppStore((s) => s.user?.role ?? "ATHLETE");
  const effectiveRole = role === "ADMIN" ? "COACH" : role;
  const basePath = effectiveRole === "COACH" ? "/coach/workouts" : "/athlete/workouts";

  const [executionState, setExecutionState] = useState<LoadState<WorkoutExecution>>({
    data: null,
    loading: true
  });
  const [workoutState, setWorkoutState] = useState<LoadState<Workout>>({
    data: null,
    loading: true
  });
  const [repeatStatus, setRepeatStatus] = useState<"idle" | "loading" | "error">("idle");
  const [repeatError, setRepeatError] = useState<string | null>(null);

  useEffect(() => {
    if (!executionId) return;
    setExecutionState({ data: null, loading: true });
    setWorkoutState({ data: null, loading: true });
    api
      .getWorkoutExecution(executionId)
      .then((execution) => {
        setExecutionState({ data: execution, loading: false });
        return api.getWorkoutStructure(execution.workout_id).catch(() => null);
      })
      .then((workout) => {
        if (workout) {
          setWorkoutState({ data: workout, loading: false });
        } else {
          setWorkoutState({ data: null, loading: false });
        }
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : "No se pudo cargar la ejecucion.";
        setExecutionState({ data: null, loading: false, error: message });
        setWorkoutState({ data: null, loading: false });
      });
  }, [executionId]);

  const execution = executionState.data;
  const workout = workoutState.data;

  const tagList = useMemo(() => {
    if (!execution) return [];
    const list = [
      execution.workout?.domain,
      execution.workout?.intensity,
      ...(execution.workout?.hyrox_stations?.map((station) => station.station) ?? [])
    ];
    const seen = new Set<string>();
    return list
      .filter(Boolean)
      .map((item) => item as string)
      .filter((item) => {
        const key = item.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 6);
  }, [execution]);

  const blockTimes = useMemo(() => {
    const map = new Map<number, number>();
    (execution?.blocks ?? []).forEach((block) => {
      if (typeof block.workout_block_id !== "number" || typeof block.time_seconds !== "number") return;
      map.set(block.workout_block_id, block.time_seconds);
    });
    return map;
  }, [execution]);

  const orderedBlocks = useMemo(() => {
    if (!workout?.blocks) return [];
    return [...workout.blocks].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  }, [workout?.blocks]);

  const handleRepeat = async () => {
    if (!execution) return;
    setRepeatStatus("loading");
    setRepeatError(null);
    try {
      await api.repeatWorkout(execution.workout_id);
      if (effectiveRole === "ATHLETE") {
        router.push(`${basePath}/${execution.workout_id}/time` as Route);
      }
      setRepeatStatus("idle");
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo repetir el workout.";
      setRepeatError(message);
      setRepeatStatus("error");
    }
  };

  if (executionState.loading) {
    return <p className="text-sm text-slate-400">Cargando ejecucion...</p>;
  }

  if (!execution) {
    return <p className="text-sm text-rose-300">Ejecucion no encontrada.</p>;
  }

  const segmentMode = (execution.execution_meta as Record<string, unknown> | null)?.segment_mode;

  return (
    <div className="space-y-6">
      <Section title="Detalle de workout realizado" description="Vista de solo lectura de tu ejecucion." className="rounded-3xl border border-white/5 bg-slate-950/70 p-6 md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Completado</p>
            <h1 className="text-3xl font-semibold text-white">{execution.workout?.title ?? "Workout"}</h1>
            {workout?.description && <p className="text-sm text-slate-300">{workout.description}</p>}
            <div className="flex flex-wrap gap-2 text-xs text-slate-300">
              {tagList.map((tag, idx) => (
                <span key={`${tag}-${idx}`} className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                  {tag}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-slate-300">
              <span className="rounded-full bg-white/5 px-3 py-1">Fecha: {formatDate(execution.executed_at)}</span>
              <span className="rounded-full bg-white/5 px-3 py-1">{primaryResult(execution)}</span>
              {segmentMode && <span className="rounded-full bg-white/5 px-3 py-1">Modo: {String(segmentMode)}</span>}
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="ghost" href={`${basePath}?tab=realizados`}>
                Volver a realizados
              </Button>
              <Button variant="ghost" href={`${basePath}/${execution.workout_id}`}>
                Ver WOD base
              </Button>
              {effectiveRole === "ATHLETE" && (
                <Button variant="secondary" onClick={handleRepeat} disabled={repeatStatus === "loading"}>
                  {repeatStatus === "loading" ? "Creando..." : "Repetir"}
                </Button>
              )}
            </div>
            {repeatError && <p className="text-xs text-rose-300">{repeatError}</p>}
          </div>
          <Card className="rounded-3xl border border-white/10 bg-slate-900/70 p-4 text-sm text-slate-200">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Resumen</p>
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between">
                <span>Resultado principal</span>
                <span className="text-white">{primaryResult(execution)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Fecha</span>
                <span className="text-white">{formatDate(execution.executed_at)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Intento</span>
                <span className="text-white">#{execution.id}</span>
              </div>
              {execution.notes && (
                <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300">
                  {execution.notes}
                </div>
              )}
            </div>
          </Card>
        </div>
      </Section>

      <Section title="Bloques y tiempos" description="Detalle por bloque (solo lectura)." className="rounded-3xl border border-white/5 bg-slate-950/70 p-6 md:p-8">
        {workoutState.loading ? (
          <p className="text-sm text-slate-400">Cargando bloques...</p>
        ) : orderedBlocks.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {orderedBlocks.map((block) => {
              const time = blockTimes.get(block.id) ?? null;
              return (
                <Card key={block.id} className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{block.block_type ?? "Bloque"}</p>
                      <p className="text-sm font-semibold text-white">{block.title ?? `Bloque ${block.position}`}</p>
                    </div>
                    <span className="text-sm text-cyan-200">{time ? formatSeconds(time) : "-"}</span>
                  </div>
                  {block.description && <p className="mt-2 text-xs text-slate-400">{block.description}</p>}
                </Card>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-slate-400">Sin bloques registrados para esta ejecucion.</p>
        )}
      </Section>
    </div>
  );
}

