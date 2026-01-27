"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Card, Section, Button } from "@thrifty/ui";
import { api } from "../../lib/api";
import type { LookupItem, LookupTables } from "../../lib/types";

type DbField = {
  name: string;
  type: string;
  description?: string;
  pk?: boolean;
  fk?: string;
  calculated?: boolean;
  formula?: string;
};

type DbTable = {
  name: string;
  description?: string;
  fields: DbField[];
};

type Metric = {
  key: string;
  label: string;
  sourceTable: string;
  type: string;
  calculated?: boolean;
  formula?: string;
  usedBy: string[];
  inImpact?: boolean;
};

type CalculatedMetric = {
  name: string;
  formula: string;
  inputs: string[];
  screens: string[];
  dependsOnCatalogs?: string[];
};

type UsageMap = {
  screen: string;
  uses: string[];
  components: string[];
};

const pill =
  "inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-200";

const dbTables: DbTable[] = [
  {
    name: "users",
    description: "Usuarios de la plataforma",
    fields: [
      { name: "id", type: "int", pk: true },
      { name: "name", type: "string" },
      { name: "email", type: "string" },
      { name: "athlete_level_id", type: "fk", fk: "athlete_levels.id" }
    ]
  },
  {
    name: "athlete_levels",
    description: "Niveles de progresion y XP",
    fields: [
      { name: "id", type: "int", pk: true },
      { name: "code", type: "string" },
      { name: "name", type: "string" },
      { name: "sort_order", type: "int" }
    ]
  },
  {
    name: "workouts",
    description: "Entrenamientos con metadatos HYROX/CrossFit",
    fields: [
      { name: "id", type: "int", pk: true },
      { name: "title", type: "string" },
      { name: "description", type: "text" },
      { name: "domain_id", type: "fk", fk: "energy_domains.id" },
      { name: "intensity_level_id", type: "fk", fk: "intensity_levels.id" },
      { name: "hyrox_transfer_level_id", type: "fk", fk: "intensity_levels.id" },
      { name: "wod_type", type: "string" },
      { name: "volume_total", type: "string" },
      { name: "work_rest_ratio", type: "string" },
      { name: "dominant_stimulus", type: "string" },
      { name: "load_type", type: "string" },
      { name: "estimated_difficulty", type: "number" },
      { name: "main_muscle_group_id", type: "fk", fk: "muscle_groups.id" },
      { name: "official_tag", type: "string" },
      { name: "session_load", type: "string" },
      { name: "session_feel", type: "string" },
      { name: "avg_time_seconds", type: "number" },
      { name: "avg_rating", type: "number" },
      { name: "avg_difficulty", type: "number" }
    ]
  },
  {
    name: "workout_blocks",
    description: "Bloques de cada workout",
    fields: [
      { name: "id", type: "int", pk: true },
      { name: "workout_id", type: "fk", fk: "workouts.id" },
      { name: "position", type: "int" },
      { name: "block_type", type: "string" },
      { name: "title", type: "string" },
      { name: "description", type: "text" },
      { name: "duration_seconds", type: "int" },
      { name: "rounds", type: "int" },
      { name: "notes", type: "text" }
    ]
  },
  {
    name: "workout_block_movements",
    description: "Movimientos dentro de cada bloque",
    fields: [
      { name: "id", type: "int", pk: true },
      { name: "workout_block_id", type: "fk", fk: "workout_blocks.id" },
      { name: "movement_id", type: "fk", fk: "movements.id" },
      { name: "position", type: "int" },
      { name: "reps", type: "int" },
      { name: "load", type: "number" },
      { name: "load_unit", type: "string" },
      { name: "distance_meters", type: "number" },
      { name: "duration_seconds", type: "number" },
      { name: "calories", type: "number" }
    ]
  },
  {
    name: "movements",
    description: "Catálogo de movimientos con grupos musculares",
    fields: [
      { name: "id", type: "int", pk: true },
      { name: "name", type: "string" },
      { name: "category", type: "string" },
      { name: "default_load_unit", type: "string" }
    ]
  },
  {
    name: "athlete_capacity_profile",
    description: "Capacidades primarias del atleta",
    fields: [
      { name: "id", type: "int", pk: true },
      { name: "user_id", type: "fk", fk: "users.id" },
      { name: "capacity_id", type: "fk", fk: "physical_capacities.id" },
      { name: "value", type: "number" },
      { name: "measured_at", type: "datetime" }
    ]
  },
  {
    name: "athlete_skills",
    description: "Skills por movimiento",
    fields: [
      { name: "id", type: "int", pk: true },
      { name: "user_id", type: "fk", fk: "users.id" },
      { name: "movement_id", type: "fk", fk: "movements.id" },
      { name: "skill_score", type: "number" },
      { name: "note", type: "string" },
      { name: "measured_at", type: "datetime" }
    ]
  },
  {
    name: "athlete_biometrics",
    description: "HR/VO2/HRV y fatiga del atleta",
    fields: [
      { name: "id", type: "int", pk: true },
      { name: "user_id", type: "fk", fk: "users.id" },
      { name: "hr_rest", type: "number" },
      { name: "hr_avg", type: "number" },
      { name: "hr_max", type: "number" },
      { name: "vo2_est", type: "number" },
      { name: "hrv", type: "number" },
      { name: "sleep_hours", type: "number" },
      { name: "fatigue_score", type: "number" },
      { name: "recovery_time_hours", type: "number" }
    ]
  },
  {
    name: "athlete_training_load",
    description: "Carga aguda/crónica",
    fields: [
      { name: "id", type: "int", pk: true },
      { name: "user_id", type: "fk", fk: "users.id" },
      { name: "load_date", type: "date" },
      { name: "acute_load", type: "number" },
      { name: "chronic_load", type: "number" },
      { name: "load_ratio", type: "number" }
    ]
  },
  {
    name: "athlete_prs",
    description: "Personal records por movimiento",
    fields: [
      { name: "id", type: "int", pk: true },
      { name: "user_id", type: "fk", fk: "users.id" },
      { name: "movement_id", type: "fk", fk: "movements.id" },
      { name: "pr_type", type: "string" },
      { name: "value", type: "number" },
      { name: "unit", type: "string" },
      { name: "achieved_at", type: "datetime" }
    ]
  },
  {
    name: "workout_stats",
    description: "Stats globales de cada workout",
    fields: [
      { name: "workout_id", type: "fk", pk: true, fk: "workouts.id" },
      { name: "estimated_difficulty", type: "number" },
      { name: "avg_time_seconds", type: "number" },
      { name: "avg_rating", type: "number" },
      { name: "avg_difficulty", type: "number" },
      { name: "rating_count", type: "number" }
    ]
  },
  {
    name: "workout_level_times",
    description: "Tiempo estimado por nivel",
    fields: [
      { name: "id", type: "int", pk: true },
      { name: "workout_id", type: "fk", fk: "workouts.id" },
      { name: "athlete_level", type: "string" },
      { name: "time_minutes", type: "number" },
      { name: "time_range", type: "string" }
    ]
  },
  {
    name: "workout_capacities",
    description: "Capacidades objetivo del WOD",
    fields: [
      { name: "id", type: "int", pk: true },
      { name: "workout_id", type: "fk", fk: "workouts.id" },
      { name: "capacity", type: "string" },
      { name: "value", type: "number" },
      { name: "note", type: "string" }
    ]
  },
  {
    name: "workout_hyrox_stations",
    description: "Transferencia por estación HYROX",
    fields: [
      { name: "id", type: "int", pk: true },
      { name: "workout_id", type: "fk", fk: "workouts.id" },
      { name: "station", type: "string" },
      { name: "transfer_pct", type: "number" }
    ]
  },
  {
    name: "equipment",
    description: "Equipo asociado a workouts",
    fields: [
      { name: "id", type: "int", pk: true },
      { name: "name", type: "string" },
      { name: "category", type: "string" },
      { name: "price", type: "number" }
    ]
  },
  {
    name: "achievements",
    description: "Logros y recompensas XP",
    fields: [
      { name: "id", type: "int", pk: true },
      { name: "code", type: "string" },
      { name: "name", type: "string" },
      { name: "description", type: "text" },
      { name: "xp_reward", type: "number" }
    ]
  },
  {
    name: "missions",
    description: "Misiones con progreso",
    fields: [
      { name: "id", type: "int", pk: true },
      { name: "type", type: "string" },
      { name: "title", type: "string" },
      { name: "description", type: "text" },
      { name: "xp_reward", type: "number" },
      { name: "condition_json", type: "json" }
    ]
  }
];

const athleteMetrics: Metric[] = [
  { key: "resistencia", label: "Resistencia", sourceTable: "athlete_capacity_profile", type: "number", usedBy: ["AthleteImpact", "WorkoutDetail"], inImpact: true },
  { key: "fuerza", label: "Fuerza", sourceTable: "athlete_capacity_profile", type: "number", usedBy: ["AthleteImpact"], inImpact: true },
  { key: "metcon", label: "Metcon", sourceTable: "athlete_capacity_profile", type: "number", usedBy: ["AthleteImpact"], inImpact: true },
  { key: "gimnasticos", label: "Gimnasticos", sourceTable: "athlete_capacity_profile", type: "number", usedBy: ["AthleteImpact"], inImpact: true },
  { key: "velocidad", label: "Velocidad", sourceTable: "athlete_capacity_profile", type: "number", usedBy: ["AthleteImpact"], inImpact: true },
  { key: "carga_muscular", label: "Carga muscular / Piernas", sourceTable: "athlete_capacity_profile", type: "number", usedBy: ["AthleteImpact"], inImpact: true },
  { key: "core", label: "Core", sourceTable: "athlete_capacity_profile", type: "number", usedBy: ["AthleteImpact"], inImpact: true },
  { key: "wallball_skill", label: "WallBall Skill", sourceTable: "athlete_skills", type: "number", usedBy: ["AthleteImpact"], inImpact: true },
  { key: "hr_rest", label: "FC reposo", sourceTable: "athlete_biometrics", type: "number", usedBy: ["AthleteImpact", "AthletePage"] },
  { key: "hr_avg", label: "FC media", sourceTable: "athlete_biometrics", type: "number", usedBy: ["AthletePage"] },
  { key: "hr_max", label: "FC maxima", sourceTable: "athlete_biometrics", type: "number", usedBy: ["AthletePage"] },
  { key: "vo2_est", label: "VO2 estimado", sourceTable: "athlete_biometrics", type: "number", usedBy: ["AthletePage", "AthleteImpact"] },
  { key: "hrv", label: "HRV", sourceTable: "athlete_biometrics", type: "number", usedBy: ["AthletePage"] },
  { key: "sleep_hours", label: "Horas sueno", sourceTable: "athlete_biometrics", type: "number", usedBy: ["AthletePage"] },
  { key: "fatigue_score", label: "Fatiga actual", sourceTable: "athlete_biometrics", type: "number", usedBy: ["AthleteImpact", "AthletePage"], calculated: false },
  { key: "recovery_time_hours", label: "Recuperacion", sourceTable: "athlete_biometrics", type: "number", usedBy: ["AthletePage"] },
  { key: "acute_load", label: "Carga aguda", sourceTable: "athlete_training_load", type: "number", usedBy: ["AthleteImpact", "AthletePage"] },
  { key: "chronic_load", label: "Carga cronica", sourceTable: "athlete_training_load", type: "number", usedBy: ["AthletePage"] },
  { key: "load_ratio", label: "Load ratio", sourceTable: "athlete_training_load", type: "number", usedBy: ["AthleteImpact", "AthletePage"] }
];

const calculatedMetrics: CalculatedMetric[] = [
  {
    name: "fatiga_estimada",
    formula: "estimate_fatigue_score(workout) = estimated_difficulty * intensidad_factor * dominio_factor + hyrox_weight*2",
    inputs: ["workouts.estimated_difficulty", "intensity_levels", "energy_domains", "workout_hyrox_stations"],
    screens: ["WorkoutDetail", "WodAnalysis", "AthleteImpact"],
    dependsOnCatalogs: ["intensity_levels", "energy_domains"]
  },
  {
    name: "hyrox_transfer",
    formula: "mean(hyrox_stations.transfer_pct) / 10",
    inputs: ["workout_hyrox_stations.transfer_pct"],
    screens: ["WorkoutDetail", "WodAnalysis"]
  },
  {
    name: "capacity_focus",
    formula: "top 3 workout_capacities ordered by value",
    inputs: ["workout_capacities"],
    screens: ["WorkoutDetail", "WodAnalysis"]
  },
  {
    name: "pacing_recommendation",
    formula: "fastest.level_time + slowest.level_time -> range/tip",
    inputs: ["workout_level_times"],
    screens: ["WorkoutDetail", "WodAnalysis"]
  },
  {
    name: "athlete_impact_leg_load",
    formula: "heuristica por grupos musculares en bloques (piernas/core/wall balls)",
    inputs: ["workout_blocks.movements.muscles"],
    screens: ["AthleteImpact"],
    dependsOnCatalogs: ["muscle_groups"]
  }
];

const usageMap: UsageMap[] = [
  {
    screen: "WorkoutDetail",
    uses: [
      "workouts.domain/intensity/hyrox_transfer",
      "workout_capacities",
      "workout_level_times",
      "workout_blocks & movements",
      "workout_hyrox_stations",
      "workout_stats.avg_time_seconds/avg_rating"
    ],
    components: ["WorkoutDetailLayout", "AthleteImpact", "BarLevelChart"]
  },
  {
    screen: "WodAnalysis",
    uses: ["workouts.*", "workout_analysis (fatigue_score, capacity_focus, pacing)", "workout_blocks", "athlete_profile"],
    components: ["WorkoutDetailLayout", "AthleteImpact"]
  },
  {
    screen: "AthleteImpact",
    uses: ["athlete_profile.capacities", "athlete_biometrics", "athlete_training_load", "athlete_skills (WallBall)"],
    components: ["AthleteImpact component"]
  },
  {
    screen: "AthletePage",
    uses: ["athlete_profile (capacities, biometrics, training_load, skills, prs, benchmarks)"],
    components: ["AthleteRadar", "FatigueStatus", "MetricsPRs", "BenchmarkSummary"]
  }
];

function matchesQuery(text: string, query: string) {
  if (!query) return true;
  return text.toLowerCase().includes(query.toLowerCase());
}

function TableCard({ table, query }: { table: DbTable; query: string }) {
  const fields = table.fields.filter((f) => matchesQuery(`${f.name} ${f.type} ${f.fk ?? ""}`, query));
  if (!fields.length && query) return null;
  return (
    <details className="group rounded-2xl border border-white/10 bg-gradient-to-br from-slate-950/80 via-slate-950/60 to-slate-900/70 p-4">
      <summary className="flex cursor-pointer items-start justify-between gap-2 text-white">
        <div>
          <p className="text-sm font-semibold">{table.name}</p>
          <p className="text-xs text-slate-400">{table.description ?? "No definida"}</p>
        </div>
        <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-slate-200">{table.fields.length} campos</span>
      </summary>
      <div className="mt-3 grid gap-2">
        {fields.map((field) => (
          <div
            key={field.name}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white shadow-[0_10px_30px_rgba(0,0,0,0.25)]"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold">{field.name}</span>
              <div className="flex flex-wrap gap-1 text-[11px]">
                {field.pk && <span className={pill}>PK</span>}
                {field.fk && <span className={pill}>FK → {field.fk}</span>}
                <span className={pill}>{field.type}</span>
                {field.calculated && <span className={pill}>Calculado</span>}
              </div>
            </div>
            <p className="text-xs text-slate-400">{field.description ?? "Descripcion no definida"}</p>
            {field.formula && <p className="text-[11px] text-amber-200">Formula: {field.formula}</p>}
          </div>
        ))}
      </div>
    </details>
  );
}

function CatalogCard({ label, hint, rows, query }: { label: string; hint?: string; rows: LookupItem[]; query: string }) {
  const filtered = rows.filter((item) => matchesQuery(`${item.name} ${item.code} ${item.description ?? ""}`, query));
  if (!filtered.length && query) return null;
  return (
    <Card className="h-full border border-white/10 bg-gradient-to-br from-slate-950/80 via-slate-950/60 to-slate-900/70 px-4 py-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
          {hint && <p className="text-[11px] text-slate-500">{hint}</p>}
        </div>
        <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white">{filtered.length}</span>
      </div>
      <div className="mt-3 space-y-2">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white shadow-[0_10px_30px_rgba(0,0,0,0.25)]"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold">{item.name}</span>
              <span className="rounded-full bg-slate-800 px-2 py-1 text-[11px] uppercase tracking-wide text-slate-200">{item.code}</span>
            </div>
            {item.description && <p className="text-xs text-slate-400">{item.description}</p>}
          </div>
        ))}
        {!filtered.length && <p className="text-sm text-slate-500">Sin registros.</p>}
      </div>
    </Card>
  );
}

function MetricCard({ metric }: { metric: Metric }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="font-semibold">{metric.label}</p>
          <p className="text-[11px] text-slate-400">{metric.key}</p>
        </div>
        <div className="flex flex-wrap gap-1 text-[11px]">
          <span className={pill}>{metric.type}</span>
          <span className={pill}>{metric.sourceTable}</span>
          {metric.calculated && <span className={pill}>Calculado</span>}
          {metric.inImpact && <span className={pill}>Impacto</span>}
        </div>
      </div>
      {metric.formula && <p className="text-[11px] text-amber-200">Formula: {metric.formula}</p>}
      <p className="text-xs text-slate-400">Pantallas: {metric.usedBy.join(", ") || "No usado"}</p>
    </div>
  );
}

export default function LookupsPage() {
  const [data, setData] = useState<LookupTables | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const load = () => {
    setLoading(true);
    setError(null);
    api
      .getLookupTables()
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const tableData = useMemo(
    () => dbTables.filter((t) => matchesQuery(`${t.name} ${t.description ?? ""}`, query)),
    [query]
  );

  const metricsFiltered = useMemo(
    () => athleteMetrics.filter((m) => matchesQuery(`${m.key} ${m.label} ${m.sourceTable}`, query)),
    [query]
  );

  const catalogRows = useMemo(
    () => [
      { label: "Athlete Levels", hint: "Progresion", rows: data?.athlete_levels ?? [] },
      { label: "Intensity", hint: "Baja/Media/Alta", rows: data?.intensity_levels ?? [] },
      { label: "Energy domains", hint: "Aerobico/Anaerobico/Mixto", rows: data?.energy_domains ?? [] },
      { label: "Capabilities", hint: "Capacidades fisicas", rows: data?.physical_capacities ?? [] },
      { label: "Muscle groups", hint: "Grupos musculares", rows: data?.muscle_groups ?? [] },
      { label: "Hyrox stations", hint: "Estaciones oficiales", rows: data?.hyrox_stations ?? [] }
    ],
    [data]
  );

  const extraCatalogs = useMemo(() => {
    if (!data) return [];
    const known = new Set([
      "athlete_levels",
      "intensity_levels",
      "energy_domains",
      "physical_capacities",
      "muscle_groups",
      "hyrox_stations"
    ]);
    return Object.entries(data as Record<string, LookupItem[]>)
      .filter(([key]) => !known.has(key))
      .map(([key, rows]) => ({ label: key, hint: "Catalogo extra", rows }));
  }, [data]);

  const missingMetrics = useMemo(() => {
    const dbKeys = new Set(athleteMetrics.map((m) => m.key));
    const frontUsed = ["core", "wallball_skill", "leg_load", "wb_skill", "resistance"];
    const missingInDb = frontUsed.filter((k) => !dbKeys.has(k));
    const unusedInFront = athleteMetrics.filter((m) => m.usedBy.length === 0).map((m) => m.key);
    const namingMismatches = ["resistance -> resistencia", "wb_skill -> wallball_skill", "leg_load -> carga_muscular"];
    return { missingInDb, unusedInFront, namingMismatches };
  }, []);

  return (
    <Section
      title="Data Dictionary + Metrics Hub"
      description="Tablas, catálogos, métricas y uso en frontend."
      className="space-y-6"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2 text-xs text-slate-300">
          <span className={pill}>Tablas: {dbTables.length}</span>
          <span className={pill}>Catalogos: {(catalogRows.length + extraCatalogs.length) || 0}</span>
          <span className={pill}>Metrics: {athleteMetrics.length}</span>
          {loading && <span className={pill}>Loading...</span>}
          {error && <span className="rounded-full bg-rose-500/15 px-3 py-1 text-[11px] font-semibold text-rose-100">Error: {error}</span>}
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            type="search"
            placeholder="Buscar tabla, campo o metrica"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-white placeholder:text-slate-500 md:w-96"
          />
          <Button variant="secondary" onClick={load} disabled={loading}>
            {loading ? "Actualizando..." : "Refrescar lookups"}
          </Button>
        </div>
      </div>

      <Section title="1. Tablas del sistema" className="space-y-3">
        <div className="grid gap-3 md:grid-cols-2">
          {tableData.map((table) => (
            <TableCard key={table.name} table={table} query={query} />
          ))}
        </div>
      </Section>

      <Section title="2. Catálogos y enums" className="space-y-3">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {[...catalogRows, ...extraCatalogs].map((catalog) => (
            <CatalogCard key={catalog.label} label={catalog.label} hint={catalog.hint} rows={catalog.rows} query={query} />
          ))}
        </div>
      </Section>

      <Section title="3. Métricas del atleta" className="space-y-3">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {metricsFiltered.map((metric) => (
            <MetricCard key={metric.key} metric={metric} />
          ))}
          {!metricsFiltered.length && <p className="text-sm text-slate-400">Sin métricas que coincidan con el filtro.</p>}
        </div>
      </Section>

      <Section title="4. Métricas calculadas (Formulas engine)" className="space-y-3">
        <div className="grid gap-3 md:grid-cols-2">
          {calculatedMetrics.map((metric) => (
            <Card
              key={metric.name}
              className="border border-white/10 bg-gradient-to-br from-slate-950/80 via-slate-950/60 to-slate-900/70 px-4 py-3 text-white"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{metric.name}</p>
                <span className={pill}>Calculada</span>
              </div>
              <p className="text-xs text-amber-200">Formula: {metric.formula}</p>
              <p className="text-xs text-slate-400">Inputs: {metric.inputs.join(", ")}</p>
              <p className="text-xs text-slate-400">Pantallas: {metric.screens.join(", ")}</p>
              {metric.dependsOnCatalogs && (
                <p className="text-[11px] text-slate-500">Depende de: {metric.dependsOnCatalogs.join(", ")}</p>
              )}
            </Card>
          ))}
        </div>
      </Section>

      <Section title="5. Mapa de uso en frontend" className="space-y-3">
        <div className="grid gap-3 md:grid-cols-2">
          {usageMap.map((usage) => (
            <Card key={usage.screen} className="border border-white/10 bg-gradient-to-br from-slate-950/80 via-slate-950/60 to-slate-900/70 px-4 py-3 text-white">
              <p className="text-sm font-semibold">{usage.screen}</p>
              <p className="text-xs text-slate-400">Componentes: {usage.components.join(", ")}</p>
              <ul className="mt-2 space-y-1 text-sm text-slate-200">
                {usage.uses.map((item) => (
                  <li key={item} className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs">
                    usa → {item}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </Section>

      <Section title="6. Inconsistencias detectadas" className="space-y-2">
        <Card className="border border-amber-200/30 bg-amber-200/10 px-4 py-3 text-sm text-amber-100">
          <p className="font-semibold">[INCONSISTENCIAS DETECTADAS]</p>
          <ul className="mt-2 space-y-1 list-disc list-inside">
            {missingMetrics.missingInDb.map((item) => (
              <li key={item}>Campo usado en front pero no existe en BD: {item} → sugerencia: añadir a athlete_metrics o skills.</li>
            ))}
            {missingMetrics.unusedInFront.map((item) => (
              <li key={item}>Campo en BD no usado en front: {item} → sugerencia: mapearlo en AthleteImpact o AthletePage.</li>
            ))}
            {missingMetrics.namingMismatches.map((item) => (
              <li key={item}>Nombres no estandarizados: {item}</li>
            ))}
            {!missingMetrics.missingInDb.length && !missingMetrics.unusedInFront.length && !missingMetrics.namingMismatches.length && (
              <li>No se detectaron inconsistencias con la información disponible.</li>
            )}
          </ul>
        </Card>
      </Section>
    </Section>
  );
}
