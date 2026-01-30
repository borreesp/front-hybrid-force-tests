/* Quick smoke tests for the impact engine.
 * Run with: pnpm dlx ts-node --esm apps/web/lib/analysis/impactEngine.test.ts
 */
import assert from "node:assert";
import { calculateWodImpact } from "./impactEngine";

const level = 30;

// Row 500m should hover around the base score (~1)
const rowBase = calculateWodImpact(
  [
    {
      title: "Row block",
      movements: [{ name: "Row", distance_meters: 500 }]
    }
  ],
  level
);
assert(
  rowBase.difficulty_total > 0.7 && rowBase.difficulty_total < 1.6,
  "Row 500m should create ~1.0 difficulty"
);

// Faster target time should increase difficulty
const rowFast = calculateWodImpact(
  [
    {
      title: "Row block",
      movements: [{ name: "Row", distance_meters: 500, target_time_seconds: 80 }]
    }
  ],
  level
);
assert(rowFast.difficulty_total > rowBase.difficulty_total, "Faster target time should raise difficulty");

// Repeated pull movements should apply muscle penalty
const pullRepeat = calculateWodImpact(
  [
    {
      title: "Pullers",
      movements: [
        { name: "Pull-up", reps: 10 },
        { name: "Pull-up", reps: 10 },
        { name: "Pull-up", reps: 10 },
        { name: "Pull-up", reps: 10 }
      ]
    }
  ],
  level
);
assert(
  pullRepeat.muscle_counts.pull >= 4 && pullRepeat.difficulty_total > rowBase.difficulty_total,
  "Muscle penalty should accumulate on repeated pull work"
);

console.log("[impactEngine.test] All impact engine smoke tests passed.");
