export type AthleteProfileResponse = {
  career: {
    xp_total: number;
    level: number;
    progress_pct?: number;
    next_level?: number | null;
    xp_to_next?: number | null;
    weekly_streak?: number | null;
    updated_at: string;
  };
  capacities: Array<{
    capacity: string;
    value: number;
    measured_at: string;
  }>;
  skills: Array<{
    movement: string;
    score: number;
    measured_at: string;
  }>;
  prs: Array<{
    movement: string;
    pr_type: string;
    value: number;
    unit?: string | null;
    achieved_at: string;
  }>;
  tests: {
    tests_total: number;
    tests_7d: number;
    last_test_at?: string | null;
    weekly_streak?: number | null;
  };
};

export type Workout = {
  id: number;
  title: string;
  description?: string;
  domain?: string | null;
  intensity?: string | null;
  estimated_difficulty?: number | null;
  xp_estimate?: number | null;
  avg_time_seconds?: number | null;
};

export type WorkoutExecution = {
  id: number;
  workout_id: number;
  executed_at: string;
  total_time_seconds?: number | null;
  notes?: string | null;
  workout: {
    id: number;
    title: string;
    domain?: string | null;
    intensity?: string | null;
  };
};

export type WorkoutExecutionDetail = WorkoutExecution & {
  blocks?: Array<{
    id: number;
    workout_block_id?: number | null;
    time_seconds?: number | null;
  }>;
};

export type RankingEntry = {
  rank: number;
  user_id: number;
  name: string;
  display_name?: string | null;
  avatar_url?: string | null;
  value: number;
  previous_value?: number | null;
  trend?: "up" | "down" | "same";
};

export type RankingSummaryResponse = {
  data: Record<string, RankingEntry[]>;
  metadata?: { calculation_mode?: string };
};

export type UserSelfProfile = {
  id: number;
  name: string;
  display_name?: string | null;
  avatar_url?: string | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  date_of_birth?: string | null;
};

export type AuthMeResponse = {
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
};
