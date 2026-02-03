import React from "react";
import { Text, View } from "react-native";
import { Button } from "@thrifty/ui";
import { cn } from "@thrifty/utils";

type ErrorStateProps = {
  message?: string;
  onRetry?: () => void;
  className?: string;
};

export const ErrorState: React.FC<ErrorStateProps> = ({ message, onRetry, className }) => {
  return (
    <View className={cn("rounded-lg border border-white/10 bg-surface/70 p-4", className)}>
      <Text className="text-sm text-amber-200">{message ?? "No pudimos cargar los datos."}</Text>
      {onRetry ? (
        <Button className="mt-3" variant="secondary" size="sm" label="Reintentar" onPress={onRetry} />
      ) : null}
    </View>
  );
};

type EmptyStateProps = {
  title?: string;
  description?: string;
  className?: string;
};

export const EmptyState: React.FC<EmptyStateProps> = ({ title = "Sin datos", description, className }) => {
  return (
    <View className={cn("rounded-lg border border-white/10 bg-surface/40 p-4", className)}>
      <Text className="text-sm font-semibold text-white">{title}</Text>
      {description ? <Text className="text-xs text-slate-400 mt-1">{description}</Text> : null}
    </View>
  );
};
