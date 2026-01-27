import { Button, Card, Section } from "@thrifty/ui";
import React from "react";

const achievements = [
  { title: "10K sub 45'", date: "2024-06-02" },
  { title: "Hyrox Rookie", date: "2024-04-10" },
  { title: "RM sentadilla 1.8x BW", date: "2024-03-21" }
];

export default function MilestonesPage() {
  return (
    <Section
      title="Logros"
      description="Revisa hitos desbloqueados y los próximos a conseguir."
      actions={<Button variant="primary">Nuevo hito</Button>}
    >
      <Card>
        <div className="grid gap-3 md:grid-cols-2">
          {achievements.map((item) => (
            <div
              key={item.title}
              className="rounded-lg border border-white/10 bg-surface-alt/60 px-4 py-3"
            >
              <p className="text-sm text-slate-300">{item.date}</p>
              <p className="text-lg font-semibold text-white">{item.title}</p>
            </div>
          ))}
        </div>
      </Card>
    </Section>
  );
}
