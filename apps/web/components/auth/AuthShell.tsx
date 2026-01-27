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

  useEffect(() => {
    if (authLoading || !hydrated) return;
    if (!user && !isAuthRoute) {
      router.replace("/auth/login");
    }
    if (user && isAuthRoute && !pathname?.includes("register")) {
      router.replace("/");
    }
  }, [authLoading, hydrated, isAuthRoute, pathname, router, user]);

  if (!hydrated) return null;

  if (!user && !isAuthRoute) return null;

  return (
    <Screen className="pt-4">
      <AppHeader
        links={[
          { label: "Dashboard", href: "/" },
          { label: "Atleta", href: "/athlete" },
          { label: "Analisis WOD", href: "/wod-analysis" },
          { label: "Workouts", href: "/workouts" },
          { label: "Estructura", href: "/workouts/structure" },
          { label: "Carga", href: "/profile/training-load" },
          { label: "Lookups", href: "/lookups" }
        ]}
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
