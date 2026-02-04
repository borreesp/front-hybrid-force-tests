import { Text, View } from "react-native";
import { Button, Section } from "@thrifty/ui";
import { EmptyState } from "../State";

export type Suggestion = {
  title: string;
  detail: string;
  cta: string;
  tone: "emerald" | "cyan" | "slate";
  href?: string;
};

type SuggestionsSectionProps = {
  suggestions: Suggestion[];
  onSelect?: (href: string) => void;
};

const toneStyles: Record<Suggestion["tone"], string> = {
  emerald: "border-emerald-400/30 bg-emerald-500/10",
  cyan: "border-cyan-400/30 bg-cyan-500/10",
  slate: "border-white/10 bg-slate-800/60",
};

export const SuggestionsSection: React.FC<SuggestionsSectionProps> = ({ suggestions, onSelect }) => {
  return (
    <Section title="Sugerencias" description="Acciones recomendadas segun tu progreso.">
      <View className="gap-3">
        {suggestions.length ? (
          suggestions.map((s) => (
            <View key={s.title} className={`rounded-2xl border p-4 ${toneStyles[s.tone]}`}>
              <Text className="text-xs uppercase tracking-[0.12em] text-white/70">Recomendado</Text>
              <Text className="mt-1 text-lg font-semibold text-white">{s.title}</Text>
              <Text className="mt-1 text-sm text-white/80">{s.detail}</Text>
              {s.href ? (
                <View className="mt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    label={s.cta}
                    onPress={() => onSelect?.(s.href as string)}
                  />
                </View>
              ) : null}
            </View>
          ))
        ) : (
          <EmptyState title="Sin sugerencias" description="TODO: conectar recomendaciones personalizadas." />
        )}
      </View>
    </Section>
  );
};
