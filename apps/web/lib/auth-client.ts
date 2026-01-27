"use client";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import { api } from "./api";
import { useAppStore } from "@thrifty/utils";

export function useAuth() {
  const router = useRouter();
  const pathname = usePathname();
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
      const res = await api.me();
      setUser({ id: String(res.user.id), name: res.user.name, level: "", email: res.user.email });
      setAuthError(null);
    } catch {
      try {
        const refreshed = await api.refresh();
        if (refreshed?.access_token) {
          const res = await api.me();
          setUser({ id: String(res.user.id), name: res.user.name, level: "", email: res.user.email });
          setAuthError(null);
        } else {
          clearAuthState();
        }
      } catch {
        clearAuthState();
      }
    } finally {
      setAuthLoading(false);
      setHydrated(true);
      hydrating.current = false;
    }
  }, [clearAuthState, hydrated, setAuthError, setAuthLoading, setHydrated, setUser]);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (authLoading || !hydrated) return;
    const isAuthRoute = pathname?.startsWith("/auth");
    if (!user && !isAuthRoute) {
      router.replace("/auth/login");
    }
    if (user && isAuthRoute && !pathname?.includes("register")) {
      router.replace("/");
    }
  }, [authLoading, hydrated, pathname, router, user]);

  const login = useCallback(
    async (email: string, password: string) => {
      setAuthLoading(true);
      try {
        const res = await api.login(email, password);
        setUser({ id: String(res.user.id), name: res.user.name, email: res.user.email, level: "" });
        setAuthError(null);
        setHydrated(true);
        router.replace("/");
      } catch (err) {
        setAuthError("Credenciales incorrectas o servidor no disponible");
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
        const res = await api.register(name, email, password);
        setUser({ id: String(res.user.id), name: res.user.name, email: res.user.email, level: "" });
        setAuthError(null);
        setHydrated(true);
        router.replace("/");
      } catch (err) {
        setAuthError("No pudimos crear tu cuenta, intenta de nuevo.");
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
      await api.logout();
    } finally {
      clearAuthState();
      router.replace("/auth/login");
    }
  }, [clearAuthState, router]);

  const clearAuthError = useCallback(() => setAuthError(null), [setAuthError]);

  return { user, authLoading, authError, hydrated, login, logout, register, clearAuthError };
}
