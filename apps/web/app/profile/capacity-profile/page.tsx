"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Section, Card } from "@thrifty/ui";
import { HexRadarChart } from "../../../components/charts/HexRadarChart";
import { api } from "../../../lib/api";
import type { CapacityProfileItem } from "../../../lib/types";

export default function CapacityProfilePage() {
  const [items, setItems] = useState<CapacityProfileItem[]>([]);

  useEffect(() => {
    api
      .getCapacityProfile(1)
      .then((res) => setItems(res.capacities))
      .catch(() => setItems([]));
  }, []);

  const radarData = useMemo(
    () => items.map((c) => ({ label: c.capacity_code, value: c.value })),
    [items]
  );

  return (
    <div className="space-y-6">
      <Section title="Capacity profile" description="Perfil por capacidad f\u00edsica" actions={<div className="text-xs text-slate-400">user_id=1</div>}>
        <HexRadarChart data={radarData.length ? radarData : [{ label: "Resistencia", value: 70 }]} stroke="#8B5CF6" fill="#8B5CF6" />
      </Section>

      <Section title="Mediciones recientes">
        <Card>
          <div className="grid grid-cols-4 gap-3 text-xs text-slate-300">
            <span className="font-semibold text-slate-200">Capacidad</span>
            <span className="font-semibold text-slate-200">Valor</span>
            <span className="font-semibold text-slate-200">Fecha</span>
            <span className="font-semibold text-slate-200">Detalle</span>
            {items.map((c) => (
              <React.Fragment key={c.id}>
                <span>{c.capacity_name ?? c.capacity_code}</span>
                <span>{c.value}</span>
                <span>{new Date(c.measured_at).toLocaleString()}</span>
                <span className="text-slate-400">An\u00e1lisis backend</span>
              </React.Fragment>
            ))}
          </div>
        </Card>
      </Section>
    </div>
  );
}
