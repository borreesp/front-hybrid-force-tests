import React from "react";
import { Button, Card, Input, Section } from "@thrifty/ui";

export default function LoginScreen() {
  return (
    <Section title="Acceso" description="Sincroniza tu progreso" className="gap-3">
      <Card title="Iniciar sesión">
        <Input label="Email" placeholder="tu@correo.com" keyboardType="email-address" />
        <Input label="Contraseña" placeholder="••••••••" secureTextEntry />
        <Button className="mt-3" label="Entrar" />
        <Button className="mt-2" variant="ghost" size="sm" label="Recuperar acceso" />
      </Card>
    </Section>
  );
}
