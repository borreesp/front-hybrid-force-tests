import * as SecureStore from "expo-secure-store";

const ACCESS_KEY = "hf_access_token";
const REFRESH_KEY = "hf_refresh_token";

export type StoredTokens = {
  accessToken?: string;
  refreshToken?: string;
};

export async function getTokens(): Promise<StoredTokens | null> {
  try {
    const [accessToken, refreshToken] = await Promise.all([
      SecureStore.getItemAsync(ACCESS_KEY),
      SecureStore.getItemAsync(REFRESH_KEY)
    ]);

    if (!accessToken && !refreshToken) return null;

    return {
      accessToken: accessToken ?? undefined,
      refreshToken: refreshToken ?? undefined
    };
  } catch {
    return null;
  }
}

export async function setTokens(tokens: StoredTokens): Promise<void> {
  try {
    if (tokens.accessToken) {
      await SecureStore.setItemAsync(ACCESS_KEY, tokens.accessToken);
    } else {
      await SecureStore.deleteItemAsync(ACCESS_KEY);
    }

    if (tokens.refreshToken) {
      await SecureStore.setItemAsync(REFRESH_KEY, tokens.refreshToken);
    } else {
      await SecureStore.deleteItemAsync(REFRESH_KEY);
    }
  } catch {
    // ignore secure store errors to avoid hard crash
  }
}

export async function clearTokens(): Promise<void> {
  try {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_KEY),
      SecureStore.deleteItemAsync(REFRESH_KEY)
    ]);
  } catch {
    // ignore secure store errors
  }
}
