"use client";
import React from "react";
import { Section, Card } from "@thrifty/ui";

export default function ProfilePage() {
  return (
    <Section title="Perfil" description="Datos reales del atleta">
      <Card className="bg-slate-900/60 ring-1 ring-white/5">
        <p className="text-sm text-slate-300">
          Aun no hay datos de perfil. Cuando registres biometria, capacidades o sesiones, veras aqui tu informacion real.
        </p>
      </Card>
    </Section>
  );
}
