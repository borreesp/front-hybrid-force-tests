import React from "react";
import { Button, Card, Metric, Section } from "@thrifty/ui";
import { View, Text } from "react-native";

const levels = [
  { name: "Rookie", percent: 100 },
  { name: "Challenger", percent: 72 },
  { name: "Elite", percent: 28 }
];

export default function ProgressScreen() {
  return (
    <>
      <Section
        title="Modo carrera"
        description="Seguimiento de niveles y XP"
        actions={<Button variant="secondary" size="sm" label="Ver roadmap" />}
      >
        <Metric label="Nivel actual" value="Challenger" hint="72% completado" trend="up" />
        <Metric label="XP acumulado" value="3,420" hint="+220 esta semana" trend="up" />
      </Section>
      <Section title="Ruta de niveles">
        <Card>
          {levels.map((level) => (
            <View key={level.name} className="mb-3">
              <View className="mb-1 flex flex-row items-center justify-between">
                <Text className="text-sm text-slate-200">{level.name}</Text>
                <Text className="text-sm text-slate-400">{level.percent}%</Text>
              </View>
              <View className="h-2 w-full rounded-full bg-white/10">
                <View
                  className="h-2 rounded-full bg-brand"
                  style={{ width: `${level.percent}%` }}
                />
              </View>
            </View>
          ))}
        </Card>
      </Section>
    </>
  );
}
