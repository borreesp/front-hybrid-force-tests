# Frente de limpieza frontend (iteración actual)

## Configuración y checks ejecutados
- TypeScript: se activó `noUnusedLocals` y `noUnusedParameters` en `tsconfig.json` (base), y se añadió script `typecheck` vía Turbo.
- ESLint: nuevo `.eslintrc.cjs` en `apps/web` con `unused-imports` para detectar imports/vars no usados; script `lint` ya apunta a `next lint`.
- Scripts raíz: añadidos `pnpm lint` (turbo) y `pnpm typecheck` (turbo).
- Ejecutado `pnpm --filter web lint` (ok, solo warnings) y `pnpm --filter web typecheck` (ok). `pnpm lint` global falló por `apps/mobile` (`__dirname` no definido en `metro.config.js` tras auto-config de expo-lint); se dejó pendiente para no abrir frente móvil. `pnpm typecheck` global: ok.

## Inventario de páginas principales y componentes (uso observado por imports)
- `/` Dashboard (`app/page.tsx`): usa UI básica (`@thrifty/ui` Card/Section/Metric/Button) + `HelpTooltip`.
- `/athlete` (`app/athlete/page.tsx`): `AthleteHeader`, `AthleteRadar`, `ProgressTimeline`, `MetricsPRs`, `EquipmentSkills`, `FatigueStatus`, `AchievementGrid`, `MissionBoard`, `BenchmarkSummary`, `HelpTooltip`.
- `/workouts` listado (`app/workouts/page.tsx`): render de cards nativos (no componentes compartidos), usa `@thrifty/ui` Card/Section.
- `/workouts/[id]/time` (registro de tiempos): formulario propio (sin compartir UI externa).
- `/wod-analysis` (`app/wod-analysis/page.tsx`): `HeroHeader`, `UploadForm`, `BlocksEditor`, `AnalyzingOverlay`.
- Builder / estructura (`components/wod-builder/WodBuilder.tsx`, usado en páginas de estructura/workouts editing): pieza principal del constructor.

## Componentes sin referencias (rg no encontró imports; candidatos a borrar en siguiente pasada)
- `apps/web/components/wod-analysis/AthleteImpactCompact.tsx`
- `apps/web/components/ui/AthleteRadarChart.tsx`
- `apps/web/components/ui/HexMetricCard.tsx`
- `apps/web/components/ui/SkillTree.tsx`
- `apps/web/components/ui/TimelineWeek.tsx`
- `apps/web/components/ui/WorkoutCardAdvanced.tsx` (solo aparece en `page.tsx.bak`)
- `apps/web/components/wod/DataVisualZone.tsx`
- `apps/web/components/wod/PersonalTrackPanel.tsx`
- `apps/web/components/wod/TacticalInsightsPanel.tsx`

## Duplicados evidentes (para unificación futura)
- Radar de atleta repetido en tres variantes: `components/profile/AthleteRadarChart.tsx`, `components/workout/AthleteRadarChart.tsx`, `components/ui/AthleteRadarChart.tsx`.
- Cards/hex cards para métricas: `Profile/HexBioStat.tsx`, `workout/HexStatCard.tsx`, `ui/HexMetricCard.tsx`.
- Headers/section wrappers: `components/ui/SectionHeader.tsx` y patrones similares en páginas (podrían centralizarse).

## Limpieza aplicada en esta iteración
- Eliminados imports/vars sin uso que rompían `tsc`: `imageUrl`/`formData` en `app/wod-analysis/page.tsx`, `cn` en varios componentes, `WorkoutBlock` en `lib/hyrox.ts`, `validationErrors` en `WodBuilder`, tipos/componentes no usados en `AthleteImpact`.
- Se instaló `eslint-plugin-unused-imports` en `apps/web` para reportar muertos de forma consistente.
- Lint global quedó bloqueado por `apps/mobile` (fuera de alcance actual); dejar nota antes de tocar metro/config si se aborda.

## OCR → Parser → Matching (estado actual)
- Módulos en `apps/web/lib/wodOcr/`: `ocrClient` (llama al backend `/wod-analysis/ocr`, con fallback mock determinista por hash del archivo), `parser` (ParsedWod), `movementMatcher` (alias + keywords en `aliases.ts`).
- OCR ahora va contra backend real (Tesseract). Front no genera texto local: si falla, muestra error y texto vacío.
- Flujo en `/app/wod-analysis/page.tsx`: subir imagen → `extractText` → `parseWodText` → `matchMovements` (catálogo de movements) → prefill de `EditableWodBlock`.
- UI: estado de OCR con badge (mock/real), fuente filename/size, warnings y texto detectado colapsable. Al re-subir imagen se limpia el texto previo.
- Backend mock: el texto cambia según hash de los bytes del archivo (5 muestras rotativas). Endpoint JSON: `{text, confidence, mode, source:{filename,size_bytes,hash_sha256}}`.
- Verificación manual (DevTools): en Network debe verse `POST /wod-analysis/ocr` con multipart `file`; el texto de respuesta debe cambiar al subir dos imágenes distintas. Logs en consola: `[OCR] uploading file` y `[OCR] response` con preview.
