"use client";
import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button, Card, Input } from "@thrifty/ui";
import { EditableWodBlock as EditableCard } from "./EditableWodBlock";
import type { EditableWodBlock } from "./wod-types";

type Props = {
  blocks: EditableWodBlock[];
  onBlocksChange: (blocks: EditableWodBlock[]) => void;
  onSave: (payload: {
    title: string;
    date: string;
    duration: string;
    effort: string;
    stimulus: string;
    tags: string[];
    blocks: EditableWodBlock[];
  }) => void;
  isSaving?: boolean;
  primaryLabel?: string;
  primaryDisabled?: boolean;
};

const createEmptyBlock = (): EditableWodBlock => ({
  id: `block-${Date.now()}`,
  exercise: "Nuevo ejercicio",
  volume: "",
  load: "",
  time: "",
  note: ""
});

export const WodEditForm: React.FC<Props> = ({
  blocks,
  onBlocksChange,
  onSave,
  isSaving,
  primaryLabel = "Guardar WOD",
  primaryDisabled
}) => {
  const [title, setTitle] = useState("WOD detectado (editable)");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [duration, setDuration] = useState("18-22 min");
  const [effort, setEffort] = useState("Carga media · RPE 7/10");
  const [stimulus, setStimulus] = useState("Anaerobico con carga media");
  const [tagsInput, setTagsInput] = useState("Carga,Anaerobico,Fuerza media");

  const parsedTags = useMemo(
    () => tagsInput.split(",").map((t) => t.trim()).filter(Boolean),
    [tagsInput]
  );

  const updateBlock = (id: string, patch: Partial<EditableWodBlock>) => {
    onBlocksChange(
      blocks.map((b) => (b.id === id ? { ...b, ...patch } : b))
    );
  };

  const removeBlock = (id: string) => {
    onBlocksChange(blocks.filter((b) => b.id !== id));
  };

  const moveBlock = (id: string, direction: "up" | "down") => {
    const idx = blocks.findIndex((b) => b.id === id);
    if (idx < 0) return;
    const target = direction === "up" ? idx - 1 : idx + 1;
    if (target < 0 || target >= blocks.length) return;
    const clone = [...blocks];
    [clone[idx], clone[target]] = [clone[target], clone[idx]];
    onBlocksChange(clone);
  };

  const addBlock = () => {
    onBlocksChange([...blocks, createEmptyBlock()]);
  };

  const isValid = blocks.length > 0 && blocks.every((b) => b.exercise.trim() && b.load.trim());

  const handleSave = () => {
    if (!isValid) return;
    onSave({
      title,
      date,
      duration,
      effort,
      stimulus,
      tags: parsedTags,
      blocks
    });
  };

  return (
    <Card className="bg-slate-900/70 ring-1 ring-white/5">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Paso 2 · Edicion</p>
          <h3 className="text-xl font-semibold text-white">Revisa los bloques detectados</h3>
          <p className="text-sm text-slate-300">Corrige ejercicios, reps, peso obligatorio y tiempos opcionales antes de guardar.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-slate-300">
          <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1">Editable</span>
          <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1">Reordenable</span>
          <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1">Peso requerido</span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-5">
        <Input label="Titulo" value={title} onChange={(e) => setTitle(e.target.value)} className="md:col-span-2" />
        <Input label="Fecha" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <Input label="Duracion" value={duration} onChange={(e) => setDuration(e.target.value)} />
        <Input label="Esfuerzo estimado" value={effort} onChange={(e) => setEffort(e.target.value)} />
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <Input label="Tipo de estimulo" value={stimulus} onChange={(e) => setStimulus(e.target.value)} />
        <Input
          label="Tags"
          hint="Separados por coma"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          className="md:col-span-2"
        />
      </div>

      <div className="mt-6 space-y-3">
        <AnimatePresence initial={false}>
          {blocks.map((block, idx) => (
            <EditableCard
              key={block.id}
              block={block}
              index={idx}
              onChange={updateBlock}
              onRemove={removeBlock}
              onMove={moveBlock}
            />
          ))}
        </AnimatePresence>
        {!blocks.length && (
          <motion.div
            initial={{ opacity: 0.6, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-dashed border-white/20 bg-slate-900/40 p-4 text-sm text-slate-300"
          >
            Sube una imagen para generar bloques o crea uno manualmente.
          </motion.div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2 text-xs text-slate-300">
          <span className="rounded-lg bg-white/5 px-3 py-2">Bloques: {blocks.length}</span>
          <span className="rounded-lg bg-white/5 px-3 py-2">Tags: {parsedTags.join(" · ") || "sin tags"}</span>
          {!isValid && <span className="rounded-lg bg-rose-500/10 px-3 py-2 text-rose-200">Completa peso y ejercicio</span>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" size="sm" onClick={addBlock}>
            Anadir bloque
          </Button>
          <Button variant="primary" size="md" onClick={handleSave} disabled={!isValid || isSaving || primaryDisabled}>
            {isSaving ? "Guardando..." : primaryLabel}
          </Button>
        </div>
      </div>
    </Card>
  );
};
