import React from "react";

type PhysiologyItem = {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
};

type PhysiologyPanelProps = {
  items: PhysiologyItem[];
};

export const PhysiologyPanel: React.FC<PhysiologyPanelProps> = ({ items }) => {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="hover-lift rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md shadow-[0_0_0_0.5px_rgba(255,255,255,0.08)]"
        >
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl border border-white/15 bg-white/5 text-brand">
              {item.icon ?? (
                <svg viewBox="0 0 24 24" className="h-5 w-5">
                  <path d="M12 3 21 8.5v7L12 21 3 15.5v-7z" stroke="currentColor" strokeWidth="2" fill="none" />
                </svg>
              )}
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.12em] text-slate-400">{item.label}</p>
              <p className="text-lg font-semibold text-white">{item.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
