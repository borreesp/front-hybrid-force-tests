import React from "react";
import { Button, Card, Input, Metric, Section } from "@thrifty/ui";

export default function ProfileScreen() {
  return (
    <>
      <Section title="Perfil" description="Datos clave de tu atleta">
        <Metric label="Nivel" value="Challenger" hint="72% completado" trend="up" />
        <Metric label="VO2max" value="53" hint="+1.2 vs mes pasado" trend="up" />
      </Section>
      <Section title="Datos personales">
        <Card>
          <Input label="Nombre" defaultValue="Alex Atleta" />
          <Input label="Altura" defaultValue="178 cm" />
          <Input label="Peso" defaultValue="78 kg" />
          <Button className="mt-3" label="Guardar" />
        </Card>
      </Section>
    </>
  );
}
