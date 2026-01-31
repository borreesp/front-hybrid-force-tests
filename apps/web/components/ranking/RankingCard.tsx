"use client";
import React from "react";
import { Card } from "@thrifty/ui";
import { HelpTooltip } from "../ui/HelpTooltip";
import type { RankingEntry, RankingDashboardMetric } from "../../lib/types";

const getInitials = (value: string) => {
  const cleaned = value.trim();
  if (!cleaned) return "??";
  const parts = cleaned.split(" ").filter(Boolean);
  const letters = parts.slice(0, 2).map((part) => part[0]);
  return letters.join("").toUpperCase();
};

type RankingCardProps = {
  title: string;
  metric: RankingDashboardMetric;
  entries: RankingEntry[];
  isLoading?: boolean;
  currentUserId?: string | number | null;
  onOpenTop10?: () => void;
  formatValue: (metric: RankingDashboardMetric, value: number) => string;
  helpKey?: string;
};

export const RankingCard: React.FC<RankingCardProps> = ({
  title,
  metric,
  entries,
  isLoading = false,
  currentUserId,
  onOpenTop10,
  formatValue,
  helpKey
}) => {
  if (isLoading) {
    return (
      <Card className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 shadow-[0_12px_30px_rgba(0,0,0,0.4)]">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-24 rounded-full bg-white/10" />
          <div className="h-10 w-32 rounded-2xl bg-white/10" />
          <div className="h-5 w-40 rounded-full bg-white/10" />
          <div className="space-y-2">
            <div className="h-4 w-full rounded-full bg-white/10" />
            <div className="h-4 w-5/6 rounded-full bg-white/10" />
            <div className="h-4 w-2/3 rounded-full bg-white/10" />
          </div>
          <div className="h-8 w-28 rounded-full bg-white/10" />
        </div>
      </Card>
    );
  }

  const top = entries[0];
  const topThree = entries.slice(0, 3);
  const topName = top?.display_name || top?.name || "Sin datos";
  const topAvatar = top?.avatar_url || null;
  const trend = top?.trend ?? "same";
  const trendArrow = trend === "up" ? "↑" : trend === "down" ? "↓" : "=";
  const trendTone =
    trend === "up" ? "text-emerald-300" : trend === "down" ? "text-rose-300" : "text-slate-400";
  const previousValue = typeof top?.previous_value === "number" ? top.previous_value : null;
  const deltaValue = previousValue !== null ? top?.value - previousValue : null;
  const deltaLabel =
    deltaValue === null
      ? "Sin periodo anterior"
      : `${deltaValue > 0 ? "+" : deltaValue < 0 ? "-" : ""}${formatValue(metric, Math.abs(deltaValue))} vs periodo anterior`;

  return (
    <Card className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/70 via-slate-900/50 to-slate-950/80 p-5 shadow-[0_12px_35px_rgba(0,0,0,0.45)] ring-1 ring-white/5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{title}</p>
            {helpKey && <HelpTooltip helpKey={helpKey} />}
          </div>
          <p className="mt-3 text-3xl font-semibold text-white">
            {top ? formatValue(metric, top.value) : "-"}
          </p>
          {top && (
            <div className={`mt-2 flex items-center gap-2 text-xs ${trendTone}`}>
              <span className="text-sm font-semibold">{trendArrow}</span>
              <span className="text-slate-400">{deltaLabel}</span>
            </div>
          )}
          <div className="mt-2 flex items-center gap-2 text-sm text-slate-300">
            <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-200">
              TOP 1
            </span>
            <span className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/40 to-indigo-500/40 text-[11px] font-semibold text-white">
                {topAvatar ? (
                  <img src={topAvatar} alt={topName} className="h-full w-full rounded-full object-cover" />
                ) : (
                  getInitials(topName)
                )}
              </span>
              <span>{topName}</span>
            </span>
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] uppercase tracking-[0.2em] text-slate-400">
          #{top ? top.rank : "-"}
        </div>
      </div>

      <div className="mt-4 space-y-2 text-sm text-slate-200">
        {topThree.length ? (
          topThree.map((entry) => {
            const isCurrentUser = currentUserId && String(currentUserId) === String(entry.user_id);
            const displayName = entry.display_name || entry.name;
            const avatarUrl = entry.avatar_url || null;
            return (
              <div
                key={entry.user_id}
                className={`flex items-center justify-between rounded-xl border border-white/10 px-3 py-2 ${
                  isCurrentUser ? "bg-cyan-500/10" : "bg-white/5"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/30 to-indigo-500/30 text-[10px] font-semibold text-white">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={displayName} className="h-full w-full rounded-full object-cover" />
                    ) : (
                      getInitials(displayName)
                    )}
                  </span>
                  <span className="text-xs text-slate-400">#{entry.rank}</span>
                  <span className="text-sm font-semibold text-white">{displayName}</span>
                  {isCurrentUser && <span className="text-[10px] text-cyan-200">TU</span>}
                </div>
                <span className="text-xs text-slate-300">{formatValue(metric, entry.value)}</span>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-slate-400">Sin datos para este periodo.</p>
        )}
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={onOpenTop10}
          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-cyan-400/40 hover:text-white"
        >
          Ver Top 10
        </button>
      </div>
    </Card>
  );
};
