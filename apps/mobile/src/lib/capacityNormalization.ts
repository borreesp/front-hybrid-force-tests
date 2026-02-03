export type CapacityKey =
  | "fuerza"
  | "resistencia"
  | "metcon"
  | "gimnasticos"
  | "velocidad"
  | "carga muscular";

const CAPACITY_ORDER: CapacityKey[] = ["fuerza", "resistencia", "metcon", "gimnasticos", "velocidad", "carga muscular"];

const BASE_EXPECTED: Record<CapacityKey, number> = {
  fuerza: 60,
  resistencia: 60,
  metcon: 65,
  gimnasticos: 55,
  velocidad: 60,
  "carga muscular": 60
};

const ELITE_LEVEL = 20;
// Estiramos el objetivo global para que comparado contra élite sea exigente.
const GLOBAL_STRETCH = 8;

const clamp = (val: number, min = 0, max = 100) => Math.min(max, Math.max(min, Math.round(val)));

export const expectedCap = (level: number, capacity: CapacityKey): number => {
  const base = BASE_EXPECTED[capacity] ?? 60;
  const lv = Math.max(1, level);
  // crecimiento suave por nivel (8% por nivel)
  return base * (1 + (lv - 1) * 0.08);
};

export type ComparisonMode = "level" | "global" | "next_level";

export const normalizeCapacity = ({
  rawScore,
  mode,
  athleteLevel,
  capacityKey
}: {
  rawScore: number;
  mode: ComparisonMode;
  athleteLevel: number;
  capacityKey: CapacityKey;
}): number => {
  const target =
    mode === "global"
      ? expectedCap(ELITE_LEVEL, capacityKey) * GLOBAL_STRETCH
      : expectedCap(mode === "next_level" ? Math.max(1, athleteLevel + 1) : Math.max(1, athleteLevel), capacityKey);
  if (!target || target <= 0) return 0;
  return clamp((rawScore / target) * 100);
};

export const normalizeAllCapacities = ({
  rawMap,
  mode,
  athleteLevel
}: {
  rawMap: Partial<Record<CapacityKey, number>>;
  mode: ComparisonMode;
  athleteLevel: number;
}) => {
  return CAPACITY_ORDER.map((cap) =>
    normalizeCapacity({
      rawScore: rawMap[cap] ?? 0,
      mode,
      athleteLevel,
      capacityKey: cap
    })
  );
};

export const capacityOrder = CAPACITY_ORDER;
