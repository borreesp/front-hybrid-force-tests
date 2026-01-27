import {
  CapacityProfileItem,
  LookupTables,
  Movement,
  TrainingLoad,
  TrainingLoadDetail,
  Workout,
  WorkoutBlock,
  WorkoutStats,
  AuthResponse,
  RefreshResponse,
  AthleteProfileResponse,
  CareerSnapshot,
  Achievement,
  Mission,
  Benchmark,
  WorkoutAnalysis,
  Equipment,
  WorkoutResult,
  WorkoutResultWithXp,
  WorkoutCreatePayload,
  ApplyWorkoutImpactResponse
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

const buildAuthHeaders = () => {
  const headers: Record<string, string> = {};
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  return headers;
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

  async getWorkoutVersions(id: string | number): Promise<Workout[]> {
    return fetchJson<Workout[]>(`/workouts/${id}/versions`);
  },

  async getWorkoutStats(): Promise<WorkoutStats[]> {
    return fetchJson<WorkoutStats[]>("/workouts/stats");
  },

  async uploadWodOcr(file: File): Promise<{ text: string; confidence: number; mode: string; source?: any }> {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${API_BASE}/wod-analysis/ocr`, {
      method: "POST",
      body: form,
      credentials: "include",
      headers: {
        ...buildAuthHeaders()
      }
    });
    if (!res.ok) {
      const message = await res.text();
      throw new Error(message || `OCR request failed (${res.status})`);
    }
    return res.json();
  },

  async parseWodDraft(text: string): Promise<any> {
    return fetchJson(`/wod-analysis/parse`, {
      method: "POST",
      body: JSON.stringify({ text })
    });
  },

  async getMovements(): Promise<Movement[]> {
    return fetchJson<Movement[]>("/movements");
  },

  async getTrainingLoad(userId: string | number): Promise<TrainingLoad[]> {
    return fetchJson<TrainingLoad[]>(`/users/${userId}/training-load`);
  },

  async getTrainingLoadDetails(userId: string | number): Promise<TrainingLoadDetail[]> {
    return fetchJson<TrainingLoadDetail[]>(`/users/${userId}/training-load/details`);
  },

  async getCapacityProfile(userId: string | number): Promise<{
    user_id: number;
    capacities: CapacityProfileItem[];
  }> {
    return fetchJson(`/users/${userId}/capacity-profile`);
  },

  async getLookupTables(): Promise<LookupTables> {
    return fetchJson<LookupTables>("/lookups");
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

  async getAthleteAchievements(): Promise<Achievement[]> {
    return fetchJson<Achievement[]>("/athlete/achievements");
  },

  async getAthleteMissions(): Promise<Mission[]> {
    return fetchJson<Mission[]>("/athlete/missions");
  },

  async getAthleteBenchmarks(): Promise<Benchmark[]> {
    return fetchJson<Benchmark[]>("/athlete/benchmarks");
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

  async getAthleteSkillsTop(athleteId: string | number, limit = 5) {
    return fetchJson(`/athlete/${athleteId}/skills/top?limit=${limit}`);
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
  }
};
