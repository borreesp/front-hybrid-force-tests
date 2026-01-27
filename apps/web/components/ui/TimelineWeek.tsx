import React from "react";
import { cn } from "@thrifty/utils";

type DayItem = {
  day: string;
  label: string;
  status?: "done" | "planned" | "rest";
};

type TimelineWeekProps = {
  items: DayItem[];
};

const colorForStatus: Record<NonNullable<DayItem["status"]>, string> = {
  done: "bg-emerald-400",
  planned: "bg-brand",
  rest: "bg-slate-500"
};

export const TimelineWeek: React.FC<TimelineWeekProps> = ({ items }) => {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
      <div className="flex items-center justify-between gap-2">
        {items.map((item, idx) => (
          <div key={item.day} className="flex flex-1 flex-col items-center gap-2">
            <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className={cn(
                  "absolute inset-y-0 rounded-full transition-all",
                  colorForStatus[item.status ?? "planned"],
                  idx === items.length - 1 ? "w-3/4" : "w-full"
                )}
              />
            </div>
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "grid h-10 w-10 place-items-center rounded-xl border border-white/15 text-xs font-semibold",
                  "shadow-[0_0_0_0.5px_rgba(255,255,255,0.2)]",
                  item.status === "done" && "bg-emerald-500/20 text-emerald-100",
                  item.status === "planned" && "bg-brand/20 text-brand",
                  item.status === "rest" && "bg-slate-700/50 text-slate-200"
                )}
              >
                {item.day}
              </div>
              <div className="text-sm text-slate-300">{item.label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
