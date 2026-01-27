import React from "react";
import { Button, Card, Input, Section } from "@thrifty/ui";

export default function RegisterScreen() {
  return (
    <Section title="Crear cuenta" description="Configura tu perfil básico" className="gap-3">
      <Card>
        <Input label="Nombre" placeholder="Alex Atleta" />
        <Input label="Email" placeholder="tu@correo.com" keyboardType="email-address" />
        <Input label="Contraseña" placeholder="••••••••" secureTextEntry />
        <Button className="mt-3" label="Crear cuenta" />
      </Card>
    </Section>
  );
}
