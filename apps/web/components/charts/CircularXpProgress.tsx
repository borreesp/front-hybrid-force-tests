"use client";
import React from "react";
import { cn } from "@thrifty/utils";

type Props = {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  className?: string;
};

export const CircularXpProgress: React.FC<Props> = ({
  value = 0,
  size = 140,
  stroke = 10,
  color = "#FEC94F",
  className
}) => {
  const pct = Math.max(0, Math.min(100, value));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div
      className={cn(
        "card-base relative grid place-items-center p-3",
        className
      )}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-[stroke-dashoffset] duration-500"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center text-white">
        <div className="text-xl font-semibold leading-none">{pct}%</div>
        <div className="text-xs text-slate-300 mt-1">XP</div>
      </div>
    </div>
  );
};
