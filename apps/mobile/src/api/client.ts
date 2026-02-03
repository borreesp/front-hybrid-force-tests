export type TokenPayload = {
  access_token?: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number;
};

export type ApiError = {
  status?: number;
  message: string;
  details?: unknown;
};

type ClientConfig = {
  baseUrl?: string;
  getAccessToken?: () => string | undefined;
  getRefreshToken?: () => string | undefined;
  setTokens?: (tokens: TokenPayload) => Promise<void> | void;
  clearTokens?: () => Promise<void> | void;
  refresh?: (refreshToken: string) => Promise<TokenPayload>;
  logout?: () => Promise<void> | void;
  logger?: (level: "info" | "warn" | "error", message: string, meta?: unknown) => void;
};

let config: ClientConfig | null = null;
let refreshPromise: Promise<TokenPayload> | null = null;
let logoutTriggered = false;
let baseUrlOverride: string | undefined;

export function configureClient(next: ClientConfig) {
  config = next;
}

export function setBaseUrl(next?: string) {
  baseUrlOverride = next ? String(next).replace(/\/$/, "") : undefined;
}

export function getBaseUrl() {
  const envUrl =
    process.env.EXPO_PUBLIC_API_BASE_URL || process.env.EXPO_PUBLIC_API_URL;
  const base = baseUrlOverride ?? config?.baseUrl ?? envUrl;
  if (!base || String(base).trim() === "") {
    throw makeError(undefined, "API base URL not configured");
  }
  return String(base).replace(/\/$/, "");
}

function buildUrl(path: string) {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${getBaseUrl()}${normalized}`;
}

async function parseResponse(res: Response) {
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      return await res.json();
    } catch {
      return null;
    }
  }
  return await res.text();
}

function makeError(status: number | undefined, message: string, details?: unknown): ApiError {
  const error: any = new Error(message);
  error.status = status;
  error.details = details;
  error.message = message;
  return error as ApiError;
}

function log(level: "info" | "warn" | "error", message: string, meta?: unknown) {
  config?.logger?.(level, message, meta);
}

async function triggerLogoutOnce() {
  if (logoutTriggered) return;
  logoutTriggered = true;
  try {
    if (config?.logout) {
      await config.logout();
    } else {
      await config?.clearTokens?.();
    }
  } finally {
    logoutTriggered = false;
  }
}

async function refreshTokensSingleFlight(): Promise<TokenPayload> {
  if (!config?.refresh) {
    throw makeError(401, "Refresh unavailable");
  }

  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = config.getRefreshToken?.();
    if (!refreshToken) {
      throw makeError(401, "Missing refresh token");
    }
    log("info", "auth.refresh.start");
    const tokens = await config.refresh(refreshToken);
    if (!tokens?.access_token && !tokens?.refresh_token) {
      throw makeError(401, "Invalid refresh response", tokens);
    }
    log("info", "auth.refresh.success");
    return tokens;
  })();

  try {
    return await refreshPromise;
  } catch (err) {
    log("warn", "auth.refresh.failed", err);
    throw err;
  } finally {
    refreshPromise = null;
  }
}

export async function fetchJson<T>(
  path: string,
  options: RequestInit = {},
  meta: { retry?: boolean } = {}
): Promise<T> {
  let url: string;
  try {
    url = buildUrl(path);
  } catch (err: any) {
    throw makeError(undefined, err?.message ?? "API base URL not configured");
  }
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  const accessToken = config?.getAccessToken?.();
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const res = await fetch(url, {
    ...options,
    headers
  });

  if (res.status === 401 && !meta.retry && config?.refresh) {
    try {
      const nextTokens = await refreshTokensSingleFlight();
      await config.setTokens?.(nextTokens);
      return fetchJson<T>(path, options, { retry: true });
    } catch (err: any) {
      await triggerLogoutOnce();
      throw makeError(err?.status ?? 401, err?.message ?? "Unauthorized", err?.details ?? err);
    }
  }

  const data = await parseResponse(res);

  if (!res.ok) {
    throw makeError(res.status, `Request failed (${res.status}): ${path}`, data);
  }

  return data as T;
}
