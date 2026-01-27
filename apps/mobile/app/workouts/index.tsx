import React from "react";
import { Button, Card, Section } from "@thrifty/ui";

const workouts = [
  { name: "Engine Builder", focus: "Cardio · 45min" },
  { name: "Strength Complex", focus: "Fuerza · 60min" },
  { name: "Hybrid Sprint", focus: "Mixto · 30min" }
];

export default function WorkoutsScreen() {
  return (
    <Section title="Workouts" description="Tu plan semanal">
      {workouts.map((w) => (
        <Card key={w.name} title={w.name} subtitle={w.focus}>
          <Button className="mt-2" size="sm" variant="primary" label="Programar" />
        </Card>
      ))}
    </Section>
  );
}
