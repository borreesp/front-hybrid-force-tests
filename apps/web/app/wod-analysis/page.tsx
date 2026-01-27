"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Section, Button } from "@thrifty/ui";
import { HeroHeader } from "../../components/wod-analysis/HeroHeader";
import { UploadForm } from "../../components/wod-analysis/UploadForm";
import { BlocksEditor } from "../../components/wod-analysis/BlocksEditor";
import { AnalyzingOverlay, type Step } from "../../components/wod-analysis/AnalyzingOverlay";
import { api } from "../../lib/api";
import type { EditableWodBlock } from "../../components/wod/wod-types";
import type { Workout, WorkoutBlock, WorkoutBlockMovement, Movement } from "../../lib/types";
import { extractText } from "../../lib/wodOcr/ocrClient";

const shellClass =
  "rounded-3xl border border-white/5 bg-gradient-to-br from-slate-950/80 via-slate-950/60 to-slate-900/70 p-6 md:p-8 shadow-[0_14px_50px_rgba(0,0,0,0.55)]";

type DraftItem = {
  raw: string;
  movement_id?: number;
  unresolved_label?: string;
  reps?: number;
  distance_meters?: number;
  duration_seconds?: number;
  calories?: number;
  load?: number;
  load_unit?: string;
  is_max?: boolean;
};

type DraftScenario = {
  label: string;
  items: DraftItem[];
};

type DraftBlock = {
  block_type: string;
  rounds?: number;
  work_seconds?: number;
  rest_seconds?: number;
  scenarios: DraftScenario[];
};

type WorkoutDraft = {
  source_text: string;
  title?: string;
  detected: {
    workout_style: string;
    rounds?: number;
    work_seconds?: number;
    rest_seconds?: number;
    time_cap_seconds?: number;
  };
  blocks: DraftBlock[];
  unresolved?: Array<{ raw: string; suggestions?: Array<{ movement_id: number; name: string }> }>;
};

const formatSeconds = (value?: number | null) => {
  if (value === undefined || value === null) return "";
  const minutes = Math.floor(value / 60);
  const seconds = Math.round(value % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}`;
};

const buildVolumeLabel = (block: WorkoutBlock, movement?: WorkoutBlockMovement | null) => {
  const parts: string[] = [];
  if (block.rounds) parts.push(`${block.rounds}r`);
  if (movement?.reps) parts.push(`${movement.reps} reps`);
  if (movement?.distance_meters) parts.push(`${movement.distance_meters} m`);
  if (movement?.calories) parts.push(`${movement.calories} cal`);
  if (movement?.duration_seconds) parts.push(`${movement.duration_seconds} s`);
  else if (block.duration_seconds) parts.push(`${block.duration_seconds} s`);
  return parts.join(" | ") || block.description || "Volumen por definir";
};

const buildLoadLabel = (movement?: WorkoutBlockMovement | null) => {
  if (!movement) return "BW";
  if (movement.load) return `${movement.load}${movement.load_unit ?? ""}`.trim();
  if (movement.load_unit) return movement.load_unit;
  return "BW";
};

const formatSecondsCompact = (value?: number | null) => {
  if (!value) return "";
  const minutes = Math.floor(value / 60);
  const seconds = Math.round(value % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}`;
};

const movementVolume = (mv: DraftItem) => {
  const parts: string[] = [];
  if (mv.reps) parts.push(`${mv.reps} reps`);
  if (mv.distance_meters) parts.push(`${mv.distance_meters} m`);
  if (mv.calories) parts.push(`${mv.calories} cal`);
  if (mv.duration_seconds) parts.push(`${mv.duration_seconds} s`);
  return parts.join(" | ");
};

const parsedToEditableBlocks = (parsed: WorkoutDraft, movements: Movement[]): EditableWodBlock[] => {
  const findName = (mv: DraftItem) => {
    if (mv.movement_id) {
      const found = movements.find((m) => m.id === mv.movement_id);
      if (found) return found.name;
    }
    return mv.unresolved_label || mv.raw || "Movimiento";
  };

  const result: EditableWodBlock[] = [];
  parsed.blocks.forEach((block, blockIndex) => {
    const baseTitle = block.block_type || `Bloque ${blockIndex + 1}`;
    block.scenarios.forEach((scenario, sIdx) => {
      scenario.items.forEach((mv, mvIdx) => {
        const exercise = `${findName(mv)}${scenario.label !== "A" ? ` (${scenario.label})` : ""}`;
        const volume = movementVolume(mv) || baseTitle;
        const load = mv.load ? `${mv.load}${mv.load_unit ? ` ${mv.load_unit}` : ""}` : "Por definir";
        const time =
          mv.duration_seconds || block.work_seconds
            ? formatSecondsCompact(mv.duration_seconds ?? block.work_seconds)
            : undefined;
        result.push({
          id: `p-${blockIndex}-${sIdx}-${mvIdx}`,
          exercise,
          volume,
          load,
          time,
          note: block.block_type
        });
      });
    });
  });
  return result;
};

const adaptWorkoutToEditableBlocks = (workout: Workout): EditableWodBlock[] => {
  const mapped: EditableWodBlock[] = [];
  (workout.blocks ?? []).forEach((block, blockIdx) => {
    if (block.movements?.length) {
      block.movements.forEach((mv, mvIdx) => {
        mapped.push({
          id: `ref-${block.id ?? blockIdx}-${mv.id ?? mvIdx}`,
          exercise: mv.movement?.name || block.title || `Ejercicio ${blockIdx + 1}-${mvIdx + 1}`,
          volume: buildVolumeLabel(block, mv),
          load: buildLoadLabel(mv),
          time: formatSeconds(mv.duration_seconds ?? block.duration_seconds),
          note: block.notes || block.description || undefined
        });
      });
    } else {
      mapped.push({
        id: `ref-${block.id ?? blockIdx}`,
        exercise: block.title || `Bloque ${blockIdx + 1}`,
        volume: block.description || "Sin detalle",
        load: "BW",
        time: formatSeconds(block.duration_seconds),
        note: block.notes || undefined
      });
    }
  });
  return mapped;
};

const buildReferencePreview = (workout: Workout) => {
  const title = workout.title || "WOD seleccionado";
  const description = (workout.description || "").slice(0, 120);
  return (
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg width="640" height="360" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
            <stop stop-color="#22d3ee" offset="0"/>
            <stop stop-color="#a855f7" offset="0.7"/>
            <stop stop-color="#0ea5e9" offset="1"/>
          </linearGradient>
        </defs>
        <rect width="640" height="360" rx="28" fill="url(#g)"/>
        <text x="36" y="96" font-family="Inter, sans-serif" font-size="30" fill="#0f172a" font-weight="700">${title}</text>
        <text x="36" y="140" font-family="Inter, sans-serif" font-size="16" fill="#0f172a" font-weight="500">${description}</text>
      </svg>`
    )
  );
};

export default function WodAnalysisUploadPage() {
  const router = useRouter();
  const [draftBlocks, setDraftBlocks] = useState<EditableWodBlock[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [selectedReferenceWodId, setSelectedReferenceWodId] = useState<string>("");
  const [referenceMessage, setReferenceMessage] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [ocrText, setOcrText] = useState<string | null>(null);
  const [ocrWarnings, setOcrWarnings] = useState<string[]>([]);
  const [ocrStatus, setOcrStatus] = useState<string | null>(null);
  const [ocrMeta, setOcrMeta] = useState<{ mode: string; confidence?: number; filename?: string | null; size_bytes?: number | null } | null>(null);
  const [parsedDraft, setParsedDraft] = useState<WorkoutDraft | null>(null);

  useEffect(() => {
    api
      .getWorkouts()
      .then((list) => {
        setWorkouts(list);
        if (list.length) {
          setSelectedReferenceWodId(list[0].id.toString());
          setReferenceMessage(null);
        } else {
          setReferenceMessage("No hay WODs disponibles para usar como referencia.");
        }
      })
      .catch(() => {
        setWorkouts([]);
      setReferenceMessage("No se pudieron cargar los WODs de referencia.");
    });
  }, []);

  useEffect(() => {
    api
      .getMovements()
      .then(setMovements)
      .catch(() => setMovements([]));
  }, []);

  useEffect(() => {
    if (!isAnalyzing) return;
    setStepIndex(0);
    const id = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % 3);
    }, 900);
    return () => clearInterval(id);
  }, [isAnalyzing]);

  const handleParsed = (payload: { imageUrl: string; blocks: EditableWodBlock[]; text?: string; warnings?: string[] }) => {
    setReferenceMessage(null);
    if (payload.text) setOcrText(payload.text);
    setOcrWarnings(payload.warnings ?? []);
    setDraftBlocks(payload.blocks);
  };

  const analyzeSteps = useMemo<Step[]>(
    () => [
      { label: "Interpretando bloques y volumen", status: stepIndex > 0 ? "done" : "active" },
      { label: "Calculando carga, pacing y capacidades", status: stepIndex > 1 ? "done" : stepIndex === 1 ? "active" : "pending" },
      { label: "Preparando dashboards y HYROX transfer", status: stepIndex === 2 ? "active" : "pending" }
    ],
    [stepIndex]
  );

  const parseSteps: Step[] = [
    {
      label: "Procesando OCR",
      status: isParsing ? (ocrStatus?.includes("OCR") ? "active" : ocrStatus ? "done" : "active") : "done"
    },
    {
      label: "Interpretando entrenamiento",
      status: isParsing && ocrStatus?.includes("Interpretando") ? "active" : ocrStatus === "Listo" ? "done" : isParsing ? "pending" : "done"
    },
    {
      label: "Preparando bloques",
      status: isParsing && ocrStatus?.includes("Preparando") ? "active" : ocrStatus === "Listo" ? "done" : isParsing ? "pending" : "done"
    }
  ];

  const handleProcessFile = async (file: File) => {
    setIsParsing(true);
    setOcrStatus("Procesando OCR...");
    setOcrText(null);
    setOcrWarnings([]);
    setOcrMeta(null);
    setParsedDraft(null);
    try {
      const ocr = await extractText(file);
      setOcrText(ocr.text);
      setOcrMeta({
        mode: ocr.mode,
        confidence: ocr.confidence ?? undefined,
        filename: ocr.source?.filename,
        size_bytes: ocr.source?.size_bytes
      });
      if (ocr.warning) {
        setOcrWarnings([ocr.warning]);
      }
      setOcrStatus("Interpretando entrenamiento...");
      const parsed = await api.parseWodDraft(ocr.text);
      setParsedDraft(parsed as WorkoutDraft);
      const editable = parsedToEditableBlocks(parsed as WorkoutDraft, movements);
      setDraftBlocks(editable);
      const unresolvedMsgs = (parsed as WorkoutDraft).unresolved?.length
        ? (parsed as WorkoutDraft).unresolved?.map((u) => `Sin resolver: ${u.raw}`)
        : [];
      setOcrWarnings((prev) => [...prev, ...(unresolvedMsgs || []), ...(ocr.warning ? [ocr.warning] : [])]);
      setOcrStatus("Listo");
      return { blocks: editable, text: ocr.text, warnings: unresolvedMsgs };
    } catch (err) {
      setOcrWarnings(["No pudimos procesar la imagen."]);
      setOcrStatus("Error");
      console.error("[wod-analysis] OCR error", err);
      return { blocks: [], text: "", warnings: ["No pudimos procesar la imagen."] };
    } finally {
      setIsParsing(false);
    }
  };

  const handleUseReferenceWod = async () => {
    if (!selectedReferenceWodId) {
      setReferenceMessage("Selecciona un WOD de referencia.");
      return;
    }
    setReferenceMessage(null);
    try {
      const workout = await api.getWorkoutStructure(selectedReferenceWodId);
      const blocks = adaptWorkoutToEditableBlocks(workout);
      if (!blocks.length) {
        setReferenceMessage("El WOD seleccionado no tiene bloques estructurados.");
        return;
      }
      return { imageUrl: buildReferencePreview(workout), blocks };
    } catch (err) {
      console.error(err);
      setReferenceMessage("No se pudo cargar el WOD seleccionado.");
      return;
    }
  };

  const handleAnalyze = async (_formData: {
    title: string;
    date: string;
    duration: string;
    effort: string;
    stimulus: string;
    tags: string[];
    blocks: EditableWodBlock[];
  }) => {
    if (!selectedReferenceWodId) {
      setReferenceMessage("Selecciona un WOD de referencia antes de analizar.");
      return;
    }
    setReferenceMessage(null);
    const targetId = selectedReferenceWodId;
    setIsAnalyzing(true);
    try {
      const analysis = await api.getWorkoutAnalysis(targetId);
      const redirectId = (analysis as any)?.workout_id ?? targetId;
      router.push(`/wod-analysis/result/${redirectId}`);
    } catch (err) {
      console.error(err);
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-8">
      <HeroHeader
        title="Analiza tu WOD con inteligencia híbrida"
        subtitle="Sube tu entrenamiento y nuestro motor lo dividirá en bloques, calculará la carga y te dará recomendaciones de pacing y capacidades."


      />

      <Section
        id="wod-upload"
        title="Subida y preparación del WOD"
        description="Carga tu imagen, revisa los bloques detectados y lánzate al análisis completo."
        className={shellClass}
      >
        <UploadForm
          onParsed={handleParsed}
          onProcessingChange={(loading) => setIsParsing(loading)}
          onUseReferenceWod={handleUseReferenceWod}
          processFile={handleProcessFile}
          useReferenceDisabled={!selectedReferenceWodId}
          referenceMessage={referenceMessage}
          useReferenceLabel="Usar WOD seleccionado"
        />

        {(ocrStatus || ocrWarnings.length || ocrText) && (
          <Card className="border border-white/10 bg-slate-900/60 p-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Estado OCR</p>
                <p className="text-sm text-slate-200">{ocrStatus || "Listo"}</p>
                {ocrMeta && (
                  <p className="text-xs text-slate-400">
                    Fuente: {ocrMeta.filename ?? "sin nombre"}{" "}
                    {ocrMeta.size_bytes ? `(${Math.round(ocrMeta.size_bytes / 1024)} KB)` : ""} · confianza{" "}
                    {ocrMeta.confidence ? `${ocrMeta.confidence}` : "—"}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {ocrMeta?.mode && (
                  <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-slate-100">
                    {ocrMeta.mode === "real" ? "OCR real" : `OCR ${ocrMeta.mode}`}
                  </span>
                )}
                {ocrWarnings.length > 0 && (
                  <div className="flex flex-wrap gap-2 text-xs text-amber-200">
                    {ocrWarnings.map((warn, idx) => (
                      <span key={idx} className="rounded-full border border-amber-300/40 bg-amber-300/10 px-2 py-1">
                        {warn}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {ocrText && (
              <details className="mt-3">
                <summary className="cursor-pointer text-xs text-cyan-200">Ver texto detectado</summary>
                <pre className="mt-2 whitespace-pre-wrap rounded-xl bg-slate-950/70 p-3 text-[12px] text-slate-200">{ocrText}</pre>
              </details>
            )}
          </Card>
        )}

        {parsedDraft && (
          <div className="flex flex-wrap gap-3">
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                try {
                  localStorage.setItem(
                    "wod_builder_draft",
                    JSON.stringify({ parsed: parsedDraft, text: ocrText, ts: Date.now() })
                  );
                } catch (err) {
                  console.error("No se pudo guardar draft en localStorage", err);
                }
                router.push("/workouts/structure?draft=1");
              }}
            >
              Editar en Estructura
            </Button>
          </div>
        )}

        <Card className="bg-slate-900/70 ring-1 ring-white/10">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Selector de referencia</p>
              <p className="text-sm text-slate-200">Usa un WOD existente como referencia para el motor de analítica.</p>
            </div>
            <div className="flex flex-col gap-2 md:w-72">
              <label className="text-xs text-slate-400">WOD base</label>
              <select
                value={selectedReferenceWodId}
                onChange={(e) => {
                  setSelectedReferenceWodId(e.target.value);
                  setReferenceMessage(null);
                }}
                className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-white"
              >
                {workouts.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {draftBlocks.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Bloques detectados</p>
                <p className="text-sm text-slate-300">Edita reps, peso y tiempos antes de lanzar el análisis.</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setDraftBlocks([])}>
                Reiniciar
              </Button>
            </div>
            <BlocksEditor
              blocks={draftBlocks}
              onBlocksChange={setDraftBlocks}
              onAnalyze={handleAnalyze}
              isAnalyzing={isAnalyzing}
            />
          </div>
        )}
      </Section>

      <AnalyzingOverlay
        active={isParsing}
        title="Extrayendo bloques del entrenamiento"
        subtitle={ocrStatus ?? "Leyendo tu WOD"}
        steps={parseSteps}
      />
      <AnalyzingOverlay
        active={isAnalyzing}
        title="Analizando tu WOD"
        subtitle="Calculando intensidad, capacidades y pacing personalizado."
        steps={analyzeSteps}
      />
    </div>
  );
}

