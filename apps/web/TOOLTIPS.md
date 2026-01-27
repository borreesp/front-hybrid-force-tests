## Sistema de tooltips de ayuda

- Diccionario central: `apps/web/lib/helpText.ts`. Añade claves (ej. `dashboard.xp`, `athlete.radar`) y su copy (`title`, `body`).
- Componentes:
  - `HelpTooltip` (`apps/web/components/ui/HelpTooltip.tsx`): icono `?` accesible (hover + focus). Props: `helpKey`, `placement`, `delayMs`.
  - `HelpLabel` (opcional) para labels con ayuda inline.
- Uso rápido:
  ```tsx
  import { HelpTooltip } from "../components/ui/HelpTooltip";

  <div className="flex items-center gap-2">
    <span>Fatiga</span>
    <HelpTooltip helpKey="dashboard.fatigue" />
  </div>
  ```
- Fallback: si la clave no existe muestra “Ayuda no disponible” y en dev lanza `console.warn`.
- Convención de claves:
  - `dashboard.*`, `athlete.*`, `trainingLoad.*`, `wod.*`, `forms.*`
  - Usa nombres cortos y consistentes (`sessionsWeek`, `fatigue`, `loadRatio`, etc.).
- Estilo: fondo oscuro, borde redondeado, ancho máximo 320px, soporta multilínea/`whitespace-pre-line`.
- Accesibilidad: botón con `aria-describedby`, accesible por tab (focus) y mouse (hover).
