import React from "react";
import { Button, Card, Section } from "@thrifty/ui";
import { View, Text } from "react-native";

const achievements = [
  { title: "10K sub 45'", date: "2024-06-02" },
  { title: "Hyrox Rookie", date: "2024-04-10" }
];

export default function MilestonesScreen() {
  return (
    <Section
      title="Logros"
      description="Hitos desbloqueados"
      actions={<Button variant="primary" size="sm" label="Añadir hito" />}
    >
      <Card>
        <View className="gap-3">
          {achievements.map((item) => (
            <View key={item.title} className="rounded-lg border border-white/10 p-3">
              <Text className="text-sm text-slate-300">{item.date}</Text>
              <Text className="text-lg font-semibold text-white">{item.title}</Text>
            </View>
          ))}
        </View>
      </Card>
    </Section>
  );
}
