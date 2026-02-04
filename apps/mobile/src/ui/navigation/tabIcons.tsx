import { View, Text } from "react-native";
import Svg, { Path, Circle, Rect } from "react-native-svg";
import { Avatar } from "../../components/Avatar";

/**
 * Frame wrapper for consistent icon sizing in tab bar
 */
export const IconFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <View className="h-8 w-8 items-center justify-center">{children}</View>
);

/**
 * HybridForce logo icon for Dashboard tab
 */
export const LogoIcon: React.FC<{ color: string; focused: boolean }> = ({ color, focused }) => (
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

/**
 * Dumbbell icon for Workouts tab
 */
export const DumbbellIcon: React.FC<{ color: string; size: number }> = ({ color, size }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="2" y="8" width="3" height="8" rx="1" stroke={color} strokeWidth={2} />
    <Rect x="19" y="8" width="3" height="8" rx="1" stroke={color} strokeWidth={2} />
    <Path d="M7 12h10" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Rect x="5" y="9" width="2" height="6" rx="0.8" stroke={color} strokeWidth={2} />
    <Rect x="17" y="9" width="2" height="6" rx="0.8" stroke={color} strokeWidth={2} />
  </Svg>
);

/**
 * Trophy icon for Ranking tab
 */
export const TrophyIcon: React.FC<{ color: string; size: number }> = ({ color, size }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M7 4h10v3a5 5 0 0 1-10 0V4Z" stroke={color} strokeWidth={2} />
    <Path d="M5 6H4a3 3 0 0 0 3 3" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Path d="M19 6h1a3 3 0 0 1-3 3" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Path d="M10 14h4v3h-4z" stroke={color} strokeWidth={2} />
    <Path d="M8 20h8" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

/**
 * Athlete/Person icon for Athlete tab
 */
export const AthleteIcon: React.FC<{ color: string; size: number }> = ({ color, size }) => (
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

/**
 * Profile tab icon with user avatar or initials
 */
export const ProfileTabIcon: React.FC<{
  color: string;
  avatarUri: string | null;
  avatarName: string;
}> = ({ color, avatarUri, avatarName }) => (
  <View className="rounded-full p-[2px]" style={{ borderColor: color, borderWidth: 1 }}>
    <Avatar uri={avatarUri} name={avatarName} size={22} />
  </View>
);

/**
 * Tab icon props passed by expo-router
 */
export type TabIconProps = {
  color: string;
  size: number;
  focused: boolean;
};

/**
 * User info for profile tab icon
 */
export type UserInfo = {
  avatarUri: string | null;
  avatarName: string;
};

/**
 * Factory function to create tab bar icon components
 */
export const createTabBarIcon = {
  dashboard: () => (props: TabIconProps) => (
    <IconFrame>
      <LogoIcon color={props.color} focused={props.focused} />
    </IconFrame>
  ),

  workouts: () => (props: TabIconProps) => (
    <IconFrame>
      <DumbbellIcon color={props.color} size={props.size || 22} />
    </IconFrame>
  ),

  ranking: () => (props: TabIconProps) => (
    <IconFrame>
      <TrophyIcon color={props.color} size={props.size || 22} />
    </IconFrame>
  ),

  athlete: () => (props: TabIconProps) => (
    <IconFrame>
      <AthleteIcon color={props.color} size={props.size || 22} />
    </IconFrame>
  ),

  profile: (user: UserInfo) => (props: TabIconProps) => (
    <IconFrame>
      <ProfileTabIcon color={props.color} avatarUri={user.avatarUri} avatarName={user.avatarName} />
    </IconFrame>
  ),
};
