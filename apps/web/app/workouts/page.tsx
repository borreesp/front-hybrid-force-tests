"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Card, Section } from "@thrifty/ui";
import { api } from "../../lib/api";
import type { Workout, WorkoutExecution } from "../../lib/types";
import { useAppStore } from "@thrifty/utils";
import { useSearchParams } from "next/navigation";

const statTone = {
  cardio: "text-cyan-200",
  strength: "text-orange-200",
  hybrid: "text-indigo-200"
} as const;

export default function WorkoutsPage() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [executions, setExecutions] = useState<WorkoutExecution[]>([]);
  const [execStatus, setExecStatus] = useState<"idle" | "loading" | "error">("idle");
  const [execError, setExecError] = useState<string | null>(null);
  const [filters, setFilters] = useState({ domain: "", intensity: "", hyrox: "" });
  const [search, setSearch] = useState("");
  const [historyRange, setHistoryRange] = useState<"2w" | "1m" | "all">("2w");
  const [assignMessage, setAssignMessage] = useState<string | null>(null);
  const [athleteName, setAthleteName] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const role = useAppStore((s) => s.user?.role ?? "ATHLETE");
  const effectiveRole = role === "ADMIN" ? "COACH" : role;
  const athleteId = searchParams?.get("athleteId");
  const basePath = effectiveRole === "COACH" ? "/coach/workouts" : "/athlete/workouts";
  const completedBasePath = `${basePath}/completed`;
  const tabParam = searchParams?.get("tab");
  const [activeTab, setActiveTab] = useState<"available" | "completed">(
    tabParam === "realizados" ? "completed" : "available"
  );

  useEffect(() => {
    setStatus("loading");
    api
      .getWorkouts()
      .then((data) => {
        setWorkouts(data);
        setStatus("idle");
      })
      .catch((err) => {
        setError(err.message);
        setStatus("error");
      });
  }, []);

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam === "realizados" ? "completed" : "available");
    }
  }, [tabParam]);

  useEffect(() => {
    setExecStatus("loading");
    api
      .getWorkoutExecutions()
      .then((data) => {
        setExecutions(data);
        setExecStatus("idle");
      })
      .catch((err) => {
        if (err?.status === 403) {
          setExecutions([]);
          setExecStatus("idle");
          return;
        }
        setExecError(err.message);
        setExecStatus("error");
      });
  }, []);

  useEffect(() => {
    if (!athleteId) {
      setAthleteName(null);
      return;
    }
    api
      .getUser(athleteId)
      .then((user) => setAthleteName(user.name))
      .catch(() => setAthleteName(null));
  }, [athleteId]);

  const uniqueStrings = (items: (string | null | undefined)[]) => {
    const seen = new Set<string>();
    return items
      .filter(Boolean)
      .map((s) => s as string)
      .reduce<string[]>((acc, val) => {
        const key = val.toLowerCase();
        if (seen.has(key)) return acc;
        seen.add(key);
        acc.push(val);
        return acc;
      }, [])
      .sort((a, b) => a.localeCompare(b));
  };

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

  const primaryResult = (execution: WorkoutExecution) => {
    const total = typeof execution.total_time_seconds === "number" ? execution.total_time_seconds : null;
    if (total && total > 0) return `Tiempo ${formatSeconds(total)}`;
    const meta = (execution.execution_meta ?? {}) as Record<string, unknown>;
    const scoreRaw = meta.score ?? meta.total_score;
    const repsRaw = meta.reps ?? meta.total_reps;
    if (typeof scoreRaw === "number") return `Score ${scoreRaw}`;
    if (typeof repsRaw === "number") return `Reps ${repsRaw}`;
    return "Resultado no disponible";
  };

  const domains = useMemo(() => uniqueStrings(workouts.map((w) => w.domain)), [workouts]);
  const intensities = useMemo(() => uniqueStrings(workouts.map((w) => w.intensity)), [workouts]);
  const hyroxStations = useMemo(
    () => uniqueStrings(workouts.flatMap((w) => w.hyrox_stations?.map((h) => h.station) ?? [])),
    [workouts]
  );

  const filtered = useMemo(() => {
    return workouts
      .filter((workout) => (filters.domain ? workout.domain === filters.domain : true))
      .filter((workout) => (filters.intensity ? workout.intensity === filters.intensity : true))
      .filter((workout) =>
        filters.hyrox ? workout.hyrox_stations?.some((station) => station.station === filters.hyrox) : true
      )
      .filter((workout) =>
        search ? `${workout.title} ${workout.description}`.toLowerCase().includes(search.toLowerCase()) : true
      )
      .sort((a, b) => (b.avg_rating ?? 0) - (a.avg_rating ?? 0));
  }, [workouts, filters, search]);

  const completedFiltered = useMemo(() => {
    if (historyRange === "all") return executions;
    const now = new Date();
    const cutoff = new Date(now);
    if (historyRange === "2w") {
      cutoff.setDate(now.getDate() - 14);
    } else {
      cutoff.setMonth(now.getMonth() - 1);
    }
    return executions.filter((exec) => {
      if (!exec.executed_at) return false;
      const date = new Date(exec.executed_at);
      return !Number.isNaN(date.getTime()) && date >= cutoff;
    });
  }, [executions, historyRange]);

  const renderTags = (workout: Workout) => {
    const tags = uniqueStrings([workout.domain, workout.intensity, workout.hyrox_transfer, ...(workout.muscles ?? [])]).slice(
      0,
      4
    );
    return (
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-300">
        {tags.map((tag, idx) => (
          <span key={`${tag.toLowerCase()}-${idx}`} className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
            {tag}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="inline-flex rounded-2xl border border-white/10 bg-slate-900/70 p-1 text-sm text-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab("available")}
          className={`rounded-2xl px-4 py-2 transition ${
            activeTab === "available" ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"
          }`}
        >
          Disponibles
          <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-xs">{workouts.length}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("completed")}
          className={`rounded-2xl px-4 py-2 transition ${
            activeTab === "completed" ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"
          }`}
        >
          Realizados
          <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-xs">{executions.length}</span>
        </button>
      </div>

      {activeTab === "available" && (
        <>
          <Section>
            <div className="grid gap-3 md:grid-cols-4">
              <input
                placeholder="Buscador"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-white placeholder:text-slate-500"
              />
              <select
                value={filters.domain}
                onChange={(event) => setFilters((prev) => ({ ...prev, domain: event.target.value }))}
                className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-white"
              >
                <option value="">Dominio</option>
                {domains.map((domain) => (
                  <option key={domain.toLowerCase()} value={domain}>
                    {domain}
                  </option>
                ))}
              </select>
              <select
                value={filters.intensity}
                onChange={(event) => setFilters((prev) => ({ ...prev, intensity: event.target.value }))}
                className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-white"
              >
                <option value="">Intensidad</option>
                {intensities.map((item) => (
                  <option key={item.toLowerCase()} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <select
                value={filters.hyrox}
                onChange={(event) => setFilters((prev) => ({ ...prev, hyrox: event.target.value }))}
                className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-white"
              >
                <option value="">Estacion HYROX</option>
                {hyroxStations.map((station) => (
                  <option key={station.toLowerCase()} value={station}>
                    {station}
                  </option>
                ))}
              </select>
            </div>
          </Section>

          {effectiveRole === "COACH" && athleteId && (
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-slate-200">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Asignar test</p>
                  <p className="text-sm text-white">
                    Atleta: <span className="font-semibold">{athleteName ?? `#${athleteId}`}</span>
                  </p>
                </div>
                <Link href={`/coach/workouts/new?athleteId=${athleteId}`} className="text-xs font-semibold text-cyan-300">
                  Crear test en builder
                </Link>
              </div>
              {assignMessage && <p className="mt-2 text-xs text-emerald-200">{assignMessage}</p>}
            </div>
          )}

          {status === "error" && (
            <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
              Error al cargar los workouts: {error}
            </div>
          )}

          {filtered.length === 0 && status === "idle" && (
            <p className="text-sm text-slate-400">No se encontraron WODs con estos filtros.</p>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            {filtered.map((workout) => {
              const typeHint = workout.wod_type?.toLowerCase() ?? "";
              const tone: keyof typeof statTone = typeHint.includes("strength")
                ? "strength"
                : typeHint.includes("cardio")
                  ? "cardio"
                  : "hybrid";
              return (
                <Card key={workout.id} className="bg-slate-900/70 ring-1 ring-white/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{workout.wod_type}</p>
                      <h3 className="text-xl font-semibold text-white">{workout.title}</h3>
                      <p className="mt-1 text-sm text-slate-300">{workout.description}</p>
                    </div>
                    <div className="text-right text-sm text-slate-400 space-y-1">
                      <p>XP: {workout.xp_estimate ?? "-"}</p>
                      <p>{workout.avg_difficulty ? `${workout.avg_difficulty.toFixed(1)} KP` : "KP: -"}</p>
                      <p>{workout.avg_rating ? `${workout.avg_rating.toFixed(1)} *` : "Rating: -"}</p>
                    </div>
                  </div>
                  {renderTags(workout)}
                  <div className="mt-4 flex items-center justify-between text-sm text-slate-300">
                    <span>Dificultad: {workout.estimated_difficulty ?? "N/A"}</span>
                    <span className={`text-xs font-semibold ${statTone[tone]}`}>{tone.toUpperCase()}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <Link href={`${basePath}/${workout.id}`} className="text-sm font-semibold text-cyan-300">
                      Ver detalle
                    </Link>
                    {effectiveRole === "COACH" && athleteId ? (
                      <button
                        className="text-xs font-semibold text-slate-200"
                        type="button"
                        onClick={async () => {
                          if (typeof window === "undefined") return;
                          const shareUrl = `${window.location.origin}/athlete/workouts/${workout.id}`;
                          try {
                            await navigator.clipboard.writeText(shareUrl);
                            setAssignMessage(`Enlace copiado para asignar "${workout.title}".`);
                          } catch {
                            setAssignMessage("No se pudo copiar el enlace.");
                          }
                        }}
                      >
                        Asignar test
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400">
                        {workout.avg_time_seconds ? `${Math.round(workout.avg_time_seconds / 60)} min` : "Tiempo s/n"}
                      </span>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {activeTab === "completed" && (
        <>
          <Section title="Workouts realizados" description="Historico inmutable de tus ejecuciones completadas.">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-300">Filtra por fecha para revisar tus resultados recientes.</p>
              <select
                value={historyRange}
                onChange={(event) => setHistoryRange(event.target.value as "2w" | "1m" | "all")}
                className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-white"
              >
                <option value="2w">Ultimas 2 semanas</option>
                <option value="1m">Ultimo mes</option>
                <option value="all">Todo</option>
              </select>
            </div>
          </Section>

          {execStatus === "error" && (
            <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
              Error al cargar los workouts realizados: {execError}
            </div>
          )}

          {execStatus === "loading" && <p className="text-sm text-slate-400">Cargando historial...</p>}

          {completedFiltered.length === 0 && execStatus === "idle" && (
            <p className="text-sm text-slate-400">Aun no tienes workouts completados en este periodo.</p>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            {completedFiltered.map((execution) => {
              const tagList = uniqueStrings([
                execution.workout?.domain,
                execution.workout?.intensity,
                ...(execution.workout?.hyrox_stations?.map((station) => station.station) ?? [])
              ]).slice(0, 4);
              return (
                <Card key={execution.id} className="bg-slate-900/70 ring-1 ring-white/5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Completado</p>
                      <h3 className="text-xl font-semibold text-white">{execution.workout?.title ?? "Workout"}</h3>
                      <p className="mt-1 text-sm text-slate-300">{formatDate(execution.executed_at)}</p>
                    </div>
                    <div className="text-right text-sm text-slate-300">
                      <p className="font-semibold text-white">{primaryResult(execution)}</p>
                      <p className="text-xs text-slate-500">ID #{execution.id}</p>
                    </div>
                  </div>
                  {tagList.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-300">
                      {tagList.map((tag, idx) => (
                        <span
                          key={`${tag?.toString().toLowerCase()}-${idx}`}
                          className="rounded-full border border-white/10 bg-white/5 px-3 py-1"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="mt-4 flex items-center justify-between text-sm text-slate-300">
                    <Link href={`${completedBasePath}/${execution.id}`} className="text-sm font-semibold text-cyan-300">
                      Ver detalle
                    </Link>
                    {execution.notes && <span className="text-xs text-slate-500">Notas: {execution.notes}</span>}
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}


