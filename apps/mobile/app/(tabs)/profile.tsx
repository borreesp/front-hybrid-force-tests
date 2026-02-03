import { useEffect, useMemo, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View
} from "react-native";
import { Button, Card, Input, Section } from "@thrifty/ui";
import { api } from "../../src/core/api";
import type { UserSelfProfile, UserSelfProfileUpdate } from "../../src/core/types";
import { Avatar } from "../../src/components/Avatar";
import { ErrorState } from "../../src/components/State";
import { Skeleton } from "../../src/components/Skeleton";
import { useAuth } from "../../src/hooks/useAuth";

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

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<UserSelfProfile | null>(null);
  const [form, setForm] = useState<FormState>(() => buildFormState(null));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<"loading" | "idle" | "saving" | "success" | "error">("loading");
  const [message, setMessage] = useState<string | null>(null);
  const avatarInputRef = useRef<any>(null);

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
      .catch((err: any) => {
        if (!mounted) return;
        setStatus("error");
        setMessage(err?.message ?? "No se pudo cargar el perfil.");
      });
    return () => {
      mounted = false;
    };
  }, []);

  const displayName = form.displayName.trim() || profile?.name || user?.name || "";
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

  const handleSubmit = async () => {
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
      setMessage(err?.message ?? "No se pudo guardar.");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-surface"
    >
      <ScrollView className="flex-1 px-4 pb-10">
        <View className="mt-6 gap-4">
          <Section title="Mi perfil" description="Actualiza tus datos basicos y tu avatar.">
            {status === "loading" ? (
              <Card>
                <Skeleton height={16} width="70%" className="mb-2" />
                <Skeleton height={12} width="40%" />
              </Card>
            ) : null}

            {status === "error" && message ? <ErrorState message={message} /> : null}

            {status !== "loading" ? (
              <>
                <Card className="bg-slate-900/80">
                  <View className="items-center gap-3">
                    <Avatar
                      uri={form.avatarUrl || profile?.avatar_url || undefined}
                      name={displayName}
                      size={96}
                    />
                    <Text className="text-xl font-semibold text-white">
                      {displayName || avatarLabel}
                    </Text>
                    <Text className="text-xs text-slate-400">{user?.email ?? "-"}</Text>
                    {user?.role ? (
                      <Text className="text-[11px] text-slate-500">Rol: {user.role.toLowerCase()}</Text>
                    ) : null}
                    <Button
                      variant="ghost"
                      size="sm"
                      label="Cambiar foto"
                      onPress={() => avatarInputRef.current?.focus?.()}
                    />
                  </View>
                </Card>

                <Card className="bg-slate-900/80">
                  <Input
                    label="Nombre visible"
                    value={form.displayName}
                    onChangeText={(value) => setForm((prev) => ({ ...prev, displayName: value }))}
                    placeholder="Tu nombre publico"
                  />
                  <Input
                    label="Fecha de nacimiento"
                    value={form.dateOfBirth}
                    onChangeText={(value) => setForm((prev) => ({ ...prev, dateOfBirth: value }))}
                    placeholder="YYYY-MM-DD"
                  />
                  <Input
                    label="Peso (kg)"
                    value={form.weightKg}
                    onChangeText={(value) => setForm((prev) => ({ ...prev, weightKg: value }))}
                    placeholder="Ej: 72.5"
                    keyboardType="numeric"
                  />
                  {errors.weightKg ? <Text className="text-xs text-rose-300">{errors.weightKg}</Text> : null}
                  <Input
                    label="Altura (cm)"
                    value={form.heightCm}
                    onChangeText={(value) => setForm((prev) => ({ ...prev, heightCm: value }))}
                    placeholder="Ej: 178"
                    keyboardType="numeric"
                  />
                  {errors.heightCm ? <Text className="text-xs text-rose-300">{errors.heightCm}</Text> : null}
                  <Input
                    ref={avatarInputRef}
                    label="Avatar URL"
                    value={form.avatarUrl}
                    onChangeText={(value) => setForm((prev) => ({ ...prev, avatarUrl: value }))}
                    placeholder="https://"
                    autoCapitalize="none"
                  />

                  <View className="mt-3 flex-row flex-wrap items-center gap-3">
                    <Button
                      variant="primary"
                      label={status === "saving" ? "Guardando..." : "Guardar cambios"}
                      onPress={handleSubmit}
                      disabled={status === "saving"}
                    />
                    {status === "success" && message ? (
                      <Text className="text-sm text-emerald-300">{message}</Text>
                    ) : null}
                  </View>
                </Card>

                <Card className="bg-slate-900/70">
                  <Button
                    variant="ghost"
                    label="Cerrar sesion"
                    onPress={logout}
                  />
                </Card>
              </>
            ) : null}
          </Section>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
