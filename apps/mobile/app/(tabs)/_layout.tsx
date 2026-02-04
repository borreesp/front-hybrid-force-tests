import { Tabs } from "expo-router";
import { View, ActivityIndicator, SafeAreaView, Text } from "react-native";
import Svg, { Path, Circle, Rect } from "react-native-svg";
import { useAuth } from "../../src/hooks/useAuth";
import { Avatar } from "../../src/components/Avatar";
// NO usar NavigationContainer - expo-router ya lo incluye internamente

const IconFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <View className="h-8 w-8 items-center justify-center">{children}</View>
);

const LogoIcon: React.FC<{ color: string; focused: boolean }> = ({ color, focused }) => (
  <View
    className={`h-7 w-7 items-center justify-center rounded-xl border ${
      focused ? "bg-white/10" : "bg-transparent"
    }`}
    style={{ borderColor: focused ? color : "rgba(148,163,184,0.5)" }}
  >
    <Text className="text-[11px] font-black tracking-[0.08em]" style={{ color }}>
      HF
    </Text>
  </View>
);

const DumbbellIcon: React.FC<{ color: string; size: number }> = ({ color, size }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="2" y="8" width="3" height="8" rx="1" stroke={color} strokeWidth={2} />
    <Rect x="19" y="8" width="3" height="8" rx="1" stroke={color} strokeWidth={2} />
    <Path d="M7 12h10" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Rect x="5" y="9" width="2" height="6" rx="0.8" stroke={color} strokeWidth={2} />
    <Rect x="17" y="9" width="2" height="6" rx="0.8" stroke={color} strokeWidth={2} />
  </Svg>
);

const TrophyIcon: React.FC<{ color: string; size: number }> = ({ color, size }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M7 4h10v3a5 5 0 0 1-10 0V4Z" stroke={color} strokeWidth={2} />
    <Path d="M5 6H4a3 3 0 0 0 3 3" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Path d="M19 6h1a3 3 0 0 1-3 3" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Path d="M10 14h4v3h-4z" stroke={color} strokeWidth={2} />
    <Path d="M8 20h8" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const AthleteIcon: React.FC<{ color: string; size: number }> = ({ color, size }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="8" r="3" stroke={color} strokeWidth={2} />
    <Path
      d="M4 20c1.7-3.8 6-5.5 8-5.5s6.3 1.7 8 5.5"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
  </Svg>
);

export default function TabsLayout() {
  const { authLoading, hydrated, user } = useAuth();
  const avatarUri = user?.avatar ?? null;
  const avatarName = user?.name ?? "Atleta";

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
            tabBarShowLabel: false
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: "Dashboard",
              tabBarIcon: ({ color, focused }) => (
                <IconFrame>
                  <LogoIcon color={color} focused={focused} />
                </IconFrame>
              )
            }}
          />
          <Tabs.Screen
            name="workouts"
            options={{
              title: "Workouts",
              tabBarIcon: ({ color, size = 22 }) => (
                <IconFrame>
                  <DumbbellIcon color={color} size={size} />
                </IconFrame>
              )
            }}
          />
          <Tabs.Screen
            name="ranking"
            options={{
              title: "Ranking",
              tabBarIcon: ({ color, size = 22 }) => (
                <IconFrame>
                  <TrophyIcon color={color} size={size} />
                </IconFrame>
              )
            }}
          />
          <Tabs.Screen
            name="athlete"
            options={{
              title: "Atleta",
              tabBarIcon: ({ color, size = 22 }) => (
                <IconFrame>
                  <AthleteIcon color={color} size={size} />
                </IconFrame>
              )
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: "Perfil",
              tabBarIcon: ({ color }) => (
                <IconFrame>
                  <View
                    className="rounded-full p-[2px]"
                    style={{ borderColor: color, borderWidth: 1 }}
                  >
                    <Avatar uri={avatarUri} name={avatarName} size={22} />
                  </View>
                </IconFrame>
              )
            }}
          />
          <Tabs.Screen
            name="me"
            options={{
              href: null
            }}
          />
        </Tabs>
      </View>
    </SafeAreaView>
  );
}
