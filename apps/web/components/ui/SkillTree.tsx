import React from "react";

type Node = {
  id: string;
  label: string;
  percent: number;
  active?: boolean;
};

type SkillTreeProps = {
  nodes: Node[];
};

export const SkillTree: React.FC<SkillTreeProps> = ({ nodes }) => {
  const coords = [
    { x: 50, y: 8 },
    { x: 88, y: 30 },
    { x: 88, y: 70 },
    { x: 50, y: 92 },
    { x: 12, y: 70 },
    { x: 12, y: 30 }
  ];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
      <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-brand/10 blur-3xl" />
      <svg viewBox="0 0 100 100" className="w-full text-white">
        <defs>
          <linearGradient id="treeLine" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(31,182,255,0.9)" />
            <stop offset="100%" stopColor="rgba(99,102,241,0.9)" />
          </linearGradient>
        </defs>
        <g stroke="url(#treeLine)" strokeWidth="2">
          {coords.map((c, idx) => {
            const next = coords[(idx + 1) % coords.length];
            return <line key={idx} x1={c.x} y1={c.y} x2={next.x} y2={next.y} strokeOpacity="0.4" />;
          })}
        </g>
        {nodes.slice(0, 6).map((node, idx) => {
          const c = coords[idx];
          const radius = 12;
          const dash = (node.percent / 100) * 2 * Math.PI * radius;
          return (
            <g key={node.id} transform={`translate(${c.x},${c.y})`}>
              <circle r={radius + 4} fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" />
              <circle
                r={radius}
                fill={node.active ? "rgba(31,182,255,0.25)" : "rgba(17,24,39,0.8)"}
                stroke="url(#treeLine)"
                strokeWidth="1.5"
              />
              <circle
                r={radius}
                fill="transparent"
                stroke="url(#treeLine)"
                strokeWidth="3"
                strokeDasharray={`${dash} ${2 * Math.PI * radius}`}
                strokeLinecap="round"
                transform="rotate(-90)"
              />
              <text
                x="0"
                y="3"
                textAnchor="middle"
                className="text-[6px] font-semibold"
                fill={node.active ? "#1FB6FF" : "#e5e7eb"}
              >
                {node.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
