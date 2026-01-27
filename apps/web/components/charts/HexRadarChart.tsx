/* Simple Recharts-based radar chart for Next.js */
"use client";
import React from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer
} from "recharts";

type Point = { label: string; value: number };

type Props = {
  data: Point[];
  stroke?: string;
  fill?: string;
  max?: number;
};

export const HexRadarChart: React.FC<Props> = ({
  data = [],
  stroke = "#FEC94F",
  fill = "#FEC94F",
  max = 100
}) => {
  const formatted = data.map((item) => ({ ...item, full: max }));
  return (
    <div className="card-base p-3">
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={formatted} outerRadius="80%">
          <PolarGrid strokeOpacity={0.2} />
          <PolarAngleAxis dataKey="label" tick={{ fill: "#cbd5e1", fontSize: 12 }} />
          <PolarRadiusAxis angle={90} domain={[0, max]} tick={false} axisLine={false} />
          <Radar
            dataKey="value"
            stroke={stroke}
            fill={fill}
            fillOpacity={0.25}
            strokeWidth={2}
            isAnimationActive
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};
