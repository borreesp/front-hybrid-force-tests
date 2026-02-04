import { Text, View } from "react-native";
import { Card } from "@thrifty/ui";
import { Avatar } from "../Avatar";
import { CircularProgress } from "../CircularProgress";
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

const statusTextStyles: Record<NonNullable<AthleteHeaderProps["statusTone"]>, string> = {
  emerald: "text-emerald-300",
  amber: "text-amber-300",
  slate: "text-slate-400",
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
  const teamLabel = team && team.trim().length ? team : null;

  return (
    <Card className="bg-slate-900/80">
      <View className="flex-row items-center gap-3">
        <Avatar uri={avatarUri ?? undefined} name={name} size={56} />
        <View className="flex-1">
          <Text className="text-xs uppercase tracking-[0.2em] text-slate-400">Atleta</Text>
          <Text className="text-2xl font-semibold text-white">{name}</Text>
          <Text className="text-sm text-slate-300">
            {levelLabel}
            {xpTotal != null ? ` - ${formatNumber(xpTotal)} XP` : ""}
          </Text>
          {teamLabel ? (
            <Text className="mt-1 text-xs text-slate-400">Equipo: {teamLabel}</Text>
          ) : null}
        </View>
        <View className="items-center">
          <CircularProgress
            value={safeProgress}
            size={76}
            strokeWidth={6}
            showValue
          />
          {status ? (
            <Text className={`mt-2 text-[11px] ${statusTextStyles[statusTone]}`}>
              {status}
            </Text>
          ) : null}
        </View>
      </View>
    </Card>
  );
};
