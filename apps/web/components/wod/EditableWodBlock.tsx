"use client";
import React from "react";
import { Button, Input } from "@thrifty/ui";
import { motion } from "framer-motion";
import type { EditableWodBlock as EditableWodBlockType } from "./wod-types";

type Props = {
  block: EditableWodBlockType;
  index: number;
  onChange: (id: string, patch: Partial<EditableWodBlockType>) => void;
  onRemove: (id: string) => void;
  onMove: (id: string, direction: "up" | "down") => void;
};

export const EditableWodBlock: React.FC<Props> = ({ block, index, onChange, onRemove, onMove }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0.7, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 ring-1 ring-white/5 shadow-inner shadow-black/20"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-500/15 text-cyan-200">#{index + 1}</span>
          <span>Bloque editable</span>
        </div>
        <div className="flex gap-2 text-xs text-slate-300">
          <Button variant="ghost" size="sm" onClick={() => onMove(block.id, "up")} aria-label="Mover arriba">
            Subir
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onMove(block.id, "down")} aria-label="Mover abajo">
            Bajar
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onRemove(block.id)} aria-label="Eliminar bloque">
            Eliminar
          </Button>
        </div>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <Input
          label="Nombre del ejercicio"
          placeholder="Run, Wall Balls, KB Lunges..."
          value={block.exercise}
          onChange={(e) => onChange(block.id, { exercise: e.target.value })}
          required
        />
        <Input
          label="Reps / metros"
          placeholder="25 reps, 800m, 2 rounds"
          value={block.volume}
          onChange={(e) => onChange(block.id, { volume: e.target.value })}
        />
        <Input
          label="Peso utilizado (obligatorio)"
          placeholder="24 kg, 70kg, BW"
          value={block.load}
          onChange={(e) => onChange(block.id, { load: e.target.value })}
          required
          className={!block.load ? "border-rose-400/40" : undefined}
        />
        <Input
          label="Tiempo por bloque (opcional)"
          hint="No pasa nada si no lo mides"
          placeholder="3:05, 90s, 5 min"
          value={block.time ?? ""}
          onChange={(e) => onChange(block.id, { time: e.target.value })}
        />
      </div>
      <div className="mt-3">
        <Input
          label="Notas"
          placeholder="Romper en 2x15, mantener cadencia..."
          value={block.note ?? ""}
          onChange={(e) => onChange(block.id, { note: e.target.value })}
        />
      </div>
    </motion.div>
  );
};
