import React from "react";

type RadarProps = {
  data: {
    label: string;
    value: number;
  }[];
};

export const AthleteRadarChart: React.FC<RadarProps> = ({ data }) => {
  const axisOrder = ["Fuerza", "Resistencia", "Metcon", "Gimnásticos", "Velocidad", "Carga muscular"];
  const byLabel = Object.fromEntries(
    data.map((d) => [d.label.toLowerCase().trim(), Math.max(0, Math.min(100, Math.round(d.value ?? 0)))])
  );
  const normalized = axisOrder.map((label) => ({
    label,
    value: byLabel[label.toLowerCase()] ?? 0
  }));
  const center = { x: 120, y: 120 };
  const radius = 100;

  const toPoint = (value: number, idx: number) => {
    const angle = (Math.PI * 2 * idx) / normalized.length - Math.PI / 2;
    const r = (value / 100) * radius;
    return { x: center.x + r * Math.cos(angle), y: center.y + r * Math.sin(angle) };
  };

  const polygon = normalized
    .map((p, idx) => {
      const pt = toPoint(p.value, idx);
      return `${pt.x},${pt.y}`;
    })
    .join(" ");

  return (
    <div className="card-base overflow-hidden">
      <svg viewBox="0 0 240 240" className="w-full text-white">
        <defs>
          <linearGradient id="radarFillDetail" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(31,182,255,0.4)" />
            <stop offset="100%" stopColor="rgba(99,102,241,0.35)" />
          </linearGradient>
        </defs>
        {[1, 0.7, 0.4].map((ratio) => (
          <polygon
            key={ratio}
            points={normalized
              .map((_, idx) => {
                const pt = toPoint(100 * ratio, idx);
                return `${pt.x},${pt.y}`;
              })
              .join(" ")}
            fill="none"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="1"
          />
        ))}
        {normalized.map((_, idx) => {
          const pt = toPoint(100, idx);
          return <line key={`axis-${idx}`} x1={center.x} y1={center.y} x2={pt.x} y2={pt.y} stroke="rgba(255,255,255,0.1)" />;
        })}
        <polygon
          points={polygon}
          fill="url(#radarFillDetail)"
          stroke="#1FB6FF"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {normalized.map((p, idx) => {
          const pt = toPoint(p.value, idx);
          return (
            <g key={p.label}>
              <circle cx={pt.x} cy={pt.y} r="4" fill="#22c55e" />
              <text
                x={pt.x}
                y={pt.y - 8}
                className="text-[8px] font-semibold"
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
