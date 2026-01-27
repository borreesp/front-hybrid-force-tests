import React from "react";
import { Button, Card, Input, Section } from "@thrifty/ui";

export default function NewWorkoutScreen() {
  return (
    <Section title="Nuevo workout" description="Define foco y duración">
      <Card>
        <Input label="Nombre" placeholder="Hybrid Sprint" />
        <Input label="Duración" placeholder="45 minutos" />
        <Input label="Foco" placeholder="Cardio / Fuerza / Mixto" />
        <Button className="mt-3" label="Guardar workout" />
      </Card>
    </Section>
  );
}
