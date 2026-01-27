import { create, StateCreator } from "zustand";

type UserProfile = {
  id: string;
  name: string;
  level: string;
  avatar?: string;
  email?: string;
};

type WorkoutSummary = {
  id: string;
  title: string;
  focus: string;
  duration: number;
};

type ProgressionState = {
  currentLevel: string;
  nextGoal: string;
  xp: number;
  xpToNext: number;
};

type Milestone = {
  id: string;
  title: string;
  achievedAt?: string;
};

type GearRecommendation = {
  id: string;
  name: string;
  category: string;
  level: string;
};

type UserSlice = {
  user: UserProfile | null;
  authLoading: boolean;
  hydrated: boolean;
  authError: string | null;
  setUser: (user: UserProfile | null) => void;
  setAuthLoading: (loading: boolean) => void;
  setHydrated: (hydrated: boolean) => void;
  setAuthError: (message: string | null) => void;
};

type WorkoutsSlice = {
  workouts: WorkoutSummary[];
  addWorkout: (workout: WorkoutSummary) => void;
  resetWorkouts: () => void;
};

type ProgressionSlice = {
  progression: ProgressionState;
  setProgression: (data: ProgressionState) => void;
};

type MilestonesSlice = {
  milestones: Milestone[];
  addMilestone: (milestone: Milestone) => void;
  resetMilestones: () => void;
};

type GearSlice = {
  gear: GearRecommendation[];
  setGear: (gear: GearRecommendation[]) => void;
};

export type AppStore = UserSlice &
  WorkoutsSlice &
  ProgressionSlice &
  MilestonesSlice &
  GearSlice;

const createUserSlice: StateCreator<
  AppStore,
  [],
  [],
  UserSlice
> = (set) => ({
  user: null,
  authLoading: false,
  hydrated: false,
  authError: null,
  setUser: (user) => set({ user }),
  setAuthLoading: (authLoading) => set({ authLoading }),
  setHydrated: (hydrated) => set({ hydrated }),
  setAuthError: (authError) => set({ authError })
});

const createWorkoutsSlice: StateCreator<
  AppStore,
  [],
  [],
  WorkoutsSlice
> = (set) => ({
  workouts: [],
  addWorkout: (workout) =>
    set((state) => ({ workouts: [...state.workouts, workout] })),
  resetWorkouts: () => set({ workouts: [] })
});

const createProgressionSlice: StateCreator<
  AppStore,
  [],
  [],
  ProgressionSlice
> = (set) => ({
  progression: {
    currentLevel: "Rookie",
    nextGoal: "Subir a Challenger",
    xp: 0,
    xpToNext: 100
  },
  setProgression: (data) => set({ progression: data })
});

const createMilestonesSlice: StateCreator<
  AppStore,
  [],
  [],
  MilestonesSlice
> = (set) => ({
  milestones: [],
  addMilestone: (milestone) =>
    set((state) => ({ milestones: [...state.milestones, milestone] })),
  resetMilestones: () => set({ milestones: [] })
});

const createGearSlice: StateCreator<AppStore, [], [], GearSlice> = (set) => ({
  gear: [],
  setGear: (gear) => set({ gear })
});

export const useAppStore = create<AppStore>()((...args) => ({
  ...createUserSlice(...args),
  ...createWorkoutsSlice(...args),
  ...createProgressionSlice(...args),
  ...createMilestonesSlice(...args),
  ...createGearSlice(...args)
}));

export const useUserStore = useAppStore;
export const useWorkoutsStore = useAppStore;
export const useProgressionStore = useAppStore;
export const useMilestonesStore = useAppStore;
export const useGearStore = useAppStore;
