import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../api";
import type { AuthUser } from "../types";

const TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

export async function storeTokens(accessToken: string, refreshToken?: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, accessToken);
  if (refreshToken) {
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
}

export async function getAccessToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return AsyncStorage.getItem(REFRESH_TOKEN_KEY);
}

export async function clearTokens(): Promise<void> {
  await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY]);
}

export async function isAuthenticated(): Promise<boolean> {
  const token = await getAccessToken();
  return !!token;
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const res = await api.login(email, password);
  if (res.tokens?.access_token) {
    await storeTokens(res.tokens.access_token, res.tokens.refresh_token);
  }
  return res.user;
}

export async function register(name: string, email: string, password: string): Promise<AuthUser> {
  const res = await api.register(name, email, password);
  if (res.tokens?.access_token) {
    await storeTokens(res.tokens.access_token, res.tokens.refresh_token);
  }
  return res.user;
}

export async function logout(): Promise<void> {
  try {
    await api.logout();
  } finally {
    await clearTokens();
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = await getAccessToken();
  if (!token) return null;

  try {
    const res = await api.me();
    return res.user;
  } catch (error) {
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
