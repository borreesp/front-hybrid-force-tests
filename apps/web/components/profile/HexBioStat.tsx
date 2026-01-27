import React from "react";

type HexBioStatProps = {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
};

export const HexBioStat: React.FC<HexBioStatProps> = ({ label, value, icon }) => {
  return (
    <div className="relative hover-lift">
      <div className="absolute inset-0 blur-xl bg-gradient-to-br from-brand/20 to-indigo-500/15" />
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md shadow-[0_0_0_0.5px_rgba(255,255,255,0.08)]">
        <div className="absolute -right-6 -top-6 h-16 w-16 rotate-12 bg-white/5" />
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-xl border border-white/15 bg-white/5 text-brand">
            {icon ?? (
              <svg viewBox="0 0 24 24" className="h-6 w-6">
                <path d="M12 3 21 8.5v7L12 21 3 15.5v-7z" stroke="currentColor" strokeWidth="2" fill="none" />
              </svg>
            )}
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-slate-400">{label}</p>
            <p className="text-xl font-semibold text-white">{value}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
