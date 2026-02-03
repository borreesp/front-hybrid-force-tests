import { clearMany } from "./cache";
import { keys } from "./keys";

export function invalidateAfterRepeatWorkout() {
  clearMany([keys.executions(), keys.athleteProfile()]);
}

export function invalidateAfterUpdateMyProfile() {
  clearMany([keys.myProfile(), keys.athleteProfile()]);
}
