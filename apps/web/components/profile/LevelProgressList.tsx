"use client";
import React from "react";
import { LinearProgressBar } from "../charts/LinearProgressBar";

type Level = {
  name: string;
  percent: number;
  summary?: string;
};

type Props = {
  levels: Level[];
};

export const LevelProgressList: React.FC<Props> = ({ levels }) => {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {levels.map((level) => (
        <div
          key={level.name}
          className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_10px_40px_rgba(0,0,0,0.25)] backdrop-blur-md"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">{level.name}</p>
              {level.summary && <p className="text-xs text-slate-400">{level.summary}</p>}
            </div>
            <span className="text-xs text-amber-300 font-semibold">{level.percent}%</span>
          </div>
          <div className="mt-3">
            <LinearProgressBar value={level.percent} color="#FEC94F" />
          </div>
        </div>
      ))}
    </div>
  );
};
