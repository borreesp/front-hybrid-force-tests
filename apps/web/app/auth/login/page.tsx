"use client";
import { Button, Card, Input, Section } from "@thrifty/ui";
import React, { useState } from "react";
import { useAuth } from "../../../lib/auth-client";

export default function LoginPage() {
  const { login, authLoading, authError, clearAuthError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    clearAuthError();
    try {
      await login(email, password);
    } catch (err) {
      setError("Credenciales incorrectas o servidor no disponible");
    }
  };

  return (
    <Section
      title="Acceso"
      description="Entra para sincronizar tu progreso y tus entrenamientos."
      className="max-w-3xl"
    >
      <Card title="Iniciar sesion" subtitle="Email + contrasena con cookies seguras">
        <form className="space-y-4" onSubmit={onSubmit}>
          <Input label="Email" type="email" placeholder="tu@correo.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input
            label="Contrasena"
            type="password"
            placeholder="********"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {(error || authError) && <p className="text-sm text-red-400">{error ?? authError}</p>}
          <div className="flex items-center justify-between">
            <Button type="submit" variant="primary" disabled={authLoading}>
              Entrar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => {
                setError(null);
                clearAuthError();
              }}
            >
              Recuperar acceso
            </Button>
          </div>
        </form>
      </Card>
    </Section>
  );
}
