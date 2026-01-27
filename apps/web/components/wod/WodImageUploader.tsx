"use client";
import React, { useMemo, useRef, useState } from "react";
import { Button, Card } from "@thrifty/ui";
import { motion } from "framer-motion";
import type { EditableWodBlock } from "./wod-types";

type ProcessingSource = "upload" | "reference" | null;

type Props = {
  onParsed: (payload: { imageUrl: string; blocks: EditableWodBlock[]; text?: string; warnings?: string[] }) => void;
  onProcessingChange?: (loading: boolean) => void;
  onUseReferenceWod?: () => Promise<{ imageUrl?: string | null; blocks: EditableWodBlock[] } | void>;
  processFile?: (file: File) => Promise<{ blocks: EditableWodBlock[]; text?: string; warnings?: string[] }>;
  useReferenceLabel?: string;
  useReferenceDisabled?: boolean;
  referenceMessage?: string | null;
};

const seedBlocks: EditableWodBlock[] = [
  { id: "b1", exercise: "Run", volume: "800 m", load: "BW", time: "3:15" },
  { id: "b2", exercise: "Kettlebell Lunges", volume: "20 reps", load: "24 kg", time: "2:10" },
  { id: "b3", exercise: "Wall Balls", volume: "30 reps", load: "9 kg", time: "2:45" },
  { id: "b4", exercise: "Burpee Box Jump Over", volume: "15 reps", load: "Bodyweight", time: "3:05" },
  { id: "b5", exercise: "Toes to Bar", volume: "20 reps", load: "Bodyweight", time: "2:20" }
];

const buildBlocks = () =>
  seedBlocks.map((b, idx) => ({
    ...b,
    id: `${b.id}-${Date.now()}-${idx}`
  }));

export const WodImageUploader: React.FC<Props> = ({
  onParsed,
  onProcessingChange,
  onUseReferenceWod,
  processFile,
  useReferenceLabel = "Usar WOD seleccionado",
  useReferenceDisabled,
  referenceMessage
}) => {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingSource, setProcessingSource] = useState<ProcessingSource>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const borderClass = useMemo(
    () =>
      isDragging
        ? "border-cyan-300/60 bg-cyan-500/10 shadow-[0_0_0_1px_rgba(34,211,238,0.3)]"
        : "border-white/10 bg-white/5",
    [isDragging]
  );

  const triggerProcessing = (state: boolean, source?: ProcessingSource) => {
    setIsProcessing(state);
    setProcessingSource(state ? source ?? null : null);
    onProcessingChange?.(state);
  };

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    const imageUrl = URL.createObjectURL(file);
    setPreview(imageUrl);
    triggerProcessing(true, "upload");
    const runner = processFile
      ? processFile(file)
      : Promise.resolve({ blocks: buildBlocks(), text: undefined, warnings: ["OCR mock: reemplazar con servicio real."] });
    runner
      .then((result) => {
        if (result) {
          onParsed({ imageUrl, blocks: result.blocks, text: result.text, warnings: result.warnings });
        }
      })
      .catch((err) => {
        console.error("[WodImageUploader] Error al procesar imagen", err);
      })
      .finally(() => triggerProcessing(false));
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleUseReference = async () => {
    if (!onUseReferenceWod || useReferenceDisabled) return;
    triggerProcessing(true, "reference");
    try {
      const result = await onUseReferenceWod();
      if (result) {
        const nextPreview = result.imageUrl ?? null;
        setPreview(nextPreview);
        if (result.blocks?.length) {
          onParsed({ imageUrl: nextPreview ?? "", blocks: result.blocks });
        }
      }
    } catch (err) {
      console.error("[WodImageUploader] Error al cargar WOD de referencia", err);
    } finally {
      triggerProcessing(false);
    }
  };

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-slate-900/70 via-slate-900/40 to-slate-800/70 ring-1 ring-white/5">
      <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="absolute -right-12 bottom-0 h-40 w-40 rotate-6 bg-indigo-500/10 blur-3xl" />
      <div className="relative grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Paso 1 · Subida</p>
          <h2 className="mt-1 text-2xl font-semibold text-white">Sube un screenshot o foto del entrenamiento</h2>
          <p className="mt-1 text-sm text-slate-300">Drag & drop habilitado. Ejecutamos OCR real y generamos bloques editables al instante.</p>
          <motion.div
            className={`mt-4 flex flex-col items-center justify-center rounded-2xl border px-6 py-8 text-center transition ${borderClass}`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            whileHover={{ scale: 1.01 }}
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <p className="text-sm font-semibold text-white">Arrastra tu imagen o selecciónala</p>
            <p className="mt-1 text-xs text-slate-400">JPG / PNG · max 10MB · OCR simulado</p>
            <div className="mt-4 flex flex-col items-center gap-2">
              <div className="flex flex-wrap justify-center gap-3">
                <Button variant="primary" size="sm" onClick={() => fileRef.current?.click()} disabled={isProcessing}>
                  {isProcessing && processingSource === "upload" ? "Procesando..." : "Subir imagen"}
                </Button>
                {onUseReferenceWod && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleUseReference}
                    disabled={isProcessing || useReferenceDisabled}
                  >
                    {isProcessing && processingSource === "reference" ? "Cargando..." : useReferenceLabel}
                  </Button>
                )}
              </div>
              {referenceMessage && <p className="text-xs text-slate-400">{referenceMessage}</p>}
            </div>
          </motion.div>
          <div className="mt-3 grid gap-2 text-xs text-slate-300 md:grid-cols-3">
            <span className="rounded-lg bg-white/5 px-3 py-2">1) Foto de pizarra o app</span>
            <span className="rounded-lg bg-white/5 px-3 py-2">2) OCR real en segundos</span>
            <span className="rounded-lg bg-white/5 px-3 py-2">3) Bloques listos para editar</span>
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 shadow-inner shadow-black/30">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Preview</p>
          <div className="mt-3 aspect-video overflow-hidden rounded-xl border border-dashed border-white/10 bg-slate-800/60">
            {preview ? (
              <motion.div
                key={preview}
                className="h-full w-full bg-cover bg-center"
                style={{ backgroundImage: `url(${preview})` }}
                initial={{ opacity: 0.5, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">Sin imagen</div>
            )}
          </div>
          <p className="mt-3 text-xs text-slate-400">El OCR es simulado en esta versión MVP. Podrás editar cada bloque antes de guardarlo.</p>
        </div>
      </div>
    </Card>
  );
};
