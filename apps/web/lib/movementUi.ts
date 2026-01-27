import schema from "../ui/movement_ui_schema.json";
import type { Movement } from "./types";

const CALORIE_CODES = new Set(["row", "skierg", "bike_erg", "assault_bike", "echo_bike"]);
const isCalorieMovement = (movement: Movement): boolean => {
  const code = (movement.code || "").toLowerCase();
  if (CALORIE_CODES.has(code)) return true;
  const name = (movement.name || "").toLowerCase();
  return ["row", "ski", "bike"].some((k) => name.includes(k)) && movement.supports_calories === true;
};

type FieldKey = "reps" | "load" | "unit" | "distance_meters" | "calories" | "duration_seconds" | "target_time_seconds";

export type MovementUIConfig = {
  showReps: boolean;
  showLoad: boolean;
  showUnit: boolean;
  showDistance: boolean;
  showCalories: boolean;
  showDuration: boolean;
  showTargetTime: boolean;
};

const defaultConfig = (overrides: Partial<MovementUIConfig> = {}): MovementUIConfig => ({
  showReps: true,
  showLoad: true,
  showUnit: true,
  showDistance: true,
  showCalories: false,
  showDuration: true,
  showTargetTime: false,
  ...overrides
});

// Accept null/undefined categories coming from the API.
const normalizeCategory = (category?: string | null) => (category ?? "").toLowerCase();

const hasField = (list: FieldKey[], key: FieldKey) => list.includes(key);

export const getUIConfigForMovement = (movement: Movement): MovementUIConfig => {
  const fields = (schema as Record<string, FieldKey[]>)[movement.name ?? ""] as FieldKey[] | undefined;

  const category = normalizeCategory(movement.category);
  const supportsLoad = Boolean(movement.default_load_unit);
  const allowsCalories = isCalorieMovement(movement);

  if (fields) {
    return defaultConfig({
      showReps: hasField(fields, "reps"),
      showLoad: hasField(fields, "load") && supportsLoad,
      showUnit: hasField(fields, "unit") && supportsLoad,
      showDistance: hasField(fields, "distance_meters"),
      showCalories: allowsCalories && hasField(fields, "calories"),
      showDuration: hasField(fields, "duration_seconds"),
      showTargetTime: hasField(fields, "target_time_seconds")
    });
  }

  if (category.includes("cardio")) {
    return defaultConfig({
      showReps: false,
      showLoad: false,
      showUnit: false,
      showDistance: true,
      showCalories: allowsCalories,
      showDuration: true,
      showTargetTime: true
    });
  }

  if (category.includes("strength") || category.includes("fuerza")) {
    return defaultConfig({
      showReps: true,
      showLoad: supportsLoad,
      showUnit: supportsLoad,
      showDistance: false,
      showCalories: false,
      showDuration: false,
      showTargetTime: false
    });
  }

  if (category.includes("gimn")) {
    return defaultConfig({
      showReps: true,
      showLoad: false,
      showUnit: false,
      showDistance: false,
      showCalories: false,
      showDuration: false,
      showTargetTime: false
    });
  }

  if (category.includes("metcon")) {
    return defaultConfig({
      showReps: true,
      showLoad: supportsLoad,
      showUnit: supportsLoad,
      showDistance: !supportsLoad,
      showCalories: allowsCalories,
      showDuration: true,
      showTargetTime: supportsLoad ? false : true
    });
  }

  return defaultConfig({
    showLoad: supportsLoad,
    showUnit: supportsLoad,
    showCalories: allowsCalories,
    showTargetTime: false
  });
};
