import React from "react";
import { View, Text } from "react-native";
import { Link } from "expo-router";
import { cn } from "@thrifty/utils";

type NavLink = {
  label: string;
  href: string;
};

type AppHeaderProps = {
  links?: NavLink[];
  className?: string;
};

const defaultLinks: NavLink[] = [
  { label: "Dashboard", href: "/" },
  { label: "Workouts", href: "/workouts" },
  { label: "Progreso", href: "/progress" }
];

export const AppHeader: React.FC<AppHeaderProps> = ({
  links = defaultLinks,
  className
}) => {
  return (
    <View
      className={cn(
        "mb-4 flex flex-row items-center justify-between border-b border-white/10 pb-3",
        className
      )}
    >
      <View className="flex flex-row items-center gap-2">
        <View className="h-10 w-10 items-center justify-center rounded-xl bg-brand/20">
          <Text className="text-lg font-black text-brand text-center">HF</Text>
        </View>
        <View>
          <Text className="text-sm uppercase tracking-[0.08em] text-slate-300">
            HybridForce
          </Text>
          <Text className="text-xs text-slate-400">Atleta híbrido · MVP</Text>
        </View>
      </View>
      <View className="flex flex-row gap-3">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-sm text-slate-200 underline decoration-white/20"
          >
            {link.label}
          </Link>
        ))}
      </View>
    </View>
  );
};
