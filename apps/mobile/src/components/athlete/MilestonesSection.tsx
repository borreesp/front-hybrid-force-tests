import { Text, View } from "react-native";
import { Card, Section } from "@thrifty/ui";
import { EmptyState } from "../State";

export type MilestoneItem = {
  title: string;
  date: string;
  type?: string;
  delta?: string;
};

type MilestonesSectionProps = {
  items: MilestoneItem[];
};

export const MilestonesSection: React.FC<MilestonesSectionProps> = ({ items }) => {
  const hasItems = items.length > 0;

  return (
    <Section title="Historial de hitos y mejoras" description="Hitos recientes y mejoras destacadas.">
      <Card className="bg-slate-900/70">
        {hasItems ? (
          <View className="gap-3">
            {items.map((item, idx) => (
              <View
                key={`${item.title}-${idx}`}
                className="flex-row items-center gap-3 rounded-xl bg-white/5 px-3 py-2"
              >
                <View className="h-2 w-2 rounded-full bg-cyan-400" />
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-white">{item.title}</Text>
                  <Text className="text-xs text-slate-400">
                    {item.date}
                    {item.type ? ` · ${item.type}` : ""}
                  </Text>
                </View>
                {item.delta ? <Text className="text-xs text-emerald-300">{item.delta}</Text> : null}
              </View>
            ))}
          </View>
        ) : (
          <EmptyState
            title="Historial en preparacion"
            description="TODO: conectar endpoint de hitos y mejoras."
          />
        )}
      </Card>
    </Section>
  );
};
