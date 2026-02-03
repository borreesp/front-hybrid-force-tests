import { Tabs } from "expo-router";
import { View, ActivityIndicator, SafeAreaView } from "react-native";
import { AppHeader } from "@thrifty/ui";
import { useAuth } from "../../src/hooks/useAuth";
// NO usar NavigationContainer - expo-router ya lo incluye internamente

export default function TabsLayout() {
  const { authLoading, hydrated } = useAuth();

  if (authLoading || !hydrated) {
    return (
      <View className="flex-1 bg-surface items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <View className="flex-1 bg-surface">

        {/* Tabs Navigation */}
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: "#0f172a",
              borderTopColor: "rgba(255,255,255,0.08)",
              paddingBottom: 8,
              paddingTop: 8,
              height: 60
            },
            tabBarActiveTintColor: "#3b82f6",
            tabBarInactiveTintColor: "#94a3b8",
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: "600"
            }
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: "Dashboard",
              tabBarIcon: ({ color }) => (
                <View className="h-6 w-6 items-center justify-center">
                  <View style={{ backgroundColor: color }} className="h-1 w-6 rounded-full" />
                </View>
              )
            }}
          />
          <Tabs.Screen
            name="workouts"
            options={{
              title: "Workouts",
              tabBarIcon: ({ color }) => (
                <View className="h-6 w-6 items-center justify-center">
                  <View style={{ backgroundColor: color }} className="h-1 w-6 rounded-full" />
                </View>
              )
            }}
          />
          <Tabs.Screen
            name="ranking"
            options={{
              title: "Ranking",
              tabBarIcon: ({ color }) => (
                <View className="h-6 w-6 items-center justify-center">
                  <View style={{ backgroundColor: color }} className="h-1 w-6 rounded-full" />
                </View>
              )
            }}
          />
          <Tabs.Screen
            name="athlete"
            options={{
              title: "Atleta",
              tabBarIcon: ({ color }) => (
                <View className="h-6 w-6 items-center justify-center">
                  <View style={{ backgroundColor: color }} className="h-1 w-6 rounded-full" />
                </View>
              )
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: "Perfil",
              tabBarIcon: ({ color }) => (
                <View className="h-6 w-6 items-center justify-center">
                  <View style={{ backgroundColor: color }} className="h-1 w-6 rounded-full" />
                </View>
              )
            }}
          />
        </Tabs>
      </View>
    </SafeAreaView>
  );
}
