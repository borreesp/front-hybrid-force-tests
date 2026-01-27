"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";

export type Step = { label: string; status: "pending" | "active" | "done" };

type Props = {
  active: boolean;
  title: string;
  subtitle?: string;
  steps?: Step[];
  fullScreen?: boolean;
};

export const AnalyzingOverlay: React.FC<Props> = ({ active, title, subtitle, steps = [], fullScreen = true }) => {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          className={`${fullScreen ? "fixed inset-0" : "absolute inset-0"} z-50 grid place-items-center bg-slate-950/70 backdrop-blur`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-[min(520px,90vw)] rounded-2xl border border-cyan-400/30 bg-slate-900/80 p-6 text-center shadow-[0_20px_70px_rgba(0,0,0,0.65)] ring-1 ring-white/10"
            initial={{ y: 12, opacity: 0.8 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.25 }}
          >
            <p className="text-xs uppercase tracking-[0.18em] text-cyan-200/80">Motor HybridForce</p>
            <h3 className="mt-2 text-2xl font-semibold text-white">{title}</h3>
            {subtitle && <p className="mt-1 text-sm text-slate-300">{subtitle}</p>}
            <div className="mt-5 space-y-3">
              {steps.map((step, idx) => (
                <div
                  key={`${step.label}-${idx}`}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left text-sm text-slate-200"
                >
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ${
                      step.status === "done"
                        ? "bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-400/40"
                        : step.status === "active"
                          ? "bg-cyan-500/20 text-cyan-200 ring-1 ring-cyan-400/40"
                          : "bg-white/5 text-slate-300 ring-1 ring-white/10"
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-white">{step.label}</p>
                    {step.status === "active" && (
                      <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-white/10">
                        <motion.div
                          className="h-full w-full bg-gradient-to-r from-cyan-400 via-indigo-400 to-cyan-300"
                          animate={{ x: ["-60%", "120%"] }}
                          transition={{ repeat: Infinity, duration: 1.3, ease: "easeInOut" }}
                        />
                      </div>
                    )}
                  </div>
                  {step.status === "done" && <span className="text-xs text-emerald-200">OK</span>}
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
