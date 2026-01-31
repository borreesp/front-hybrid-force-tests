"use client";
import React from "react";
import type { RankingEntry, RankingDashboardMetric } from "../../lib/types";

const getInitials = (value: string) => {
  const cleaned = value.trim();
  if (!cleaned) return "??";
  const parts = cleaned.split(" ").filter(Boolean);
  const letters = parts.slice(0, 2).map((part) => part[0]);
  return letters.join("").toUpperCase();
};

type Top10ModalProps = {
  open: boolean;
  title: string;
  metric: RankingDashboardMetric;
  entries: RankingEntry[];
  currentUserId?: string | number | null;
  onClose: () => void;
  formatValue: (metric: RankingDashboardMetric, value: number) => string;
};

export const Top10Modal: React.FC<Top10ModalProps> = ({
  open,
  title,
  metric,
  entries,
  currentUserId,
  onClose,
  formatValue
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur">
      <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-slate-900/90 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Top 10</p>
            <h3 className="text-xl font-semibold text-white">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200 hover:text-white"
          >
            Cerrar
          </button>
        </div>

        <div className="mt-4 space-y-2">
          {entries.slice(0, 10).map((entry) => {
            const isCurrentUser = currentUserId && String(currentUserId) === String(entry.user_id);
            const displayName = entry.display_name || entry.name;
            const avatarUrl = entry.avatar_url || null;
            return (
              <div
                key={entry.user_id}
                className={`flex items-center justify-between rounded-xl border border-white/10 px-3 py-2 text-sm ${
                  isCurrentUser ? "bg-cyan-500/10 text-white" : "bg-white/5 text-slate-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/30 to-indigo-500/30 text-[11px] font-semibold text-white">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={displayName} className="h-full w-full rounded-full object-cover" />
                    ) : (
                      getInitials(displayName)
                    )}
                  </span>
                  <span className="text-xs text-slate-400">#{entry.rank}</span>
                  <span className="font-semibold">{displayName}</span>
                  {isCurrentUser && <span className="text-[10px] text-cyan-200">TU</span>}
                </div>
                <span className="text-xs text-slate-300">{formatValue(metric, entry.value)}</span>
              </div>
            );
          })}
          {!entries.length && <p className="text-sm text-slate-400">Sin datos para este periodo.</p>}
        </div>
      </div>
    </div>
  );
};
