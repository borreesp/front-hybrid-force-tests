import { fetchJson } from "./client";

export function getAthleteProfile() {
  return fetchJson("/athlete/profile");
}

export function getWorkouts() {
  return fetchJson("/workouts/");
}

export function getWorkoutExecutions() {
  return fetchJson("/athlete/workout-executions");
}

export function getWorkoutExecution(id: string | number) {
  return fetchJson(`/athlete/workout-executions/${id}`);
}

export function repeatWorkout(workoutId: string | number) {
  return fetchJson(`/athlete/workouts/${workoutId}/repeat`, { method: "POST" });
}

export function getRankingSummary(period: string = "week") {
  const encoded = encodeURIComponent(period);
  return fetchJson(`/ranking/summary?period=${encoded}&limit=10`);
}

export function getMyProfile() {
  return fetchJson("/me/profile");
}

export function updateMyProfile(payload: Record<string, unknown>) {
  return fetchJson("/me/profile", {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}
