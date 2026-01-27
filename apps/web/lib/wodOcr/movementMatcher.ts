import type { Movement } from "../types";
import type { ParsedWod, ParsedMovement } from "./parser";
import { movementAliasMap, movementKeywords } from "./aliases";

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9\s]/gi, "").trim();

const buildAliasIndex = (movements: Movement[]) => {
  const index = new Map<string, Movement>();
  movements.forEach((mv) => {
    index.set(normalize(mv.name), mv);
  });
  Object.entries(movementAliasMap).forEach(([alias, target]) => {
    const targetMv = movements.find((mv) => normalize(mv.name) === normalize(target));
    if (targetMv) index.set(normalize(alias), targetMv);
  });
  return index;
};

const bestKeywordMatch = (raw: string, movements: Movement[]) => {
  const normalized = normalize(raw);
  for (const { keyword, target } of movementKeywords) {
    if (normalized.includes(normalize(keyword))) {
      const hit = movements.find((mv) => normalize(mv.name) === normalize(target));
      if (hit) return { movement: hit, confidence: 0.7 };
    }
  }
  return null;
};

const matchMovement = (mv: ParsedMovement, movements: Movement[], aliasIndex: Map<string, Movement>) => {
  const normName = normalize(mv.name_raw);
  const aliasHit = aliasIndex.get(normName);
  if (aliasHit) return { movement_id: aliasHit.id, confidence: 0.92, label: aliasHit.name };

  const exact = movements.find((m) => normalize(m.name) === normName);
  if (exact) return { movement_id: exact.id, confidence: 0.9, label: exact.name };

  const keyword = bestKeywordMatch(mv.name_raw, movements);
  if (keyword) return { movement_id: keyword.movement.id, confidence: keyword.confidence, label: keyword.movement.name };

  const partial = movements.find((m) => normName && normalize(m.name).includes(normName));
  if (partial) return { movement_id: partial.id, confidence: 0.55, label: partial.name };

  return { movement_id: undefined, confidence: 0 };
};

export function matchMovements(parsed: ParsedWod, movements: Movement[], threshold = 0.75) {
  const aliasIndex = buildAliasIndex(movements);
  const cloned = structuredClone(parsed) as ParsedWod;
  let unmatched = 0;

  cloned.blocks.forEach((block) => {
    block.scenarios.forEach((scenario) => {
      scenario.movements = scenario.movements.map((mv) => {
        const hit = matchMovement(mv, movements, aliasIndex);
        if (!hit.movement_id || hit.confidence < threshold) {
          unmatched += 1;
          return { ...mv, matchConfidence: hit.confidence };
        }
        return { ...mv, movement_id: hit.movement_id, matchConfidence: hit.confidence };
      });
    });
  });

  const warnings = unmatched ? [`No se reconocieron ${unmatched} movimientos, selecciónalos manualmente.`] : [];

  return { matched: cloned, warnings };
}
