"use client";
import { Button, Card, Section } from "@thrifty/ui";
import React, { useEffect, useState } from "react";
import { api } from "../../lib/api";
import type { LookupTables } from "../../lib/types";

type Equipment = {
  id: number;
  name: string;
  description: string;
  price?: number;
  category?: string | null;
};

const FALLBACK: Equipment[] = [
  {
    id: 1,
    name: "Zapatillas mixtas",
    description: "Salomon Aero Glide / Nike Metcon",
    category: "Calzado"
  },
  {
    id: 2,
    name: "Cinturon olimpico",
    description: "Pioneer Lever",
    category: "Fuerza"
  }
];

export default function GearPage() {
  const [items, setItems] = useState<Equipment[]>(FALLBACK);
  const [lookups, setLookups] = useState<LookupTables | null>(null);

  useEffect(() => {
    api
      .getEquipment()
      .then((data: Equipment[]) => setItems(data))
      .catch(() => setItems(FALLBACK));
    api
      .getLookupTables()
      .then(setLookups)
      .catch(() => setLookups(null));
  }, []);

  return (
    <div className="space-y-4">
      <Section
        title="Material recomendado"
        description="Segun tu nivel y objetivo actual"
        actions={<Button variant="secondary">Actualizar nivel</Button>}
      >
        <div className="grid gap-4 md:grid-cols-3">
          {items.map((item) => (
            <Card
              key={item.id}
              title={item.name}
              subtitle={item.category ?? ""}
            >
              <p className="text-sm text-slate-300">{item.description}</p>
              <div className="mt-3 flex items-center justify-between">
                <Button variant="ghost" size="sm">
                  Ver detalles
                </Button>
                <Button variant="primary" size="sm">
                  Anadir a lista
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      <Section title="Muscle groups" description="Lookups conectados a backend">
        <div className="flex flex-wrap gap-2">
          {(lookups?.muscle_groups ?? []).map((m) => (
            <span key={m.id} className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-200">
              {m.name}
            </span>
          ))}
        </div>
      </Section>
    </div>
  );
}
