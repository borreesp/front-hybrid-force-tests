## Sistema de tooltips de ayuda

- Diccionario central: `apps/web/lib/helpText.ts`. Anade claves (ej. `dashboard.xp`, `athlete.radar`) y su copy (`title`, `body`).
- Componentes:
  - `HelpTooltip` (`apps/web/components/ui/HelpTooltip.tsx`): icono `?` accesible (hover + focus). Props: `helpKey`, `placement`, `delayMs`.
  - `HelpLabel` (opcional) para labels con ayuda inline.
- Uso rapido:
  ```tsx
  import { HelpTooltip } from "../components/ui/HelpTooltip";

  <div className="flex items-center gap-2">
    <span>Tests 7d</span>
    <HelpTooltip helpKey="dashboard.sessionsWeek" />
  </div>
  ```
- Fallback: si la clave no existe muestra "Ayuda no disponible" y en dev lanza `console.warn`.
- Convencion de claves:
  - `dashboard.*`, `athlete.*`, `wodBuilder.*`, `forms.*`
  - Usa nombres cortos y consistentes (`sessionsWeek`, `testsTotal`, `difficultyEstimated`, etc.).
- Estilo: fondo oscuro, borde redondeado, ancho maximo 320px, soporta multilinea/`whitespace-pre-line`.
- Accesibilidad: boton con `aria-describedby`, accesible por tab (focus) y mouse (hover).
