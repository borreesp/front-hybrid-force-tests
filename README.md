### Novedades conectadas al backend

- Autenticacion obligatoria en todo el flujo web: login/register con cookies HttpOnly, guard global que redirige a /auth/login si no hay sesion.
- Nuevas vistas web: /movements, /workouts/structure, /profile/training-load, /profile/capacity-profile, /lookups (y mejoras en /workouts/[id] y /gear).
- Cliente API centralizado en apps/web/lib/api.ts (NEXT_PUBLIC_API_BASE_URL, default http://localhost:8000).
- Las pantallas de workouts, detalle, material y perfiles consumen los endpoints de bloques, versiones, movimientos, lookups, training load y capacity profile del backend FastAPI.

# Thrifty-Distant-Woodpecker-React

Frontend monorepo para un MVP de plataforma de atletas híbridos (CrossFit / HYROX / Endurance).  
Incluye Next.js (web), Expo (mobile), sistema unificado de gráficos y vistas gamificadas para perfil, progreso y analizador de WODs.

## 1. Estructura del monorepo

Raíz:

- `package.json` – scripts con Turbo (`pnpm dev`, `pnpm build`, `pnpm lint`).
- `turbo.json` – pipelines para apps y packages.
- `tsconfig.json` – configuración TypeScript compartida.
- `pnpm-workspace.yaml` – workspaces de apps y packages.

Apps:

- `apps/web` – Next.js 14 con App Router + Tailwind.
- `apps/mobile` – Expo React Native + Expo Router + NativeWind.

Paquetes compartidos:

- `packages/ui` – componentes de UI universales (Web + RN): botones, cards, layouts, inputs, métricas, header, etc.
- `packages/config` – tokens de diseño y configuración Tailwind (colores, tipografías, radios, sombras).
- `packages/utils` – helpers y store global con Zustand (usuario, workouts, progresión, milestones, material).

Código histórico CRA (para referencia del diseño original):

- `src` – SPA antigua con `wod-analysis`, navegación, gráficos amarillos y layout previo.

## 2. Aplicación web (Next.js)

La aplicación web vive en `apps/web` y se sirve mediante `pnpm --filter web dev` o `pnpm dev` (junto a mobile).

Rutas principales (App Router):

- `/` – Dashboard general del atleta.
- `/auth/login`, `/auth/register` – acceso/registro.
- `/profile` – página de perfil del atleta híbrido.
- `/progress` – modo carrera y progresión por niveles.
- `/workouts` – listado de entrenamientos.
- `/workouts/new` – creación de workout.
- `/workouts/[id]` – detalle avanzado de un workout (WorkoutDetail).
- `/wod-analysis` – analizador completo de un WOD (estructura con pestañas + gráficos).
- `/gear` – material recomendado según nivel.

### 2.1. Sistema de UI compartido

En `packages/ui` se definen componentes estilados con Tailwind/NativeWind:

- Layouts: `Screen`, `Section`, `AppHeader`.
- Cards: `Card`, `Metric`, `HexMetricCard` (para KPIs hexagonales en el dashboard).
- Formularios: `Input`, `Button` (primario, secundario, ghost).
- Componentes mobile equivalentes (`*.native.tsx`) para Expo.

La web importa estos componentes mediante aliases:

- `@thrifty/ui` – componentes de presentación.
- `@thrifty/utils` – helpers (`cn`) y store global.
- `@thrifty/config` – tema de diseño (colores, tipografías, radii).

### 2.2. Sistema de gráficos unificado

Para Next.js se centralizan los charts en `apps/web/components/charts/`:

- `HexRadarChart.tsx` – gráfico radar hexagonal (Recharts) con 5–6 ejes y estilo glass + gradiente.
- `BarLevelChart.tsx` – gráfico de barras verticales para tiempos por nivel (Beginner / Intermedio / RX / HYROX), barras amarillas sobre fondo oscuro.
- `LinearProgressBar.tsx` – barra horizontal de progreso, con variante compacta para listas (por ejemplo, transferencia HYROX por estación).
- `CircularXpProgress.tsx` – anillo circular de XP / progreso de nivel, con porcentaje centrado.

Estos componentes se usan en:

- `/wod-analysis` – radar de capacidades, barras de tiempo por nivel, barras de transferencia HYROX y anillos de XP.
- `/profile` – skills radar del atleta (mismo estilo que el de WOD-analysis).
- `/progress` – radar de atributos y barra/ruta de niveles.

## 3. Pantallas clave (WEB)

### 3.1. Analizador WOD (`/wod-analysis`)

Se compone de:

- **Hero principal**:
  - Título “Análisis completo de tu WOD”.
  - Descripción del tipo de WOD (`summaryData.wodType`).
  - Botones “Guardar WOD” y “Analizar otro WOD”.
  - Tres mini-cards: Dominio, Intensidad, Transfer HYROX.
  - Panel derecho con el **WOD original** (`wodText`) en un `pre` dentro de un card glass.
- **Tabs tipo chip** (`TabbedSection`):
  1. **Resumen**
     - Tres tarjetas grandes de dominio energético, músculos principales y tipo de atleta favorecido.
     - `BarLevelChart` con “Tiempo estimado por nivel”.
     - Tarjetas de “Notas rápidas” (pacing, breaks, atleta objetivo).
  2. **Hexágono de Capacidades**
     - `HexRadarChart` con capacidades: Fuerza, Endurance, Velocidad, Skill/Gimnásticos, Metcon, Carga muscular.
     - Grid de tarjetas con explicación de cada capacidad.
  3. **Detalles Técnicos**
     - Cards con volumen total, ratio trabajo/descanso, tipo de carga, estímulo dominante, dificultad, cadena muscular.
  4. **Enfoque HYROX**
     - Lado izquierdo: lista de estaciones HYROX con `LinearProgressBar` compacta (SkiErg, Sled Push, Row, etc.).
     - Lado derecho: `CircularXpProgress` con XP HYROX y copy “Compatibilidad global con estaciones”.
  5. **Material Recomendado**
     - Cards de material con nombre, nivel recomendado y descripción (zapatillas, cinturón, rodilleras, magnesio…).
  6. **WODs Similares / Semana Recomendada**
     - Cards de WODs similares (nombre, foco, duración).
     - Layout de semana recomendada (Lunes/Miércoles/Viernes/Sábado) con foco y descripción por día.
  7. **Valoración Social**
     - Placeholder de feedback de comunidad y ratings (cards glass listas para integrar backend).

### 3.2. Perfil de atleta (`/profile`)

Estructura general:

- `ProfileHeader` – avatar, nombre, nivel, XP actual, anillo de progreso de XP con porcentaje y CTA “Editar perfil”.
- `TabbedSection` con pestañas:
  - **Perfil** – header completo.
  - **Biometría** – `BioMetricGrid` con `HexBioStat` para:
    - Peso, altura, % grasa, VO2max, FC reposo, HRV.
  - **Skills radar** – `HexRadarChart` con:
    - Engine, Fuerza, Potencia, Velocidad, Agilidad, Movilidad.
  - **Estado fisiológico** – `PhysiologyPanel` con cards de VO2max, umbral de lactato, sistema metabólico dominante, eficiencia O2 y recuperación estimada.
  - **Fuerza máxima** – `StrengthStatsCard` con squat/bench/deadlift 1RM, clean/snatch/jerk, pullups/dips, potencia (W), salto vertical.
  - **Endurance** – `EnduranceStatsCard` con 5K/10K, paces 1k/3k, remo 500m/2k, FTP cycling, Assault Bike (1min/10min), anaerobic capacity score, metcon efficiency.
  - **Mental / Hábitos** –
    - `MentalStateCard` para motivación, disciplina, enfoque, estrés, frustración, drive competitivo, consistencia.
    - `LifestyleCard` para horas y calidad de sueño, hidratación, nutrición, pasos diarios, experiencia, frecuencia semanal, protocolos de recuperación.
  - **Datos subjetivos** – `SubjectiveNotesCard` con energía percibida, fatiga, estado emocional, dolor articular, RPE medio, recuperación percibida.

### 3.3. Progreso / Modo carrera (`/progress`)

Secciones:

- **Modo carrera (header)** – 3 métricas con `Metric`:
  - Nivel actual, XP acumulado, objetivo próximo.
- **Detalle en pestañas** (`TabbedSection`):
  - Ruta de niveles – `LevelProgressList`:
    - Cards por nivel (Rookie, Base, Challenger, Elite, Pro) con porcentaje y `LinearProgressBar` al estilo HYROX.
  - Atributos del atleta – `HexRadarChart` con Fuerza, Engine, Velocidad, Potencia, Movilidad, Táctica.

## 4. Aplicación mobile (Expo)

La app mobile vive en `apps/mobile` y utiliza Expo Router + NativeWind.  
Rutas equivalentes a la web (Dashboard, Auth, Profile, Workouts, Progress, Milestones, Gear) con UI adaptada a móvil utilizando los componentes `@thrifty/ui` en sus variantes `.native.tsx`.

Arranque:

- `pnpm --filter mobile dev -- --port 8082` y abrir con Expo Go o emulador.

## 5. Estado global y utils

En `packages/utils`:

- `src/store/index.ts` – store Zustand con slices para:
  - `user`, `workouts`, `progression`, `milestones`, `gear`.
- `src/utils/cn.ts` – helper para concatenar clases CSS (`cn()`).

Actualmente se usa de forma ligera (estructura lista para integrar backend y lógica real).

## 6. Cómo desarrollar

Requisitos:

- Node >= 18, pnpm instalado.

Instalación:

```bash
pnpm install
```

Desarrollo:

```bash
# web + mobile en paralelo
pnpm dev

# solo web
pnpm --filter web dev

# solo mobile
pnpm --filter mobile dev -- --port 8082
```

Build y lint:

```bash
pnpm build
pnpm lint
```

---

Este README resume la arquitectura, las pantallas y los gráficos clave de la aplicación para facilitar futuras iteraciones de producto y la integración de backend.



