import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { Card, Section } from "@thrifty/ui";
import { api } from "../src/core/api";
import type { Equipment } from "../src/core/types";
import { EmptyState, ErrorState } from "../src/components/State";
import { Skeleton } from "../src/components/Skeleton";
import { formatNumber } from "../src/utils/format";

export default function GearScreen() {
  const [gear, setGear] = useState<Equipment[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setStatus("loading");
    api
      .getEquipment()
      .then((items) => {
        if (!mounted) return;
        setGear(items ?? []);
        setStatus("idle");
      })
      .catch((err: any) => {
        if (!mounted) return;
        setError(err?.message ?? "No pudimos cargar el equipamiento.");
        setStatus("error");
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <ScrollView className="flex-1 bg-surface px-4 pb-10">
      <View className="mt-6">
        <Section title="Material recomendado" description="Equipamiento segun tu perfil y nivel.">
          {status === "loading" ? (
            <Card>
              <Skeleton height={16} width="70%" className="mb-2" />
              <Skeleton height={12} width="40%" />
            </Card>
          ) : null}
          {status === "error" && error ? <ErrorState message={error} /> : null}
          {status === "idle" ? (
            gear.length ? (
              gear.map((item) => (
                <Card
                  key={item.id}
                  title={item.name}
                  subtitle={item.category ? `Categoria: ${item.category}` : undefined}
                  className="mb-3"
                >
                  <Text className="text-slate-200">{item.description}</Text>
                  <View className="mt-2 flex-row items-center justify-between">
                    <Text className="text-xs text-slate-400">Precio</Text>
                    <Text className="text-sm text-white">{formatNumber(item.price)}</Text>
                  </View>
                </Card>
              ))
            ) : (
              <EmptyState title="Sin equipamiento" description="No hay recomendaciones disponibles." />
            )
          ) : null}
        </Section>
      </View>
    </ScrollView>
  );
}
