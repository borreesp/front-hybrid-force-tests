"use client";
import React, { useState } from "react";
import { cn } from "@thrifty/utils";

type NavLink = {
  label: string;
  href: string;
};

type AppHeaderProps = {
  links?: NavLink[];
  cta?: React.ReactNode;
  className?: string;
};

const defaultLinks: NavLink[] = [
  { label: "Dashboard", href: "/" },
  { label: "Workouts", href: "/workouts" },
  { label: "Progreso", href: "/progress" },
  { label: "Perfil", href: "/profile" }
];

export const AppHeader: React.FC<AppHeaderProps> = ({
  links = defaultLinks,
  cta,
  className
}) => {
  const [open, setOpen] = useState(false);

  return (
    <header
      className={cn(
        // barra integrada con el fondo global
        "sticky top-0 z-40 mb-5 w-full border-b border-white/10 bg-gradient-to-b from-slate-950/95 via-slate-950/90 to-slate-900/85 backdrop-blur shadow-[0_18px_40px_rgba(15,23,42,0.9)]",
        className
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
        {/* Branding compacto, sin tarjeta flotante */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/20 text-brand shadow-soft">
            <span className="text-lg font-black tracking-tight">HF</span>
          </div>
          <div className="leading-tight">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-200 md:text-sm">
              HYBRIDFORCE
            </p>
            <p className="text-[11px] text-slate-400 md:text-xs">
              Atleta híbrido · MVP
            </p>
          </div>
        </div>

        {/* Navegación desktop */}
        <nav className="hidden items-center gap-6 text-sm text-slate-200 md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="hover-lift text-sm font-medium text-slate-200 transition-colors hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* CTA desktop */}
        <div className="hidden md:block">{cta}</div>

        {/* Menú móvil */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="hover-lift inline-flex items-center justify-center rounded-xl border border-white/15 bg-surface-alt/80 p-2 text-slate-100 md:hidden"
          aria-label="Abrir menú"
        >
          <span className="sr-only">Toggle menu</span>
          <div className="space-y-1.5">
            <span className="block h-0.5 w-5 rounded-full bg-slate-100 transition-transform" />
            <span className="block h-0.5 w-4 rounded-full bg-slate-300 transition-opacity" />
            <span className="block h-0.5 w-5 rounded-full bg-slate-100 transition-transform" />
          </div>
        </button>
      </div>

      {/* Menú móvil desplegable, pegado al header y sin efecto “tarjeta flotante” */}
      {open && (
        <nav className="mx-auto flex max-w-6xl flex-col gap-1 border-t border-white/10 bg-slate-950/95 px-4 pb-4 pt-2 text-sm text-slate-100 md:hidden">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 transition hover:bg-white/10"
            >
              <span>{link.label}</span>
            </a>
          ))}
          {cta && <div className="pt-2">{cta}</div>}
        </nav>
      )}
    </header>
  );
};
