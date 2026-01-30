### Novedades conectadas al backend

- Autenticacion obligatoria en todo el flujo web: login/register con cookies HttpOnly, guard global que redirige a /auth/login si no hay sesion.
- Rutas web activas: /workouts, /workouts/structure, /workouts/[id], /workouts/[id]/time, /athlete, /profile/capacity-profile, /lookups (y mejoras en /workouts/[id]).
- Cliente API centralizado en apps/web/lib/api.ts (NEXT_PUBLIC_API_BASE_URL, default http://localhost:8000).
- Las pantallas de workouts, detalle y perfiles consumen endpoints de bloques, versiones, movimientos, lookups, resultados y capacity profile del backend FastAPI.

# Thrifty-Distant-Woodpecker-React

Frontend monorepo para un MVP de plataforma de atletas hibridos (CrossFit / HYROX / Endurance).
Incluye Next.js (web), Expo (mobile) y un sistema de UI compartido para perfiles, progreso y analisis de WODs.

## 1. Estructura del monorepo

Raiz:

- package.json – scripts con Turbo (pnpm dev, pnpm build, pnpm lint).
- turbo.json – pipelines para apps y packages.
- tsconfig.json – configuracion TypeScript compartida.
- pnpm-workspace.yaml – workspaces de apps y packages.

Apps:

- apps/web – Next.js 14 con App Router + Tailwind.
- apps/mobile – Expo React Native + Expo Router + NativeWind.

Paquetes compartidos:

- packages/ui – componentes de UI universales (Web + RN).
- packages/config – tokens de diseno y configuracion Tailwind.
- packages/utils – helpers y store global con Zustand.

## 2. Aplicacion web (Next.js)

La aplicacion web vive en apps/web y se sirve mediante pnpm --filter web dev o pnpm dev (junto a mobile).

Rutas principales (App Router):

- / – Dashboard del atleta (tests, capacidades, progreso).
- /auth/login, /auth/register – acceso/registro.
- /athlete – dashboard central del atleta (radar de capacidades, PRs/tests, progreso).
- /workouts – listado de entrenamientos.
- /workouts/structure – creacion/edicion de WODs y tests.
- /workouts/[id] – detalle avanzado de un workout.
- /workouts/[id]/time – registro de tiempo/resultado del test.
- /lookups – catalogos y data dictionary.

## 3. Pantallas clave (WEB)

- Dashboard (/): resumen de tests recientes, capacidades y progreso.
- Athlete (/athlete): radar de capacidades, PRs/tests y evolucion.
- Workouts (/workouts): listado + detalle con impacto en capacidades.
- Builder (/workouts/structure): construccion de WODs tipo test y asignacion.
- Registro de tiempos (/workouts/[id]/time): captura de resultados del test.

## 4. Aplicacion mobile (Expo)

La app mobile vive en apps/mobile y utiliza Expo Router + NativeWind.
Rutas equivalentes a la web (Dashboard, Auth, Athlete, Workouts) con UI adaptada a movil utilizando los componentes @thrifty/ui en sus variantes .native.tsx.

Arranque:

- pnpm --filter mobile dev -- --port 8082 y abrir con Expo Go o emulador.

## 5. Estado global y utils

En packages/utils:

- src/store/index.ts – store Zustand con slices para user, workouts, progression, milestones, gear.
- src/utils/cn.ts – helper para concatenar clases CSS (cn()).

## 6. Como desarrollar

Requisitos:

- Node >= 18, pnpm instalado.

Instalacion:

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

## Entorno tests (paralelo)

Este repo usa un entorno paralelo aislado del original. Cambios solo de entorno/infra (puertos y envs), sin tocar la app.

Archivos de entorno (web):
- apps/web/.env.tests (tests local con API en 9000)
- apps/web/.env.example (plantilla)
- apps/web/.env.production (valores tests por defecto)

Puertos tests:
- Web (Next): http://localhost:3100
- Mobile (Expo): 8083
- API (backend tests): http://localhost:9000

Comandos tests:

```bash
# web + mobile (puertos tests)
pnpm dev_tests

# solo web
pnpm --filter web dev_tests

# solo mobile
pnpm --filter mobile dev_tests
```

---

Este README resume la arquitectura y las pantallas clave de la aplicacion para facilitar futuras iteraciones de producto y la integracion de backend.
