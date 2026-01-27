import React from "react";

type MentalStateCardProps = {
  mental: Record<string, number>;
};

export const MentalStateCard: React.FC<MentalStateCardProps> = ({ mental }) => {
  return (
    <div className="hover-lift rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md shadow-[0_0_0_0.5px_rgba(255,255,255,0.08)]">
      <p className="text-sm font-semibold text-white">Estado mental</p>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {Object.entries(mental).map(([key, value]) => (
          <div
            key={key}
            className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200"
          >
            <span className="capitalize">{key.replace(/_/g, " ")}</span>
            <span className="font-semibold text-white">{value}/10</span>
          </div>
        ))}
      </div>
    </div>
  );
};
