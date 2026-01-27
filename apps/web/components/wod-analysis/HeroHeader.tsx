"use client";
import React from "react";
import { Button } from "@thrifty/ui";

type Props = {
  title: string;
  subtitle: string;
  onAction?: () => void;
  actionLabel?: string;
};

export const HeroHeader: React.FC<Props> = ({ title, subtitle, onAction, actionLabel = "Analizar ahora" }) => {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-cyan-500/15 bg-gradient-to-br from-slate-950 via-slate-900/80 to-slate-950/70 p-8 shadow-[0_24px_80px_rgba(0,0,0,0.65)] ring-1 ring-white/10">
      <div className="absolute -left-10 -top-16 h-40 w-40 rounded-full bg-cyan-500/15 blur-3xl" />
      <div className="absolute -right-10 bottom-0 h-48 w-48 rotate-12 rounded-full bg-indigo-500/15 blur-3xl" />
      <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-200/80">Analisis HYROX</p>
          <h1 className="text-3xl font-semibold text-white md:text-4xl">{title}</h1>
          <p className="max-w-3xl text-sm text-slate-200 md:text-base">{subtitle}</p>
          <div className="flex flex-wrap gap-2 text-xs text-slate-300">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">OCR + Bloques</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Carga · Capacidades · Pacing</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">HYROX ready</span>
          </div>
        </div>
        {onAction && (
          <Button variant="primary" size="md" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
};
