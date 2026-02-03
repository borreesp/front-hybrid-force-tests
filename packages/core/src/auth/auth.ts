import { getStorage } from "../storage";
import { api } from "../api";
import { AuthUser } from "../types";

const TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

/**
 * Store authentication tokens
 */
export async function storeTokens(accessToken: string, refreshToken?: string): Promise<void> {
  await getStorage().setItem(TOKEN_KEY, accessToken);
  if (refreshToken) {
    await getStorage().setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
}

/**
 * Get access token
 */
export async function getAccessToken(): Promise<string | null> {
  return getStorage().getItem(TOKEN_KEY);
}

/**
 * Get refresh token
 */
export async function getRefreshToken(): Promise<string | null> {
  return getStorage().getItem(REFRESH_TOKEN_KEY);
}

/**
 * Clear all auth tokens
 */
export async function clearTokens(): Promise<void> {
  await getStorage().multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY]);
}

/**
 * Login with email and password
 */
export async function login(email: string, password: string): Promise<AuthUser> {
  const res = await api.login(email, password);

  if (res.tokens?.access_token) {
    await storeTokens(res.tokens.access_token, res.tokens.refresh_token);
  }

  return res.user;
}

/**
 * Register new user
 */
export async function register(name: string, email: string, password: string): Promise<AuthUser> {
  const res = await api.register(name, email, password);

  if (res.tokens?.access_token) {
    await storeTokens(res.tokens.access_token, res.tokens.refresh_token);
  }

  return res.user;
}

/**
 * Logout user
 */
export async function logout(): Promise<void> {
  try {
    await api.logout();
  } finally {
    await clearTokens();
  }
}

/**
 * Get current user (hydrate session)
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = await getAccessToken();
  if (!token) return null;

  try {
    const res = await api.me();
    return res.user;
  } catch (error) {
    // Try to refresh token
    try {
      const refreshed = await api.refresh();
      if (refreshed?.access_token) {
        await storeTokens(refreshed.access_token, refreshed.refresh_token || undefined);
        const res = await api.me();
        return res.user;
      }
    } catch {
      await clearTokens();
      return null;
    }

    await clearTokens();
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const token = await getAccessToken();
  return !!token;
}
