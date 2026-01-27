import React from "react";
import { Button, Card, Metric, Section } from "@thrifty/ui";

const workouts = [
  { title: "Engine Builder", focus: "Cardio · 45min" },
  { title: "Strength Complex", focus: "Fuerza · 60min" }
];

export default function DashboardScreen() {
  return (
    <>
      <Section
        title="Dashboard"
        description="Tu semana de entrenamiento y objetivos."
        actions={<Button variant="secondary" size="sm" label="Sync wearables" />}
      >
        <Metric label="Sesiones / semana" value="5" trend="up" hint="+2 vs pasada" />
        <Metric label="Nivel actual" value="Challenger" hint="72% completado" trend="up" />
      </Section>

      <Section title="Workouts próximos">
        {workouts.map((item) => (
          <Card key={item.title} title={item.title} subtitle={item.focus}>
            <Button variant="primary" size="sm" label="Iniciar" />
          </Card>
        ))}
      </Section>
    </>
  );
}
