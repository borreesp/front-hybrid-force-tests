"use client";
import React from "react";
import { motion } from "framer-motion";

const clamp = (val: number) => Math.min(100, Math.max(0, Math.round(val)));

type Props = {
  entries: { label: string; value: number }[];
  caption?: string;
  modeLabel?: string;
};

export const AthleteRadar: React.FC<Props> = ({ entries, caption, modeLabel }) => {
  const normalized = entries.map((entry) => ({
    label: entry.label,
    value: clamp(Number(entry.value ?? 0))
  }));

  const size = 340;
  const viewBoxSize = 360;
  const center = viewBoxSize / 2;
  const radius = 130;
  const labelRadius = 150;
  const gridLevels = [0.33, 0.66, 1];

  const toPoint = (valuePct: number, idx: number) => {
    const angle = ((Math.PI * 2) / normalized.length) * idx - Math.PI / 2;
    const r = (valuePct / 100) * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return `${x},${y}`;
  };

  const pointString = normalized.map((entry, idx) => toPoint(entry.value, idx)).join(" ");
  const gridPolygon = (level: number) => normalized.map((_, idx) => toPoint(level * 100, idx)).join(" ");

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl bg-slate-900/70 p-4 ring-1 ring-white/5"
    >
      <p className="text-sm text-slate-300">Capacidades fisicas</p>
      {modeLabel && <p className="text-xs text-slate-500">Comparado con {modeLabel}</p>}
      <div className="mt-3 grid gap-4 md:grid-cols-2">
        <div className="flex items-center justify-center rounded-xl bg-slate-900/80 p-6">
          <svg width={size} height={size} viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`} role="img" aria-label="Radar de capacidades">
            <defs>
              <linearGradient id="radarGradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#818cf8" stopOpacity="0.25" />
              </linearGradient>
            </defs>
            <g stroke="#0ea5e9" strokeWidth="1" strokeOpacity="0.3" fill="none">
              {gridLevels.map((level) => (
                <polygon key={level} points={gridPolygon(level)} />
              ))}
              {normalized.map((_, idx) => {
                const angle = ((Math.PI * 2) / normalized.length) * idx - Math.PI / 2;
                const x = center + radius * Math.cos(angle);
                const y = center + radius * Math.sin(angle);
                return <line key={idx} x1={center} y1={center} x2={x} y2={y} />;
              })}
            </g>
            <polygon
              points={pointString}
              fill="url(#radarGradient)"
              stroke="#22d3ee"
              strokeOpacity="0.7"
              strokeWidth={2}
              fillOpacity={0.35}
            />
            <g fontSize="11" fill="#cbd5e1" className="select-none">
              {normalized.map((entry, idx) => {
                const angle = ((Math.PI * 2) / normalized.length) * idx - Math.PI / 2;
                const x = center + labelRadius * Math.cos(angle);
                const y = center + labelRadius * Math.sin(angle);
                const textAnchor = Math.abs(Math.cos(angle)) < 0.2 ? "middle" : Math.cos(angle) > 0 ? "start" : "end";
                const parts = entry.label.split(" ");
                return (
                  <text key={entry.label} x={x} y={y} textAnchor={textAnchor} dominantBaseline="middle">
                    {parts.length > 1 ? (
                      <>
                        <tspan x={x} dy="-0.5em">
                          {parts.slice(0, -1).join(" ")}
                        </tspan>
                        <tspan x={x} dy="1.2em">
                          {parts.slice(-1)}
                        </tspan>
                      </>
                    ) : (
                      entry.label
                    )}
                  </text>
                );
              })}
            </g>
          </svg>
        </div>
        <div className="space-y-2 text-sm text-slate-200">
          {normalized.map((entry) => (
            <div key={entry.label} className="flex items-center justify-between gap-3 rounded-lg bg-white/5 px-3 py-2">
              <span>{entry.label}</span>
              <div className="flex items-center gap-2">
                <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full bg-cyan-400" style={{ width: `${entry.value}%` }} />
                </div>
                <span className="text-cyan-200">{entry.value}%</span>
              </div>
            </div>
          ))}
          {caption && <p className="pt-2 text-xs text-slate-400">{caption}</p>}
        </div>
      </div>
    </motion.div>
  );
};
