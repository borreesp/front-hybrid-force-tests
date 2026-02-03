import { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { Card, Section } from "@thrifty/ui";
import { api } from "../src/core/api";
import type { AthleteProfileResponse } from "../src/core/types";
import { EmptyState, ErrorState } from "../src/components/State";
import { Skeleton } from "../src/components/Skeleton";
import { formatDate, formatNumber } from "../src/utils/format";

export default function MilestonesScreen() {
  const [profile, setProfile] = useState<AthleteProfileResponse | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setStatus("loading");
    api
      .getAthleteProfile()
      .then((data) => {
        if (!mounted) return;
        setProfile(data);
        setStatus("idle");
      })
      .catch((err: any) => {
        if (!mounted) return;
        setError(err?.message ?? "No pudimos cargar tus logros.");
        setStatus("error");
      });
    return () => {
      mounted = false;
    };
  }, []);

  const milestones = useMemo(() => {
    const prs = profile?.prs ?? [];
    return [...prs]
      .sort((a, b) => {
        const da = a.achieved_at ? new Date(a.achieved_at).getTime() : 0;
        const db = b.achieved_at ? new Date(b.achieved_at).getTime() : 0;
        return db - da;
      })
      .slice(0, 10)
      .map((pr) => ({
        title: pr.movement ?? pr.pr_type ?? "PR",
        value: `${formatNumber(pr.value)}${pr.unit ? ` ${pr.unit}` : ""}`,
        date: pr.achieved_at ? formatDate(pr.achieved_at) : "-"
      }));
  }, [profile]);

  return (
    <ScrollView className="flex-1 bg-surface px-4 pb-10">
      <View className="mt-6">
        <Section title="Logros" description="Hitos basados en tus PRs registrados.">
          {status === "loading" ? (
            <Card>
              <Skeleton height={16} width="70%" className="mb-2" />
              <Skeleton height={12} width="40%" />
            </Card>
          ) : null}
          {status === "error" && error ? <ErrorState message={error} /> : null}
          {status === "idle" ? (
            <Card>
              <View className="gap-3">
                {milestones.length ? (
                  milestones.map((item) => (
                    <View key={`${item.title}-${item.date}`} className="rounded-lg border border-white/10 p-3">
                      <Text className="text-xs text-slate-400">{item.date}</Text>
                      <Text className="text-lg font-semibold text-white">{item.title}</Text>
                      <Text className="text-sm text-slate-300">{item.value}</Text>
                    </View>
                  ))
                ) : (
                  <EmptyState title="Sin logros" description="Registra un PR para ver hitos." />
                )}
              </View>
            </Card>
          ) : null}
        </Section>
      </View>
    </ScrollView>
  );
}
