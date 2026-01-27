import React from "react";
import { Text } from "react-native";
import { Button, Card, Section } from "@thrifty/ui";

const gear = [
  { name: "Zapatillas mixtas", level: "Challenger", recommendation: "Metcon / Nano" },
  { name: "Cinturón olímpico", level: "Challenger", recommendation: "Pioneer Lever" },
  { name: "Wearable", level: "Rookie+", recommendation: "Garmin / Coros" }
];

export default function GearScreen() {
  return (
    <Section
      title="Material recomendado"
      description="Equipamiento según tu nivel"
      actions={<Button variant="secondary" size="sm" label="Actualizar nivel" />}
    >
      {gear.map((item) => (
        <Card
          key={item.name}
          title={item.name}
          subtitle={`Nivel ${item.level}`}
          className="mb-3"
        >
          <Text className="text-slate-200">{item.recommendation}</Text>
          <Button className="mt-2" size="sm" variant="ghost" label="Ver detalles" />
        </Card>
      ))}
    </Section>
  );
}
