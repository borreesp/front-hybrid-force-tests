import { create } from "zustand";

import { loginMobile, me, refreshMobile } from "../api/auth";
import { configureClient, TokenPayload } from "../api/client";
import { clearTokens, getTokens, setTokens, StoredTokens } from "./session";

type AuthState = {
  loading: boolean;
  isAuthenticated: boolean;
  accessToken?: string;
  refreshToken?: string;
  user?: any;
  bootstrap: () => Promise<void>;
  login: (email: string, password: string) => Promise<TokenPayload>;
  invalidateAccessToken: () => Promise<void>;
  logout: () => Promise<void>;
};

const emptyAuthState = {
  isAuthenticated: false,
  accessToken: undefined,
  refreshToken: undefined,
  user: undefined
};

function normalizeTokens(tokens: TokenPayload | StoredTokens) {
  return {
    accessToken:
      (tokens as TokenPayload).access_token ?? (tokens as StoredTokens).accessToken,
    refreshToken:
      (tokens as TokenPayload).refresh_token ?? (tokens as StoredTokens).refreshToken
  };
}

export const useAuthStore = create<AuthState>((set) => ({
  loading: false,
  ...emptyAuthState,
  bootstrap: async () => {
    set({ loading: true });
    const stored = await getTokens();
    if (stored) {
      set({
        accessToken: stored.accessToken,
        refreshToken: stored.refreshToken,
        isAuthenticated: Boolean(stored.accessToken || stored.refreshToken)
      });
    } else {
      set({ ...emptyAuthState });
    }
    set({ loading: false });
  },
  login: async (email: string, password: string) => {
    set({ loading: true });
    try {
      const tokens = await loginMobile(email, password);
      const normalized = normalizeTokens(tokens);
      await setTokens(normalized);
      set({
        accessToken: normalized.accessToken,
        refreshToken: normalized.refreshToken,
        isAuthenticated: Boolean(normalized.accessToken)
      });
      try {
        if (normalized.accessToken) {
          const meResponse = await me(normalized.accessToken);
          set({ user: (meResponse as any)?.user ?? meResponse });
        }
      } catch {
        // ignore hydration errors
      }
      return tokens;
    } finally {
      set({ loading: false });
    }
  },
  invalidateAccessToken: async () => {
    const current = useAuthStore.getState();
    const next = { accessToken: undefined, refreshToken: current.refreshToken };
    await setTokens(next);
    set({
      accessToken: undefined,
      refreshToken: current.refreshToken,
      isAuthenticated: Boolean(current.refreshToken)
    });
  },
  logout: async () => {
    set({ loading: true });
    await clearTokens();
    set({ ...emptyAuthState, loading: false });
  }
}));

async function applyTokens(tokens: TokenPayload) {
  const normalized = normalizeTokens(tokens);
  await setTokens(normalized);
  useAuthStore.setState({
    accessToken: normalized.accessToken,
    refreshToken: normalized.refreshToken,
    isAuthenticated: Boolean(normalized.accessToken)
  });
}

configureClient({
  baseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || process.env.EXPO_PUBLIC_API_URL,
  getAccessToken: () => useAuthStore.getState().accessToken,
  getRefreshToken: () => useAuthStore.getState().refreshToken,
  setTokens: applyTokens,
  clearTokens: async () => {
    await clearTokens();
    useAuthStore.setState({ ...emptyAuthState, loading: false });
  },
  refresh: refreshMobile,
  logout: async () => {
    await useAuthStore.getState().logout();
  }
});
