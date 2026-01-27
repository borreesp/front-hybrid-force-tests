import React from "react";

type RadarPoint = { label: string; value: number };

type AthleteRadarChartProps = {
  data: RadarPoint[];
  size?: number;
};

export const AthleteRadarChart: React.FC<AthleteRadarChartProps> = ({ data, size = 200 }) => {
  const points = data.slice(0, 6);
  const center = { x: size / 2, y: size / 2 };
  const radius = (size / 2) - 24;

  const toPoint = (value: number, idx: number) => {
    const angle = (Math.PI * 2 * idx) / points.length - Math.PI / 2;
    const r = (value / 100) * radius;
    return { x: center.x + r * Math.cos(angle), y: center.y + r * Math.sin(angle) };
  };

  const polygon = points
    .map((p, idx) => {
      const pt = toPoint(p.value, idx);
      return `${pt.x},${pt.y}`;
    })
    .join(" ");

  return (
    <div className="card-base overflow-hidden">
      <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto w-full max-w-[420px] text-white">
        <defs>
          <linearGradient id="radarProfile" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1FB6FF" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.35" />
          </linearGradient>
        </defs>
        {[1, 0.7, 0.4].map((ratio) => (
          <polygon
            key={ratio}
            points={points
              .map((_, idx) => {
                const pt = toPoint(100 * ratio, idx);
                return `${pt.x},${pt.y}`;
              })
              .join(" ")}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1"
          />
        ))}
        <polygon points={polygon} fill="url(#radarProfile)" stroke="#1FB6FF" strokeWidth="2" />
        {points.map((p, idx) => {
          const pt = toPoint(p.value, idx);
          return (
            <g key={p.label}>
              <line x1={center.x} y1={center.y} x2={pt.x} y2={pt.y} stroke="rgba(255,255,255,0.1)" />
              <circle cx={pt.x} cy={pt.y} r="4" fill="#22c55e" />
              <text
                x={pt.x}
                y={pt.y - 10}
                className="text-[9px] font-semibold"
                textAnchor="middle"
                fill="#e5e7eb"
              >
                {p.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
