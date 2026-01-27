import React from "react";

type SubjectiveNotesCardProps = {
  subjective: Record<string, string | number>;
};

export const SubjectiveNotesCard: React.FC<SubjectiveNotesCardProps> = ({ subjective }) => {
  return (
    <div className="hover-lift rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md shadow-[0_0_0_0.5px_rgba(255,255,255,0.08)]">
      <p className="text-sm font-semibold text-white">Datos subjetivos</p>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {Object.entries(subjective).map(([key, value]) => (
          <div
            key={key}
            className="flex items-start justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200"
          >
            <span className="capitalize">{key.replace(/_/g, " ")}</span>
            <span className="font-semibold text-white text-right">{String(value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
