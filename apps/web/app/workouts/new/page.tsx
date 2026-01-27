import { Button, Card, Input, Section } from "@thrifty/ui";
import React from "react";

export default function NewWorkoutPage() {
  return (
    <Section
      title="Crear entrenamiento"
      description="Define objetivos, duración y foco principal."
      className="max-w-4xl"
    >
      <Card>
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Nombre" placeholder="Hybrid Sprint" />
          <Input label="Duración" placeholder="45 minutos" />
          <Input label="Foco" placeholder="Cardio / Fuerza / Mixto" />
          <Input label="Nivel objetivo" placeholder="Base / Intermedio / Avanzado" />
        </div>
        <div className="mt-4 flex items-center justify-end gap-3">
          <Button variant="ghost">Cancelar</Button>
          <Button variant="primary">Guardar workout</Button>
        </div>
      </Card>
    </Section>
  );
}
