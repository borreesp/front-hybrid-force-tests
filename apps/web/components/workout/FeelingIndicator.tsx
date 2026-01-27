import React from "react";

type FeelingIndicatorProps = {
  text: string;
};

export const FeelingIndicator: React.FC<FeelingIndicatorProps> = ({ text }) => {
  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-brand/10 via-indigo-500/10 to-emerald-400/10 p-4 backdrop-blur-md shadow-[0_0_0_0.5px_rgba(255,255,255,0.08)]">
      <p className="text-sm text-slate-200">{text}</p>
    </div>
  );
};
