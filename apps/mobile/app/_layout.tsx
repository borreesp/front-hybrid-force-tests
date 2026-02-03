import "../global.css";
// NOTA: nativewind.ts eliminado - NativeWind v4 NO usa NativeWindStyleSheet.setOutput()
import { useEffect } from "react";
import { Platform } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import Constants from "expo-constants";
import { setApiBaseUrl } from "../src/core/api";

export default function RootLayout() {
  useEffect(() => {
    const envBase =
      process.env.EXPO_PUBLIC_API_BASE_URL ||
      process.env.EXPO_PUBLIC_API_URL ||
      Constants.expoConfig?.extra?.EXPO_PUBLIC_API_BASE_URL;
    let apiBaseUrl = envBase || "http://localhost:9000";

    if (Platform.OS === "android" && !Constants.isDevice && apiBaseUrl.includes("localhost")) {
      apiBaseUrl = apiBaseUrl.replace("localhost", "10.0.2.2");
    }

    setApiBaseUrl(apiBaseUrl.replace(/\/$/, ""));
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log(`[api] base url: ${apiBaseUrl}`);
    }
  }, []);

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#0f172a" }
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}
