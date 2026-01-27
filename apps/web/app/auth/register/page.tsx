"use client";
import { Button, Card, Input, Section } from "@thrifty/ui";
import React, { useState } from "react";
import { useAuth } from "../../../lib/auth-client";

export default function RegisterPage() {
  const { register, authLoading } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await register(name, email, password);
    } catch {
      setError("No se pudo registrar, verifica datos");
    }
  };

  return (
    <Section
      title="Crear cuenta"
      description="Configura tu perfil de atleta hibrido y empieza."
      className="max-w-3xl"
    >
      <Card title="Perfil basico">
        <form className="space-y-4" onSubmit={onSubmit}>
          <Input label="Nombre" placeholder="Alex Atleta" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="Email" type="email" placeholder="tu@correo.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input label="Contrasena" type="password" placeholder="********" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex items-center justify-end gap-3">
            <Button variant="ghost" size="sm" type="button" href="/auth/login">
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={authLoading}>
              Crear cuenta
            </Button>
          </div>
        </form>
      </Card>
    </Section>
  );
}
