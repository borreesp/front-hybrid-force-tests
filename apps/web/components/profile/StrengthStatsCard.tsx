import React from "react";

type StrengthStatsCardProps = {
  strength: {
    squat: string;
    bench: string;
    deadlift: string;
    clean: string;
    snatch: string;
    jerk: string;
    pullups: string;
    dips: string;
    power: string;
    verticalJump: string;
  };
};

export const StrengthStatsCard: React.FC<StrengthStatsCardProps> = ({ strength }) => {
  const items = [
    { label: "Squat 1RM", value: strength.squat },
    { label: "Bench 1RM", value: strength.bench },
    { label: "Deadlift 1RM", value: strength.deadlift },
    { label: "Clean", value: strength.clean },
    { label: "Snatch", value: strength.snatch },
    { label: "Jerk", value: strength.jerk },
    { label: "Pull-ups", value: strength.pullups },
    { label: "Dips", value: strength.dips },
    { label: "Potencia (W)", value: strength.power },
    { label: "Vertical jump", value: strength.verticalJump }
  ];

  return (
    <div className="hover-lift rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md shadow-[0_0_0_0.5px_rgba(255,255,255,0.08)]">
      <p className="text-sm font-semibold text-white">Fuerza máxima</p>
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
