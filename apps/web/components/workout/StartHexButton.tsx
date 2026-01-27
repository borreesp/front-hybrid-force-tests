import React from "react";
import { cn } from "@thrifty/utils";

type StartHexButtonProps = {
  onClick?: () => void;
  label?: string;
};

export const StartHexButton: React.FC<StartHexButtonProps> = ({
  onClick,
  label = "Iniciar entrenamiento"
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white",
        "focus:outline-none"
      )}
    >
      <span className="absolute inset-0 -z-10 rotate-6 rounded-2xl bg-gradient-to-br from-brand/60 via-indigo-500/50 to-emerald-400/50 blur-xl opacity-50 transition group-hover:opacity-80" />
      <span className="relative flex items-center gap-3 rounded-[18px] border border-white/15 bg-white/10 px-8 py-4 backdrop-blur-md shadow-[0_0_0_0.5px_rgba(255,255,255,0.12)] group-hover:scale-[1.01] transition">
        <svg viewBox="0 0 24 24" className="h-6 w-6 text-white">
          <path d="M12 3 21 8.5v7L12 21 3 15.5v-7z" stroke="currentColor" strokeWidth="2" fill="none" />
          <path d="M10 9l5 3-5 3V9z" fill="currentColor" />
        </svg>
        {label}
      </span>
    </button>
  );
};
