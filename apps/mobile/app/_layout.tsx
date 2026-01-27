import React from "react";
import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { NativeWindStyleSheet } from "nativewind";
import { AppHeader, Screen } from "@thrifty/ui";

NativeWindStyleSheet.setOutput({
  default: "native"
});

export default function RootLayout() {
  return (
    <Screen className="pt-4">
      <AppHeader />
      <Slot />
      <StatusBar style="light" />
    </Screen>
  );
}
