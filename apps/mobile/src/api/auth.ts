import { getBaseUrl } from "./client";

type AuthTokens = {
  access_token: string;
  refresh_token: string;
  token_type?: string;
  expires_in?: number;
  user?: any;
};

async function parseResponse(res: Response) {
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return res.json();
  }
  return res.text();
}

function buildUrl(path: string) {
  const base = getBaseUrl();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}

export async function loginMobile(email: string, password: string): Promise<AuthTokens> {
  const res = await fetch(buildUrl("/auth/login"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Client": "mobile"
    },
    body: JSON.stringify({ email, password })
  });

  const data = await parseResponse(res);
  if (!res.ok) {
    const error: any = new Error(`Login failed (${res.status})`);
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data as AuthTokens;
}

export async function refreshMobile(refreshToken: string): Promise<AuthTokens> {
  const res = await fetch(buildUrl("/auth/refresh"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Client": "mobile"
    },
    body: JSON.stringify({ refresh_token: refreshToken })
  });

  const data = await parseResponse(res);
  if (!res.ok) {
    const error: any = new Error(`Refresh failed (${res.status})`);
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data as AuthTokens;
}

export async function me(accessToken: string) {
  const res = await fetch(buildUrl("/auth/me"), {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
  const data = await parseResponse(res);
  if (!res.ok) {
    const error: any = new Error(`Me failed (${res.status})`);
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
}
