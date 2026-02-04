/**
 * Centralized color tokens for the mobile app.
 * These values mirror tailwind.config.js for use in JS/TS contexts.
 */

export const colors = {
  brand: {
    DEFAULT: "#1FB6FF",
    dark: "#0EA5E9",
    accent: "#22C55E",
  },
  surface: {
    DEFAULT: "#0d1117",
    alt: "#111827",
    subtle: "rgba(15,23,42,0.8)",
  },
  tabBar: {
    background: "#0f172a",
    border: "rgba(255,255,255,0.08)",
    active: "#3b82f6",
    inactive: "#94a3b8",
  },
} as const;

export type Colors = typeof colors;
