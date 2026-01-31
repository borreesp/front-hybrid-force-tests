import {
  CapacityProfileItem,
  Movement,
  Workout,
  WorkoutBlock,
  WorkoutStats,
  AuthResponse,
  RefreshResponse,
  AthleteProfileResponse,
  CareerSnapshot,
  WorkoutAnalysis,
  Equipment,
  WorkoutResult,
  WorkoutResultWithXp,
  WorkoutCreatePayload,
  ApplyWorkoutImpactResponse,
  UserRead,
  UserSelfProfile,
  UserSelfProfileUpdate,
  WorkoutExecution,
  CoachAthleteSummary,
  RankingEntry,
  RankingSummary,
  RankingSummaryResponse,
  RankingMetric,
  RankingPeriod
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

const buildHeaders = (headers?: HeadersInit) => {
  const base: Record<string, string> = {
    "Content-Type": "application/json"
  };
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) base.Authorization = `Bearer ${token}`;
  }
  return {
    ...base,
    ...(headers || {})
  };
};

async function fetchJson<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: buildHeaders(options.headers as HeadersInit),
    ...options
  });

  if (!res.ok) {
    let message = `Request failed (${res.status}): ${path}`;
    let details: unknown = undefined;
    try {
      const text = await res.text();
      if (text) {
        try {
          const parsed = JSON.parse(text);
          details = parsed;
          const inner = (parsed as any)?.message || (parsed as any)?.error || (parsed as any)?.detail || text;
          message = inner;
        } catch {
          message = text;
        }
      }
    } catch {
      // ignore parse errors
    }
    const error: any = new Error(message);
    error.status = res.status;
    error.details = details;
    throw error;
  }

  return res.json() as Promise<T>;
}

export const api = {
  async getWorkouts(): Promise<Workout[]> {
    return fetchJson<Workout[]>("/workouts");
  },

  async getWorkout(id: string | number): Promise<Workout> {
    return fetchJson<Workout>(`/workouts/${id}`);
  },

  async createWorkout(payload: WorkoutCreatePayload): Promise<Workout> {
    return fetchJson<Workout>("/workouts", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  async updateWorkout(id: string | number, payload: WorkoutCreatePayload): Promise<Workout> {
    return fetchJson<Workout>(`/workouts/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    });
  },

  async getWorkoutStructure(id: string | number): Promise<Workout> {
    return fetchJson<Workout>(`/workouts/${id}/structure`);
  },

  async getWorkoutBlocks(id: string | number): Promise<WorkoutBlock[]> {
    return fetchJson<WorkoutBlock[]>(`/workouts/${id}/blocks`);
  },

  async getWorkoutSimilar(id: string | number): Promise<Workout[]> {
    return fetchJson<Workout[]>(`/workouts/${id}/similar`);
  },

  async getWorkoutResults(id: string | number): Promise<WorkoutResult[]> {
    return fetchJson<WorkoutResult[]>(`/workout-results/workout/${id}`);
  },

  async getWorkoutExecutions(): Promise<WorkoutExecution[]> {
    return fetchJson<WorkoutExecution[]>("/athlete/workout-executions");
  },

  async getAthleteWorkoutExecutions(athleteId: string | number, limit = 10): Promise<WorkoutExecution[]> {
    return fetchJson<WorkoutExecution[]>(`/athlete/${athleteId}/workout-executions?limit=${limit}`);
  },

  async getCoachAthletesSummary(athleteId?: string | number): Promise<CoachAthleteSummary[]> {
    const query = athleteId ? `?athlete_id=${athleteId}` : "";
    return fetchJson<CoachAthleteSummary[]>(`/coach/athletes/summary${query}`);
  },

  async getWorkoutExecution(id: string | number): Promise<WorkoutExecution> {
    return fetchJson<WorkoutExecution>(`/athlete/workout-executions/${id}`);
  },

  async repeatWorkout(workoutId: string | number): Promise<WorkoutExecution> {
    return fetchJson<WorkoutExecution>(`/athlete/workouts/${workoutId}/repeat`, {
      method: "POST"
    });
  },

  async getWorkoutVersions(id: string | number): Promise<Workout[]> {
    return fetchJson<Workout[]>(`/workouts/${id}/versions`);
  },

  async getWorkoutStats(): Promise<WorkoutStats[]> {
    return fetchJson<WorkoutStats[]>("/workouts/stats");
  },

  async getMovements(): Promise<Movement[]> {
    return fetchJson<Movement[]>("/movements");
  },

  async getCapacityProfile(userId: string | number): Promise<{
    user_id: number;
    capacities: CapacityProfileItem[];
  }> {
    return fetchJson(`/users/${userId}/capacity-profile`);
  },

  async getEquipment() {
    return fetchJson<Equipment[]>("/equipment");
  },

  async getAthleteProfile(): Promise<AthleteProfileResponse> {
    return fetchJson<AthleteProfileResponse>("/athlete/profile");
  },

  async getAthleteCareer(): Promise<CareerSnapshot> {
    return fetchJson<CareerSnapshot>("/athlete/career");
  },

  async getWorkoutAnalysis(id: string | number): Promise<WorkoutAnalysis> {
    return fetchJson<WorkoutAnalysis>(`/workouts/${id}/analysis`);
  },

  async analyzeWorkoutPayload(payload: WorkoutCreatePayload): Promise<WorkoutAnalysis> {
    return fetchJson<WorkoutAnalysis>("/workout-analysis", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    return fetchJson<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
  },

  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    return fetchJson<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password })
    });
  },

  async refresh(): Promise<RefreshResponse> {
    return fetchJson<RefreshResponse>("/auth/refresh", { method: "POST" });
  },

  async logout(): Promise<void> {
    await fetchJson("/auth/logout", { method: "POST" });
  },

  async me(): Promise<AuthResponse> {
    return fetchJson<AuthResponse>("/auth/me");
  },

  async submitWorkoutResult(
    workoutId: string | number,
    payload: { time_seconds: number; difficulty?: number; rating?: number; comment?: string }
  ): Promise<WorkoutResultWithXp> {
    return fetchJson<WorkoutResultWithXp>(`/athlete/workouts/${workoutId}/result`, {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  async submitWorkoutTime(
    workoutId: string | number,
    payload: {
      method: "total" | "by_blocks" | "by_segments";
      total_time_sec: number;
      block_times_sec?: number[];
      segment_times_sec?: Record<string, number>;
      segment_mode?: string;
      segment_details?: { movement_id?: number; label: string; time_seconds?: number | null }[];
      difficulty?: number;
      rating?: number;
      comment?: string;
    }
  ): Promise<WorkoutResultWithXp> {
    return fetchJson<WorkoutResultWithXp>(`/athlete/workouts/${workoutId}/result`, {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  async applyWorkoutImpact(
    workoutId: string | number,
    payload: { analysis_id?: number | string } = {}
  ): Promise<ApplyWorkoutImpactResponse> {
    return fetchJson<ApplyWorkoutImpactResponse>(`/athlete/workouts/${workoutId}/apply-impact`, {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  async getAthleteSkills(athleteId: string | number) {
    return fetchJson(`/athlete/${athleteId}/skills`);
  },

  async getAthletePrsTop(athleteId: string | number, limit = 5) {
    return fetchJson(`/athlete/${athleteId}/prs/top?limit=${limit}`);
  },

  async getAthletePrs(athleteId: string | number) {
    return fetchJson(`/athlete/${athleteId}/prs`);
  },

  async getAthleteStatsOverview(athleteId: string | number) {
    return fetchJson(`/athlete/${athleteId}/stats/overview`);
  },

  async getRanking(
    metric: RankingMetric,
    period: RankingPeriod,
    limit = 50
  ): Promise<RankingEntry[]> {
    return fetchJson<RankingEntry[]>(`/ranking/?metric=${metric}&period=${period}&limit=${limit}`);
  },

  async getRankingSummary(period: RankingPeriod, limit = 10): Promise<RankingSummaryResponse> {
    return fetchJson<RankingSummaryResponse>(`/ranking/summary?period=${period}&limit=${limit}`);
  },

  async getUsers(): Promise<UserRead[]> {
    return fetchJson<UserRead[]>("/users");
  },

  async getUser(userId: string | number): Promise<UserRead> {
    return fetchJson<UserRead>(`/users/${userId}`);
  },

  async getMyProfile(): Promise<UserSelfProfile> {
    return fetchJson<UserSelfProfile>("/me/profile");
  },

  async updateMyProfile(payload: UserSelfProfileUpdate): Promise<UserSelfProfile> {
    return fetchJson<UserSelfProfile>("/me/profile", {
      method: "PUT",
      body: JSON.stringify(payload)
    });
  }
};
