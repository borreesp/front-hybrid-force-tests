/**
 * Format seconds to MM:SS or HH:MM:SS
 */
export const formatSeconds = (totalSeconds: number): string => {
  if (!totalSeconds || totalSeconds < 0) return "0:00";

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

/**
 * Format date to readable string
 */
export const formatDate = (value: string | Date): string => {
  const date = typeof value === "string" ? new Date(value) : value;

  if (isNaN(date.getTime())) return "";

  const months = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
};

/**
 * Format date to short format (DD/MM)
 */
export const formatDateShort = (value: string | Date): string => {
  const date = typeof value === "string" ? new Date(value) : value;

  if (isNaN(date.getTime())) return "";

  const day = date.getDate();
  const month = date.getMonth() + 1;

  return `${day.toString().padStart(2, "0")}/${month.toString().padStart(2, "0")}`;
};

/**
 * Get relative time string (e.g., "hace 2 días")
 */
export const getRelativeTime = (value: string | Date): string => {
  const date = typeof value === "string" ? new Date(value) : value;

  if (isNaN(date.getTime())) return "";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Hoy";
  if (diffDays === 1) return "Ayer";
  if (diffDays < 7) return `Hace ${diffDays} días`;
  if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
  if (diffDays < 365) return `Hace ${Math.floor(diffDays / 30)} meses`;

  return `Hace ${Math.floor(diffDays / 365)} años`;
};

/**
 * Slugify a string
 */
export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "_")
    .replace(/^-+|-+$/g, "");
};

/**
 * Get initials from name
 */
export const getInitials = (name: string): string => {
  if (!name) return "?";

  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/**
 * Clamp a value between min and max
 */
export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, value));
};

/**
 * Get domain color
 */
export const getDomainColor = (domain?: string | null): string => {
  if (!domain) return "#94a3b8"; // slate-400

  const d = domain.toLowerCase();
  if (d.includes("cardio") || d.includes("metcon")) return "#22d3ee"; // cyan-400
  if (d.includes("fuerza") || d.includes("strength")) return "#fb923c"; // orange-400
  if (d.includes("hibrido") || d.includes("hybrid")) return "#a78bfa"; // violet-400
  if (d.includes("gimn")) return "#34d399"; // emerald-400

  return "#94a3b8";
};

/**
 * Get intensity color
 */
export const getIntensityColor = (intensity?: string | null): string => {
  if (!intensity) return "#64748b"; // slate-500

  const i = intensity.toLowerCase();
  if (i.includes("alta") || i.includes("high")) return "#f87171"; // red-400
  if (i.includes("media") || i.includes("medium")) return "#fbbf24"; // amber-400
  if (i.includes("baja") || i.includes("low")) return "#4ade80"; // green-400

  return "#64748b";
};

/**
 * Get level label
 */
export const getLevelLabel = (level: number): string => {
  if (level <= 2) return "Rookie";
  if (level <= 5) return "Iniciado";
  if (level <= 10) return "Competente";
  if (level <= 15) return "Avanzado";
  if (level <= 20) return "Élite";
  return "Leyenda";
};

/**
 * Get level color
 */
export const getLevelColor = (level: number): string => {
  if (level <= 2) return "#64748b"; // slate-500
  if (level <= 5) return "#22d3ee"; // cyan-400
  if (level <= 10) return "#a78bfa"; // violet-400
  if (level <= 15) return "#fb923c"; // orange-400
  if (level <= 20) return "#f59e0b"; // amber-500
  return "#fbbf24"; // amber-400
};
