export type TestFormField = {
  key: string;
  label: string;
  placeholder?: string;
  hint?: string;
  required?: boolean;
  min?: number;
};

export type TestFormSchema = {
  testCode: string;
  title: string;
  description?: string;
  durationSeconds: number;
  fields: TestFormField[];
};

const DEFAULT_DURATION_SECONDS = 600;

const SCHEMAS: Record<string, TestFormSchema> = {
  SQUAT: {
    testCode: "SQUAT",
    title: "Test Squat",
    description: "Registra repeticiones y carga usadas.",
    durationSeconds: DEFAULT_DURATION_SECONDS,
    fields: [
      { key: "reps", label: "Repeticiones totales", placeholder: "Ej: 84", required: true, min: 0 },
      { key: "load_kg", label: "Carga (kg)", placeholder: "Ej: 80", required: true, min: 0 },
      { key: "bodyweight_kg", label: "Peso corporal (kg)", placeholder: "Opcional", required: false, min: 0 },
    ],
  },
  PRESS: {
    testCode: "PRESS",
    title: "Test Press",
    description: "Registra repeticiones y carga.",
    durationSeconds: DEFAULT_DURATION_SECONDS,
    fields: [
      { key: "reps", label: "Repeticiones totales", placeholder: "Ej: 72", required: true, min: 0 },
      { key: "load_kg", label: "Carga (kg)", placeholder: "Ej: 22.5", required: true, min: 0 },
    ],
  },
  DEADLIFT_FARMER: {
    testCode: "DEADLIFT_FARMER",
    title: "Test Deadlift + Farmer",
    description: "Registra reps, carga y distancia.",
    durationSeconds: DEFAULT_DURATION_SECONDS,
    fields: [
      { key: "reps", label: "Deadlift reps", placeholder: "Ej: 48", required: true, min: 0 },
      { key: "load_kg", label: "Deadlift carga (kg)", placeholder: "Ej: 70", required: true, min: 0 },
      { key: "carry_meters", label: "Farmer carry (metros)", placeholder: "Ej: 120", required: true, min: 0 },
    ],
  },
  PULL: {
    testCode: "PULL",
    title: "Test Pull",
    description: "Registra reps y, si aplica, factor de dificultad.",
    durationSeconds: DEFAULT_DURATION_SECONDS,
    fields: [
      { key: "reps", label: "Repeticiones totales", placeholder: "Ej: 45", required: true, min: 0 },
      { key: "bodyweight_kg", label: "Peso corporal (kg)", placeholder: "Opcional", required: false, min: 0 },
    ],
  },
  FARMER_SLED: {
    testCode: "FARMER_SLED",
    title: "Test Farmer + Sled",
    description: "Registra distancia y carga.",
    durationSeconds: DEFAULT_DURATION_SECONDS,
    fields: [
      { key: "meters", label: "Distancia (metros)", placeholder: "Ej: 400", required: true, min: 0 },
      { key: "load_kg", label: "Carga (kg)", placeholder: "Ej: 100", required: true, min: 0 },
    ],
  },
};

export const getTestFormSchema = (code?: string | null): TestFormSchema | null => {
  if (!code) return null;
  return SCHEMAS[code] ?? null;
};
