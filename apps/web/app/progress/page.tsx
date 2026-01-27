"use client";
import { Button, Metric, Section } from "@thrifty/ui";
import React from "react";
import { LevelProgressList } from "../../components/profile/LevelProgressList";
import { HexRadarChart } from "../../components/charts/HexRadarChart";
import { TabbedSection } from "../../components/ui/TabbedSection";

const levels = [
  { name: "Rookie", percent: 100, summary: "Base aerobica estable" },
  { name: "Base", percent: 90, summary: "Carga controlada" },
  { name: "Challenger", percent: 72, summary: "Alta densidad de trabajo" },
  { name: "Elite", percent: 28, summary: "Volumen competitivo" },
  { name: "Pro", percent: 12, summary: "Picos de rendimiento" }
];

const radarPoints = [
  { label: "Fuerza", value: 78 },
  { label: "Engine", value: 82 },
  { label: "Velocidad", value: 74 },
  { label: "Potencia", value: 80 },
  { label: "Movilidad", value: 68 },
  { label: "Tactica", value: 72 }
];

export default function ProgressPage() {
  const tabs = [
    { id: "niveles", label: "Ruta de niveles" },
    { id: "atributos", label: "Atributos del atleta" }
  ];

  const renderTab = (active: string) => {
    if (active === "atributos") {
      return <HexRadarChart data={radarPoints} stroke="#FEC94F" fill="#FEC94F" />;
    }
    return <LevelProgressList levels={levels} />;
  };

  return (
    <div className="space-y-6">
      <Section
        title="Modo carrera"
        description="Estado por niveles y atributos clave."
        actions={<Button variant="secondary">Ver roadmap</Button>}
      >
        <div className="grid gap-4 md:grid-cols-3">
          <Metric label="Nivel actual" value="Challenger" hint="72% completado" trend="up" />
          <Metric label="XP acumulado" value="3,420" hint="+220 esta semana" trend="up" />
          <Metric label="Objetivo proximo" value="Elite" hint="4 bloques restantes" trend="neutral" />
        </div>
      </Section>

      <Section title="Modo carrera · detalle">
        <TabbedSection tabs={tabs} initialId="niveles" renderContent={renderTab} />
      </Section>
    </div>
  );
}
