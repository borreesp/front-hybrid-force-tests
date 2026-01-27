## Inventario de gráficos y barras (estado previo)

- `src/components/RadarChartWOD.js`
  - Uso: `src/views/wod-analysis.js` (sección capacidades).
  - Tipo: Radar sencillo con `recharts` (`RadarChart`, `PolarGrid`, etc.).
  - Datos: capacidades WOD (`label`, `value`).

- `src/components/HyroxStationsChart.js`
  - Uso: `src/views/wod-analysis.js` (transferencia a estaciones HYROX).
  - Tipo: Barras horizontales con `recharts` (`BarChart`, `Bar`, `CartesianGrid`, `XAxis`, `Tooltip`).
  - Datos: `{ station, transfer }`.

- `src/components/MetricsTable.js`
  - Uso: `src/views/wod-analysis.js` (tabla de métricas de dominio / estímulo).
  - Tipo: tabla estática (no chart) pero muestra métricas clave.

- `src/views/wod-analysis.js`
  - Incluye también un `BarChart` inline de tiempos por nivel (Beginner, Intermedio, RX, HYROX).

- `apps/web/components/workout/AthleteRadarChart.tsx`
  - Uso: `apps/web/app/workouts/[id]/page.tsx` (impacto en habilidades).
  - Tipo: Radar SVG custom (no librería externa), datos `{ label, value }`.

- `apps/web/components/ui/AthleteRadarChart.tsx`
  - Uso: `apps/web/app/progress/page.tsx`.
  - Tipo: Radar SVG custom.

- `apps/web/components/profile/AthleteRadarChart.tsx`
  - Uso: `apps/web/app/profile/page.tsx`.
  - Tipo: Radar SVG custom.

- Barras/Progreso en apps web/mobile:
  - `apps/web/app/page.tsx`, `apps/web/app/workouts/page.tsx`, etc.: barras/metric cards estáticas (no charts).
  - `apps/mobile/app/progress.tsx`: barras de progreso manuales (div con ancho dinámico).

## Plan de refactor (nuevo sistema unificado)

- Librería estándar: `recharts` para Radar y Barras en `src/components/charts`.
- Componentes base a crear:
  - `HexRadarChart`: radar animado con props genéricas (`label`, `value`, colores).
  - `BarLevelChart`: barras verticales para tiempos por nivel (amarillo, fondo oscuro).
  - `LinearProgressBar`: barra horizontal para porcentajes.
  - `CircularXpProgress`: anillo circular para XP/nivel.

## Vista WOD/Analizador (wod-analysis)

- Sustituir layout antiguo por `TabbedSection` con pestañas estilo chip (Resumen, Hexágono, Detalles, HYROX, Material, WODs similares / Semana, Valoración Social).
- Usar charts unificados (`HexRadarChart`, `BarLevelChart`, `LinearProgressBar`, `CircularXpProgress`) y cards glass.

