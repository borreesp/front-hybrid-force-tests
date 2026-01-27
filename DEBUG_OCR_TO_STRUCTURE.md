# Flujo OCR → Structure (WOD Builder)

- `/wod-analysis`
  - OCR real: `POST /wod-analysis/ocr` devuelve `text`, `mode`, `source`.
  - Parser backend: `POST /wod-analysis/parse` → `WorkoutDraft` (style, rounds, work/rest, scenarios/items, unresolved).
  - Front guarda `{parsed: draft, text}` en `localStorage` clave `wod_builder_draft`; botón “Editar en Estructura” navega a `/workouts/structure?draft=1`.
- `/workouts/structure` (WodBuilder)
  - Al montar y tener `draft=1`, lee `wod_builder_draft` de localStorage.
  - `mapDraftToBlocks` convierte `WorkoutDraft` → `WodBlock`:
    - Normaliza `block_type` (intervals/rounds/standard).
    - Mantiene `rounds`, `work/rest` como `scenario_work_seconds`/`scenario_rest_seconds`.
    - Crea `scenarios` con `tasks` referenciando `movement_uid`; `role`:
      - `REMAINING` si se detecta MAX/MÁX.
      - `CAP` si hay cantidad (reps/cals/m/dist/seg).
      - `STANDARD` si neutro.
    - Si no resuelve movimiento en catálogo, crea placeholder y marca en `unresolved` con escenario e índice.
    - `pattern` toma labels de escenarios.
    - `unresolved` se usa para bloquear guardado.
  - CTA de guardado se deshabilita si hay `unresolved`; banner avisa.

# Punto de rotura encontrado
- El mapper `mapDraftToBlocks` aplanaba los escenarios y tomaba solo el primer escenario; no generaba `tasks` ni `scenarios`, perdiendo rounds/work/rest.

# Fix aplicado
- `mapDraftToBlocks` ahora:
  - Recorre todos los escenarios/items del draft.
  - Crea movimientos con `uid` y tareas por escenario (`STANDARD` / `REMAINING`).
  - Copia `work_seconds` / `rest_seconds` en `scenario_work_seconds` / `scenario_rest_seconds` y `pattern` con labels.
  - Devuelve también `unresolved` para avisar/bloquear guardado.
- Botones de guardado se deshabilitan si hay `unresolved` del draft.

# Campos canónicos (WorkoutDraft esperado)
- `title`, `source_text`
- `detected.workout_style`
- `rounds`, `work_seconds`, `rest_seconds`, `time_cap_seconds`
- `blocks[]`: `block_type`, `rounds`, `work_seconds`, `rest_seconds`, `scenarios[]`
- `scenarios[]`: `label`, `items[]`
- `items[]`: `raw`, `movement_id?`, `unresolved_label?`, `reps?`, `distance_meters?`, `duration_seconds?`, `calories?`, `load?`, `load_unit?`, `is_max?`
- `unresolved[]`: `{raw, suggestions[]}`
