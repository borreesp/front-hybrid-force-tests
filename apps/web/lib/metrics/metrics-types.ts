export type AthleteProfileMetrics = {
  resistance?: number;
  strength?: number;
  metcon?: number;
  gymnastics?: number;
  speed?: number;

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
