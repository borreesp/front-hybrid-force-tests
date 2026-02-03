const FALLBACK_LOCALE = "es-ES";

function getLocale() {
  try {
    const resolved = Intl?.DateTimeFormat?.().resolvedOptions?.().locale;
    return resolved || FALLBACK_LOCALE;
  } catch {
    return FALLBACK_LOCALE;
  }
}

export function clamp(value: number, min: number, max: number) {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export function formatDate(input?: string | Date | null) {
  if (!input) return "-";
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) {
    return typeof input === "string" ? input : "-";
  }
  const locale = getLocale();
  try {
    return new Intl.DateTimeFormat(locale, {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }).format(date);
  } catch {
    try {
      return date.toLocaleDateString(FALLBACK_LOCALE, {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });
    } catch {
      return date.toDateString();
    }
  }
}

export function formatTimeSeconds(seconds?: number | null) {
  if (!seconds || seconds <= 0) return "--:--";
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.floor(seconds % 60);
  return `${minutes}:${remaining.toString().padStart(2, "0")}`;
}

export function formatNumber(value?: number | null) {
  if (value === null || value === undefined) return "-";
  if (!Number.isFinite(value)) return "-";
  const locale = getLocale();
  try {
    return new Intl.NumberFormat(locale).format(value);
  } catch {
    return String(value);
  }
}
