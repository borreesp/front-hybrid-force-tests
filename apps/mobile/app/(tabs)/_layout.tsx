import { Tabs } from "expo-router";
import { View, ActivityIndicator, SafeAreaView } from "react-native";
import { useAuth } from "../../src/hooks/useAuth";
import {
  createTabBarIcon,
  tabScreenOptions,
  tabRoutes,
} from "../../src/ui/navigation";
import { colors } from "../../src/ui/theme";

export default function TabsLayout() {
  const { authLoading, hydrated, user } = useAuth();

  if (authLoading || !hydrated) {
    return (
      <View className="flex-1 bg-surface items-center justify-center">
        <ActivityIndicator size="large" color={colors.brand.DEFAULT} />
      </View>
    );
  }

  const userInfo = {
    avatarUri: user?.avatar ?? null,
    avatarName: user?.name ?? "Atleta",
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <View className="flex-1 bg-surface">
        <Tabs screenOptions={tabScreenOptions}>
          <Tabs.Screen
            name={tabRoutes.index.name}
            options={{
              title: tabRoutes.index.title,
              tabBarIcon: createTabBarIcon.dashboard(),
            }}
          />
          <Tabs.Screen
            name={tabRoutes.workouts.name}
            options={{
              title: tabRoutes.workouts.title,
              tabBarIcon: createTabBarIcon.workouts(),
            }}
          />
          <Tabs.Screen
            name={tabRoutes.ranking.name}
            options={{
              title: tabRoutes.ranking.title,
              tabBarIcon: createTabBarIcon.ranking(),
            }}
          />
          <Tabs.Screen
            name={tabRoutes.athlete.name}
            options={{
              title: tabRoutes.athlete.title,
              tabBarIcon: createTabBarIcon.athlete(),
            }}
          />
          <Tabs.Screen
            name={tabRoutes.profile.name}
            options={{
              title: tabRoutes.profile.title,
              tabBarIcon: createTabBarIcon.profile(userInfo),
            }}
          />
          <Tabs.Screen
            name={tabRoutes.me.name}
            options={{ href: null }}
          />
        </Tabs>
      </View>
    </SafeAreaView>
  );
}
