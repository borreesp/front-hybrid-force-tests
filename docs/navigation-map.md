# Navegacion y flujos (frontend -> backend)

## Rutas nuevas/extendidas
- `/movements`: lista movimientos + musculos (GET /movements).
- `/workouts/structure`: selector de workout con bloques/version y metadatos (GET /workouts, /workouts/{id}/structure).
- `/workouts/[id]`: detalle avanzado con bloques, versiones y estaciones HYROX (GET /workouts/{id}/structure, /versions).
- `/profile/training-load`: tabla de cargas del usuario (GET /users/{id}/training-load).
- `/profile/capacity-profile`: radar con capacidades del usuario (GET /users/{id}/capacity-profile).
- `/lookups`: vistas de tablas catalogo (GET /lookups).
- `/gear`: equipo conectado a `/equipment` y muscles de `/lookups`.

## Servicios front (apps/web/lib/api.ts)
- `getWorkouts`, `getWorkoutStructure`, `getWorkoutBlocks`, `getWorkoutVersions`, `getWorkoutStats` -> workouts.
- `getMovements` -> movimientos + musculos.
- `getTrainingLoad`, `getCapacityProfile` -> user metrics.
- `getLookupTables`, `getEquipment` -> lookups/equipo.

## Flujo de datos
- Todas las llamadas usan `NEXT_PUBLIC_API_BASE_URL` (default http://localhost:8000).
- Respuestas del backend usan `code` de lookups para mantener compatibilidad con enums previos.
- Pages mantienen el look & feel glass/gradient original; solo se rellenan con datos en vivo.

