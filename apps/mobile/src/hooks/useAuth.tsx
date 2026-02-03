import { useCallback, useEffect, useRef } from "react";
import { useRouter, useSegments } from "expo-router";
import * as auth from "../core/auth";
import { useAppStore } from "@thrifty/utils";

export function useAuth() {
  const router = useRouter();
  const segments = useSegments();

  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);
  const authLoading = useAppStore((s) => s.authLoading);
  const setAuthLoading = useAppStore((s) => s.setAuthLoading);
  const hydrated = useAppStore((s) => s.hydrated);
  const setHydrated = useAppStore((s) => s.setHydrated);
  const authError = useAppStore((s) => s.authError);
  const setAuthError = useAppStore((s) => s.setAuthError);

  const hydrating = useRef(false);

  const clearAuthState = useCallback(() => {
    hydrating.current = false;
    setUser(null);
    setAuthError(null);
    setAuthLoading(false);
    setHydrated(true);
  }, [setAuthError, setAuthLoading, setHydrated, setUser]);

  const hydrate = useCallback(async () => {
    if (hydrating.current || hydrated) return;

    hydrating.current = true;
    setAuthLoading(true);

    try {
      const currentUser = await auth.getCurrentUser();
      if (currentUser) {
        setUser({
          id: String(currentUser.id),
          name: currentUser.name,
          email: currentUser.email,
          level: "",
          role: currentUser.role
        });
        setAuthError(null);
      } else {
        clearAuthState();
      }
    } catch (error) {
      clearAuthState();
    } finally {
      setAuthLoading(false);
      setHydrated(true);
      hydrating.current = false;
    }
  }, [clearAuthState, hydrated, setAuthError, setAuthLoading, setHydrated, setUser]);

  // Hydrate on mount
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Protected routes
  useEffect(() => {
    if (authLoading || !hydrated) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!user && !inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace("/(auth)/login");
    } else if (user && inAuthGroup) {
      // Redirect to app if authenticated
      router.replace("/(tabs)");
    }
  }, [authLoading, hydrated, segments, router, user]);

  const login = useCallback(
    async (email: string, password: string) => {
      setAuthLoading(true);
      try {
        const authUser = await auth.login(email, password);
        setUser({
          id: String(authUser.id),
          name: authUser.name,
          email: authUser.email,
          level: "",
          role: authUser.role
        });
        setAuthError(null);
        setHydrated(true);
        router.replace("/(tabs)");
      } catch (err: any) {
        const message =
          err?.message ||
          (typeof err === "string" ? err : null) ||
          "Credenciales incorrectas o servidor no disponible";
        setAuthError(message);
        throw err;
      } finally {
        setAuthLoading(false);
      }
    },
    [router, setAuthError, setAuthLoading, setHydrated, setUser]
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      setAuthLoading(true);
      try {
        const authUser = await auth.register(name, email, password);
        setUser({
          id: String(authUser.id),
          name: authUser.name,
          email: authUser.email,
          level: "",
          role: authUser.role
        });
        setAuthError(null);
        setHydrated(true);
        router.replace("/(tabs)");
      } catch (err: any) {
        const message =
          err?.message ||
          (typeof err === "string" ? err : null) ||
          "No pudimos crear tu cuenta, intenta de nuevo.";
        setAuthError(message);
        throw err;
      } finally {
        setAuthLoading(false);
      }
    },
    [router, setAuthError, setAuthLoading, setHydrated, setUser]
  );

  const logout = useCallback(async () => {
    setAuthLoading(true);
    try {
      await auth.logout();
    } finally {
      clearAuthState();
      router.replace("/(auth)/login");
    }
  }, [clearAuthState, router, setAuthLoading]);

  const clearAuthErrorFn = useCallback(() => setAuthError(null), [setAuthError]);

  return {
    user,
    authLoading,
    authError,
    hydrated,
    login,
    logout,
    register,
    clearAuthError: clearAuthErrorFn
  };
}
