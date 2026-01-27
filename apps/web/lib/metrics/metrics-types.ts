export type AthleteProfileMetrics = {
  resistance?: number;
  strength?: number;
  metcon?: number;
  gymnastics?: number;
  speed?: number;

  fatigue_score?: number;

  acute_load?: number;
  chronic_load?: number;
  load_ratio?: number;
  recovery_time_hours?: number;

  hr_rest?: number;
  hr_avg?: number;
  hr_max?: number;
  hrv?: number;
  vo2_est?: number;
  sleep_hours?: number;

  skill_row?: number;
  skill_wall_balls?: number;
  skill_kettlebell_lunge?: number;
  skill_burpee_box_jump_over?: number;
};

export type WorkoutComputedMetrics = {
  estimated_difficulty?: number;
  avg_time_seconds?: number;
  work_rest_ratio?: number;

  hyrox_transfer_score?: number;

  capacity_focus?: string[];
};

export type AthleteImpactDelta = {
  [metricKey: string]: number;
};

