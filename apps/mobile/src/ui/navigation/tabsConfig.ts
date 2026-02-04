import { colors } from "../theme";

/**
 * Tab bar style configuration
 */
export const tabBarStyles = {
  backgroundColor: colors.tabBar.background,
  borderTopColor: colors.tabBar.border,
  paddingBottom: 8,
  paddingTop: 8,
  height: 60,
} as const;

/**
 * Tab bar screen options
 */
export const tabScreenOptions = {
  headerShown: false,
  tabBarStyle: tabBarStyles,
  tabBarActiveTintColor: colors.tabBar.active,
  tabBarInactiveTintColor: colors.tabBar.inactive,
  tabBarShowLabel: false,
} as const;

/**
 * Tab route definitions
 */
export const tabRoutes = {
  index: {
    name: "index",
    title: "Dashboard",
  },
  workouts: {
    name: "workouts",
    title: "Tests",
  },
  ranking: {
    name: "ranking",
    title: "Ranking",
  },
  profile: {
    name: "profile",
    title: "Perfil",
  },
  me: {
    name: "me",
    hidden: true,
  },
} as const;

export type TabRouteName = keyof typeof tabRoutes;
