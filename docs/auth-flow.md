# Autenticacion y proteccion

## Backend (FastAPI)
- Endpoints publicos: `/auth/login`, `/auth/register`, `/auth/refresh`, `/auth/logout`, `/auth/me` y `/` healthcheck.
- Todos los demas routers incluyen la dependencia `require_user` (JWT en cookie/Authorization). `token_version` en usuarios permite invalidar sesiones en logout.
- Tokens: access 20 min (`access_token`), refresh 7 dias (`refresh_token`) en cookies HttpOnly SameSite=Lax (activar `COOKIE_SECURE=true` en prod). Logout incrementa `token_version`.
- Passwords: almacenadas hasheadas con bcrypt (`passlib`).
- Rate limit de login: 5 intentos por IP/email cada 10 min.

## Frontend (Next.js)
- Guard global en `AuthShell` (App Router layout) usa `useAuth` para llamar a `/auth/me`; si no hay sesion redirige a `/auth/login` y no renderiza contenido.
- Estado auth en Zustand (`packages/utils`): `user`, `authLoading`. Sesion usa cookies; no se guardan tokens en localStorage.
- Login/register en `/auth/login` y `/auth/register` consumen `/auth/login` y `/auth/register` con `credentials: include`.
- Boton de logout en header llama `/auth/logout` y limpia store.
- Paginas de metricas (training load, capacity profile) consumen endpoints filtrando por `current_user` y usan el `user.id` autenticado.

## Flujo resumido
1. Usuario entra a `/auth/login`, envía email/password -> backend valida + set-cookies access/refresh.
2. `useAuth` llama `/auth/me` (con cookies) y guarda el usuario en store.
3. Al navegar a cualquier ruta protegida, si `user` falta se redirige a `/auth/login`.
4. Logout -> `/auth/logout` incrementa `token_version`, borra cookies y limpia store.

## Añadir pagina protegida
- Coloca la pagina bajo el layout actual (se protege automaticamente por `AuthShell`).
- Usa hooks/api con `credentials: "include"`; si necesitas el usuario, importa `useAuth()`.
