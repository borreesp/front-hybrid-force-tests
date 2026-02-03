import "../global.css";
// NOTA: nativewind.ts eliminado - NativeWind v4 NO usa NativeWindStyleSheet.setOutput()
import { useEffect } from "react";
import { Platform } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import Constants from "expo-constants";
import { setApiBaseUrl } from "../src/core/api";
import { setBaseUrl as setClientBaseUrl } from "../src/api/client";

export default function RootLayout() {
  useEffect(() => {
    const envBase =
      process.env.EXPO_PUBLIC_API_BASE_URL ||
      process.env.EXPO_PUBLIC_API_URL ||
      Constants.expoConfig?.extra?.EXPO_PUBLIC_API_BASE_URL;
    let apiBaseUrl = envBase || "http://localhost:9000";

    if (apiBaseUrl.includes("localhost")) {
      if (Platform.OS === "android" && !Constants.isDevice) {
        apiBaseUrl = apiBaseUrl.replace("localhost", "10.0.2.2");
      } else if (Constants.isDevice) {
        const constants: any = Constants as any;
        const hostUri =
          constants.expoConfig?.hostUri ||
          constants.expoConfig?.extra?.expoGo?.debuggerHost ||
          constants.manifest?.debuggerHost ||
          constants.manifest2?.extra?.expoGo?.debuggerHost ||
          constants.manifest2?.extra?.expoClient?.hostUri ||
          constants.manifest2?.extra?.expoClient?.debuggerHost;
        if (hostUri) {
          const host = String(hostUri).split(":")[0];
          if (host) {
            apiBaseUrl = apiBaseUrl.replace("localhost", host);
          }
        }
      }
    }

    const normalized = apiBaseUrl.replace(/\/$/, "");
    setApiBaseUrl(normalized);
    setClientBaseUrl(normalized);
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log(`[api] base url: ${normalized}`);
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
