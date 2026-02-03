export const keys = {
  athleteProfile: () => "athleteProfile",
  myProfile: () => "myProfile",
  workouts: () => "workouts",
  executions: () => "executions",
  execution: (id: string | number) => `execution:${id}`,
  ranking: (period: string) => `ranking:${period}`
};
