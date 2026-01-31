"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button, Card, Section } from "@thrifty/ui";
import { api } from "../../lib/api";
import type { UserSelfProfile, UserSelfProfileUpdate } from "../../lib/types";
import { Input } from "../../components/ui/Input";

const getInitials = (value: string) => {
  const cleaned = value.trim();
  if (!cleaned) return "??";
  const parts = cleaned.split(" ").filter(Boolean);
  const letters = parts.slice(0, 2).map((part) => part[0]);
  return letters.join("").toUpperCase();
};

type FormState = {
  displayName: string;
  avatarUrl: string;
  heightCm: string;
  weightKg: string;
  dateOfBirth: string;
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

const buildFormState = (profile: UserSelfProfile | null): FormState => {
  return {
    displayName: profile?.display_name || profile?.name || "",
    avatarUrl: profile?.avatar_url || "",
    heightCm: profile?.height_cm ? String(profile.height_cm) : "",
    weightKg: profile?.weight_kg ? String(profile.weight_kg) : "",
    dateOfBirth: profile?.date_of_birth ? profile.date_of_birth.slice(0, 10) : ""
  };
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserSelfProfile | null>(null);
  const [form, setForm] = useState<FormState>(() => buildFormState(null));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<"loading" | "idle" | "saving" | "success" | "error">("loading");
  const [message, setMessage] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let mounted = true;
    setStatus("loading");
    api
      .getMyProfile()
      .then((data) => {
        if (!mounted) return;
        setProfile(data);
        setForm(buildFormState(data));
        setStatus("idle");
      })
      .catch(() => {
        if (!mounted) return;
        setStatus("error");
        setMessage("No se pudo cargar el perfil.");
      });
    return () => {
      mounted = false;
    };
  }, []);

  const displayName = form.displayName.trim() || profile?.name || "";
  const avatarLabel = useMemo(() => getInitials(displayName), [displayName]);

  const validate = () => {
    const next: FieldErrors = {};
    if (form.heightCm) {
      const value = Number(form.heightCm);
      if (!Number.isFinite(value) || value < 100 || value > 250) {
        next.heightCm = "Altura entre 100 y 250 cm";
      }
    }
    if (form.weightKg) {
      const value = Number(form.weightKg);
      if (!Number.isFinite(value) || value < 20 || value > 350) {
        next.weightKg = "Peso entre 20 y 350 kg";
      }
    }
    return next;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setMessage("Corrige los campos marcados.");
      setStatus("error");
      return;
    }

    const payload: UserSelfProfileUpdate = {
      display_name: form.displayName.trim() || null,
      avatar_url: form.avatarUrl.trim() || null,
      height_cm: form.heightCm ? Number(form.heightCm) : null,
      weight_kg: form.weightKg ? Number(form.weightKg) : null,
      date_of_birth: form.dateOfBirth ? form.dateOfBirth : null
    };

    try {
      setStatus("saving");
      setMessage(null);
      const updated = await api.updateMyProfile(payload);
      setProfile(updated);
      setForm(buildFormState(updated));
      setStatus("success");
      setMessage("Perfil actualizado.");
    } catch (err: any) {
      setStatus("error");
      setMessage(err?.message || "No se pudo guardar.");
    }
  };

  return (
    <div className="space-y-6">
      <Section title="Mi perfil" description="Actualiza tus datos basicos y tu avatar.">
        <Card className="bg-slate-900/80 ring-1 ring-white/10">
          <div className="grid gap-6 md:grid-cols-[220px,1fr]">
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/40 to-indigo-500/40 text-3xl font-semibold text-white ring-2 ring-white/10">
                {form.avatarUrl ? (
                  <img
                    src={form.avatarUrl}
                    alt={displayName}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  avatarLabel
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => avatarInputRef.current?.focus()}
              >
                Cambiar foto
              </Button>
              <p className="text-xs text-slate-400">Pega una URL de imagen para tu avatar.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Nombre visible"
                  value={form.displayName}
                  onChange={(event) => setForm((prev) => ({ ...prev, displayName: event.target.value }))}
                  placeholder="Tu nombre publico"
                />
                <Input
                  label="Fecha de nacimiento"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(event) => setForm((prev) => ({ ...prev, dateOfBirth: event.target.value }))}
                />
                <Input
                  label="Peso (kg)"
                  value={form.weightKg}
                  onChange={(event) => setForm((prev) => ({ ...prev, weightKg: event.target.value }))}
                  placeholder="Ej: 72.5"
                  error={errors.weightKg}
                />
                <Input
                  label="Altura (cm)"
                  value={form.heightCm}
                  onChange={(event) => setForm((prev) => ({ ...prev, heightCm: event.target.value }))}
                  placeholder="Ej: 178"
                  error={errors.heightCm}
                />
                <div className="md:col-span-2">
                  <Input
                    ref={avatarInputRef}
                    label="Avatar URL"
                    value={form.avatarUrl}
                    onChange={(event) => setForm((prev) => ({ ...prev, avatarUrl: event.target.value }))}
                    placeholder="https://"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary" type="submit" disabled={status === "saving"}>
                  {status === "saving" ? "Guardando..." : "Guardar cambios"}
                </Button>
                {status === "success" && <span className="text-sm text-emerald-300">{message}</span>}
                {status === "error" && message && <span className="text-sm text-rose-300">{message}</span>}
                {status === "loading" && <span className="text-sm text-slate-400">Cargando perfil...</span>}
              </div>
            </form>
          </div>
        </Card>
      </Section>
    </div>
  );
}
