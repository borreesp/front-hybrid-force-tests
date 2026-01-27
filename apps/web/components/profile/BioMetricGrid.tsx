import React from "react";
import { HexBioStat } from "./HexBioStat";

type Stat = { label: string; value: string | number; icon?: React.ReactNode };

type BioMetricGridProps = {
  stats: Stat[];
};

export const BioMetricGrid: React.FC<BioMetricGridProps> = ({ stats }) => {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {stats.map((stat) => (
        <HexBioStat key={stat.label} {...stat} />
      ))}
    </div>
  );
};
