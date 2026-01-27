import React from "react";
import { Button } from "@thrifty/ui";

type ProfileHeaderProps = {
  name: string;
  level: string;
  xp: number;
  xpToNext: number;
  avatar?: string;
};

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  name,
  level,
  xp,
  xpToNext,
  avatar
}) => {
  const progress = Math.min(100, Math.round((xp / xpToNext) * 100));
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-[0_0_0_0.5px_rgba(255,255,255,0.12)]">
      <div className="absolute -left-16 -top-16 h-44 w-44 rounded-full bg-brand/15 blur-3xl" />
      <div className="absolute right-6 top-6 h-20 w-20 rotate-12 rounded-xl bg-indigo-500/20 blur-xl" />
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-20 overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br from-brand/20 to-indigo-500/10 shadow-[0_0_0_1px_rgba(255,255,255,0.15)]">
            {avatar ? (
              <img src={avatar} alt={name} className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full w-full place-items-center text-2xl font-bold text-white">
                {name.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Atleta híbrido</p>
            <h1 className="text-3xl font-semibold text-white">{name}</h1>
            <p className="text-sm text-slate-300">
              Nivel <span className="text-white">{level}</span> · XP {xp}/{xpToNext}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-20">
            <svg viewBox="0 0 120 120" className="h-20 w-20 text-slate-600">
              <circle
                cx="60"
                cy="60"
                r="48"
                stroke="currentColor"
                strokeWidth="10"
                fill="none"
                strokeDasharray="302"
                strokeDashoffset="0"
                className="opacity-30"
              />
              <circle
                cx="60"
                cy="60"
                r="48"
                stroke="url(#progressGradient)"
                strokeWidth="10"
                fill="none"
                strokeDasharray="302"
                strokeDashoffset={302 - (progress / 100) * 302}
                strokeLinecap="round"
                transform="rotate(-90 60 60)"
                className="drop-shadow-[0_0_8px_rgba(31,182,255,0.8)]"
              />
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1FB6FF" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 grid place-items-center text-lg font-semibold text-white">
              {progress}%
            </div>
          </div>
          <Button variant="primary" size="md" className="shadow-lg">
            Editar perfil
          </Button>
        </div>
      </div>
    </div>
  );
};
