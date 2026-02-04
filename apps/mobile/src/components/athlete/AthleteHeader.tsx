import { Text, View } from "react-native";
import { Card } from "@thrifty/ui";
import { Avatar } from "../Avatar";
import { formatNumber, clamp } from "../../utils/format";

type AthleteHeaderProps = {
  name: string;
  avatarUri?: string | null;
  level?: number | null;
  xpTotal?: number | null;
  team?: string | null;
  status?: string | null;
  statusTone?: "emerald" | "amber" | "slate";
  progressPct?: number | null;
};

const statusStyles: Record<NonNullable<AthleteHeaderProps["statusTone"]>, string> = {
  emerald: "border-emerald-400/40 bg-emerald-500/10",
  amber: "border-amber-400/40 bg-amber-500/10",
  slate: "border-white/10 bg-slate-800/60",
};

export const AthleteHeader: React.FC<AthleteHeaderProps> = ({
  name,
  avatarUri,
  level,
  xpTotal,
  team,
  status,
  statusTone = "slate",
  progressPct,
}) => {
  const safeProgress = clamp(Number(progressPct ?? 0), 0, 100);
  const levelLabel = level != null ? `Nivel ${level}` : "Nivel 0";
  const teamLabel = team && team.trim().length ? team : "Sin equipo";

  return (
    <Card className="bg-slate-900/80">
      <View className="flex-row items-center gap-3">
        <Avatar uri={avatarUri ?? undefined} name={name} size={56} />
        <View className="flex-1">
          <Text className="text-xs uppercase tracking-[0.2em] text-slate-400">Atleta</Text>
          <Text className="text-2xl font-semibold text-white">{name}</Text>
          <Text className="text-sm text-slate-300">
            {levelLabel}
            {xpTotal != null ? ` · ${formatNumber(xpTotal)} XP` : ""}
          </Text>
        </View>
        {status ? (
          <View className={`rounded-full border px-3 py-1 ${statusStyles[statusTone]}`}>
            <Text className="text-xs text-slate-100">Estado: {status}</Text>
          </View>
        ) : null}
      </View>

      <View className="mt-4 flex-row gap-3">
        <View className="flex-1 rounded-lg bg-white/5 px-3 py-2">
          <Text className="text-[11px] uppercase tracking-[0.12em] text-slate-400">
            Nivel actual
          </Text>
          <Text className="mt-1 text-sm font-semibold text-white">{levelLabel}</Text>
        </View>
        <View className="flex-1 rounded-lg bg-white/5 px-3 py-2">
          <Text className="text-[11px] uppercase tracking-[0.12em] text-slate-400">
            Equipo
          </Text>
          <Text className="mt-1 text-sm font-semibold text-white">{teamLabel}</Text>
        </View>
      </View>

      <View className="mt-4">
        <Text className="text-xs text-slate-400">Al siguiente nivel</Text>
        <View className="mt-2 h-2 w-full rounded-full bg-slate-800">
          <View className="h-2 rounded-full bg-cyan-400" style={{ width: `${safeProgress}%` }} />
        </View>
        <Text className="mt-1 text-xs text-slate-400">{safeProgress}% completado</Text>
      </View>
    </Card>
  );
};
