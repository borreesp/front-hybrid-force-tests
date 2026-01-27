import React from "react";

type EnduranceStatsCardProps = {
  endurance: {
    run5k: string;
    run10k: string;
    pace1k: string;
    pace3k: string;
    row500: string;
    row2k: string;
    ftp: string;
    assault1: string;
    assault10: string;
    anaerobicScore: string;
    metconEfficiency: string;
  };
};

export const EnduranceStatsCard: React.FC<EnduranceStatsCardProps> = ({ endurance }) => {
  const items = [
    { label: "5K", value: endurance.run5k },
    { label: "10K", value: endurance.run10k },
    { label: "Pace 1K", value: endurance.pace1k },
    { label: "Pace 3K", value: endurance.pace3k },
    { label: "Row 500m", value: endurance.row500 },
    { label: "Row 2K", value: endurance.row2k },
    { label: "FTP cycling", value: endurance.ftp },
    { label: "Assault 1min", value: endurance.assault1 },
    { label: "Assault 10min", value: endurance.assault10 },
    { label: "Anaerobic capacity", value: endurance.anaerobicScore },
    { label: "Metcon efficiency", value: endurance.metconEfficiency }
  ];

  return (
    <div className="hover-lift rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md shadow-[0_0_0_0.5px_rgba(255,255,255,0.08)]">
      <p className="text-sm font-semibold text-white">Endurance (aeróbica + anaeróbica)</p>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200"
          >
            <span>{item.label}</span>
            <span className="font-semibold text-white">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
