import React from "react";

type PhysioBenefitCardProps = {
  label: string;
};

export const PhysioBenefitCard: React.FC<PhysioBenefitCardProps> = ({ label }) => {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-md hover-lift shadow-[0_0_0_0.5px_rgba(255,255,255,0.08)]">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/15 border border-emerald-400/40 text-emerald-200">
        <svg viewBox="0 0 24 24" className="h-5 w-5">
          <path d="M5 12l4 4 10-10" stroke="currentColor" strokeWidth="2" fill="none" />
        </svg>
      </div>
      <p className="text-sm text-slate-200">{label}</p>
    </div>
  );
};
