export type LookupItem = {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  sort_order?: number | null;
};

export type MovementMuscle = {
  muscle_group: string;
  is_primary: boolean;
};

export type Movement = {
  id: number;
  name: string;
  category?: string | null;
  description?: string | null;
  default_load_unit?: string | null;
  code?: string | null;
  pattern?: string | null;
  default_metric_unit?: string | null;
  supports_reps?: boolean | null;
  supports_load?: boolean | null;
  supports_distance?: boolean | null;
  supports_time?: boolean | null;
  supports_calories?: boolean | null;
  video_url?: string | null;
  muscles: MovementMuscle[];
};

export type WorkoutBlockMovement = {
  id: number;
  movement_id: number;
  position: number;
  reps?: number | null;
  load?: number | null;
  load_unit?: string | null;
  distance_meters?: number | null;
  duration_seconds?: number | null;
  calories?: number | null;
  movement?: Movement | null;
};

export type WorkoutBlock = {
  id: number;
  workout_id: number;
  position: number;
  block_type?: string | null;
  title?: string | null;
  description?: string | null;
  duration_seconds?: number | null;
  rounds?: number | null;
  notes?: string | null;
  movements: WorkoutBlockMovement[];
};

export type Workout = {
  id: number;
  parent_workout_id?: number | null;
  title: string;
  description: string;
  domain?: string | null;
  intensity?: string | null;
  hyrox_transfer?: string | null;
  wod_type: string;
  version?: number | null;
  is_active?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
  session_load?: string | null;
  session_feel?: string | null;
  volume_total?: string | null;
  work_rest_ratio?: string | null;
  dominant_stimulus?: string | null;
  load_type?: string | null;
  athlete_profile_desc?: string | null;
  target_athlete_desc?: string | null;
  pacing_tip?: string | null;
  pacing_detail?: string | null;
  break_tip?: string | null;
  rx_variant?: string | null;
  scaled_variant?: string | null;
  ai_observation?: string | null;
  estimated_difficulty?: number | null;
  main_muscle_chain?: string | null;
  avg_time_seconds?: number | null;
  avg_rating?: number | null;
  avg_difficulty?: number | null;
  rating_count?: number | null;
  xp_estimate?: number | null;
  official_tag?: string | null;
   capacities?: { capacity: string; value: number; note: string }[];
   level_times?: { athlete_level: string; time_minutes: number; time_range: string }[];
   hyrox_stations?: { station: string; transfer_pct: number }[];
  muscles?: string[];
  equipment_ids?: number[];
  similar_workout_ids?: number[];
  blocks?: WorkoutBlock[];
  hyrox_transfer_score?: number | null;
  hyrox_components?: Record<string, number>;
  extra_attributes_json?: Record<string, unknown> | null;
};

export type HyroxTransferResult = {
  transferScore: number;
  components: Record<string, number>;
  explanation: string[];
};

export type WorkoutLevelTime = {
  athlete_level: string;
  time_minutes: number;
  time_range: string;
};

export type WorkoutCreatePayload = {
  title: string;
  description: string;
  domain?: string | null;
  intensity?: string | null;
  hyrox_transfer?: string | null;
  wod_type: string;
  parent_workout_id?: number | null;
  version?: number | null;
  is_active?: boolean | null;
  volume_total: string;
  work_rest_ratio: string;
  dominant_stimulus: string;
  load_type: string;
  estimated_difficulty: number;
  main_muscle_chain: string;
  extra_attributes_json?: Record<string, unknown> | null;
  athlete_profile_desc: string;
  target_athlete_desc: string;
  session_load: string;
  session_feel: string;
  official_tag?: string | null;
  pacing_tip?: string | null;
  pacing_detail?: string | null;
  break_tip?: string | null;
  rx_variant?: string | null;
  scaled_variant?: string | null;
  ai_observation?: string | null;
  avg_time_seconds?: number | null;
  avg_rating?: number | null;
  avg_difficulty?: number | null;
  rating_count?: number | null;
  level_times?: WorkoutLevelTime[];
  capacities?: { capacity: string; value: number; note: string }[];
  hyrox_stations?: { station: string; transfer_pct: number }[];
  muscles?: string[];
  equipment_ids?: number[];
  similar_workout_ids?: number[];
};

export type WorkoutAnalysis = {
  workout_id: number;
  fatigue_score: number;
  hyrox_transfer: number;
  capacity_focus: { capacity: string; emphasis: string; note: string }[];
  pacing: { tip: string; range: string };
  expected_feel: string;
  session_load: string;
  xp_estimate?: number | null;
  xp_components?: Record<string, unknown>;
  id?: number;
  athlete_impact?: AthleteImpactDelta | null;
  applied?: boolean;
  applied_at?: string | null;
  hyrox_transfer_score?: number | null;
  hyrox_components?: Record<string, number>;
};

export type WorkoutStats = {
  workout_id: number;
  title?: string | null;
  estimated_difficulty?: number | null;
  avg_time_seconds?: number | null;
  avg_rating?: number | null;
  avg_difficulty?: number | null;
  rating_count?: number | null;
};

export type WorkoutResult = {
  id: number;
  workout_id: number;
  user_id: number;
  time_seconds: number;
  difficulty?: number | null;
  rating?: number | null;
  comment?: string | null;
};

export type WorkoutResultWithXp = {
  result: WorkoutResult;
  xp_awarded: number;
  xp_total: number;
  level: number;
  progress_pct: number;
  achievements_unlocked: string[];
  missions_completed: string[];
};

export type TrainingLoad = {
  id: number;
  user_id: number;
  load_date: string;
  acute_load?: number | null;
  chronic_load?: number | null;
  load_ratio?: number | null;
  notes?: string | null;
};

export type TrainingLoadDetail = {
  id: number;
  workout_id?: number | null;
  workout_title?: string | null;
  load_date: string | null;
  executed_at?: string | null;
  acute_load?: number | null;
  chronic_load?: number | null;
  notes?: string | null;
};

export type CapacityProfileItem = {
  id: number;
  user_id: number;
  capacity_code: string;
  capacity_name?: string | null;
  value: number;
  measured_at: string;
};

export type LookupTables = {
  athlete_levels: LookupItem[];
  intensity_levels: LookupItem[];
  energy_domains: LookupItem[];
  physical_capacities: LookupItem[];
  muscle_groups: LookupItem[];
  hyrox_stations: LookupItem[];
};

export type AuthUser = {
  id: number;
  name: string;
  email: string;
};

export type AuthResponse = {
  user: AuthUser;
  tokens?: {
    access_token: string;
    refresh_token: string;
  };
};

export type RefreshResponse = {
  access_token: string;
  refresh_token?: string | null;
};

export type CareerSnapshot = {
  xp_total: number;
  level: number;
  progress_pct: number;
  next_level?: number | null;
  xp_to_next?: number | null;
  weekly_streak?: number | null;
  updated_at: string;
};

export type AthleteCapacity = {
  capacity: string;
  value: number;
  measured_at: string;
};

export type AthleteSkill = {
  movement: string;
  score: number;
  measured_at: string;
};

export type AthleteBiometrics = {
  measured_at: string;
  hr_rest?: number | null;
  hr_avg?: number | null;
  hr_max?: number | null;
  vo2_est?: number | null;
  hrv?: number | null;
  sleep_hours?: number | null;
  fatigue_score?: number | null;
  recovery_time_hours?: number | null;
};

export type AthleteTrainingLoad = {
  load_date: string;
  acute_load?: number | null;
  chronic_load?: number | null;
  load_ratio?: number | null;
};

export type AthletePR = {
  movement: string;
  pr_type: string;
  value: number;
  unit?: string | null;
  achieved_at: string;
};

export type Achievement = {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  category?: string | null;
  xp_reward: number;
  icon_url?: string | null;
  unlocked_at?: string | null;
};

export type Mission = {
  id: number;
  mission_id: number;
  type: string;
  title: string;
  description?: string | null;
  xp_reward: number;
  status: string;
  progress_value: number;
  target_value?: number | null;
  expires_at?: string | null;
  completed_at?: string | null;
};

export type Benchmark = {
  capacity: string;
  percentile?: number | null;
  level?: number | null;
};

export type AthleteProfileResponse = {
  career: CareerSnapshot;
  capacities: AthleteCapacity[];
  skills: AthleteSkill[];
  biometrics?: AthleteBiometrics | null;
  training_load: AthleteTrainingLoad[];
  prs: AthletePR[];
  achievements: Achievement[];
  missions: Mission[];
  benchmarks: Benchmark[];
};

export type Equipment = {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url?: string | null;
  category?: string | null;
};

export type AthleteImpactDelta = Record<string, number>;

export type ApplyWorkoutImpactResponse = {
  workout_id: number;
  user_id: number;
  applied: boolean;
  applied_at: string;
  impact: AthleteImpactDelta;
  updated_profile?: AthleteProfileResponse;
  analysis?: WorkoutAnalysis;
};

export type AthleteSkillStat = {
  key?: string | number;
  name: string;
  category?: string | null;
  unit?: string | null;
  value: number;
  measured_at?: string;
};

export type AthletePrStat = {
  name: string;
  type?: string | null;
  value: number;
  unit?: string | null;
  achieved_at?: string;
};

export type AthleteStatsOverview = {
  topSkills: AthleteSkillStat[];
  topPrs: AthletePrStat[];
  totals: {
    skills_total?: number | null;
    prs_total?: number | null;
    total_reps?: number | null;
    total_kg?: number | null;
    total_meters?: number | null;
    total_cals?: number | null;
    total_seconds?: number | null;
  };
};
