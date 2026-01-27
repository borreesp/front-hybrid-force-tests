import React from "react";

type GearMiniCardProps = {
  label: string;
};

export const GearMiniCard: React.FC<GearMiniCardProps> = ({ label }) => {
  return (
    <div className="relative hover-lift">
      <div className="absolute inset-0 blur-md bg-gradient-to-br from-brand/20 to-indigo-500/15" />
      <div className="relative grid h-24 place-items-center rounded-2xl border border-white/10 bg-white/5 px-4 text-center text-sm text-white backdrop-blur-md shadow-[0_0_0_0.5px_rgba(255,255,255,0.08)]">
        <div className="absolute -right-6 -top-6 h-16 w-16 rotate-12 rounded-xl bg-white/5" />
        <div className="grid place-items-center rounded-xl border border-white/15 bg-white/5 px-3 py-2 shadow-inner shadow-black/30">
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-brand">
            <path d="M12 3 21 8.5v7L12 21 3 15.5v-7z" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M12 8v8m-4-4h8" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>
        <p className="mt-2 text-sm text-slate-200">{label}</p>
      </div>
    </div>
  );
};
