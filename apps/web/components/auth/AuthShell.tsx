"use client";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { AppHeader, Button, Screen } from "@thrifty/ui";
import { useAuth } from "../../lib/auth-client";

export const AuthShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout, authLoading, hydrated } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isAuthRoute = pathname?.startsWith("/auth");
  const role = user?.role ?? "ATHLETE";
  const effectiveRole = role === "ADMIN" ? "COACH" : role;

  const roleHome =
    effectiveRole === "COACH" ? "/coach/athletes" : "/athlete";

  const isAllowedPath = (path?: string | null) => {
    if (!path) return false;
    if (path.startsWith("/auth")) return true;
    if (effectiveRole === "COACH") {
      return (
        path.startsWith("/coach/athletes") ||
        path.startsWith("/coach/workouts") ||
        path.startsWith("/coach/structure")
      );
    }
    return path.startsWith("/athlete");
  };

  useEffect(() => {
    if (authLoading || !hydrated) return;
    if (!user && !isAuthRoute) {
      router.replace("/auth/login");
    }
    if (user && isAuthRoute && !pathname?.includes("register")) {
      router.replace(roleHome);
    }
    if (user && !isAuthRoute) {
      if (pathname === "/") {
        router.replace(roleHome);
        return;
      }
      if (!isAllowedPath(pathname)) {
        router.replace(roleHome);
        return;
      }
      if (effectiveRole === "COACH" && pathname?.startsWith("/admin/")) {
        router.replace("/coach/structure");
      }
      if (effectiveRole === "COACH" && pathname?.startsWith("/workouts/structure")) {
        router.replace("/coach/structure");
      }
      if (effectiveRole === "COACH" && pathname?.startsWith("/workouts")) {
        router.replace("/coach/workouts");
      }
      if (effectiveRole === "ATHLETE" && pathname?.startsWith("/workouts")) {
        router.replace("/athlete/workouts");
      }
    }
  }, [authLoading, hydrated, isAuthRoute, pathname, effectiveRole, roleHome, router, user]);

  if (!hydrated) return null;

  if (!user && !isAuthRoute) return null;

  return (
    <Screen className="pt-4">
      <AppHeader
        links={
          effectiveRole === "COACH"
            ? [
                { label: "Atletas", href: "/coach/athletes" },
                { label: "Workouts", href: "/coach/workouts" },
                { label: "Estructura", href: "/coach/structure" }
              ]
            : [
                { label: "Atleta", href: "/athlete" },
                { label: "Mis Workouts", href: "/athlete/workouts" }
              ]
        }
        cta={
          user ? (
            <div className="flex items-center gap-3 text-sm text-slate-200">
              <span>{user.name}</span>
              <Button variant="ghost" size="sm" onClick={logout} disabled={authLoading}>
                Cerrar sesion
              </Button>
            </div>
          ) : (
            <Button variant="primary" type="button" onClick={() => router.push("/auth/login")}>
              Empezar sesion
            </Button>
          )
        }
      />
      <main className="space-y-6 pb-12">{children}</main>
    </Screen>
  );
};
