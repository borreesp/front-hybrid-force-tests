# Mobile (Expo) - API + Debug

## Configuracion de API

Usa `EXPO_PUBLIC_API_URL` para definir el backend:

```bash
# iOS Simulator (normalmente funciona con localhost)
EXPO_PUBLIC_API_URL=http://localhost:9000

# Android Emulator (usa 10.0.2.2)
EXPO_PUBLIC_API_URL=http://10.0.2.2:9000

# Dispositivo fisico (IP local del host)
EXPO_PUBLIC_API_URL=http://192.168.1.X:9000
```

Puedes definirlo en un `.env` dentro de `apps/mobile` o exportarlo antes de ejecutar Expo.

Si `EXPO_PUBLIC_API_URL` no esta definido, el cliente lanza el error:
`API base URL not configured`.

## Debug screen

La pantalla de debug vive en `app/(dev)/debug.tsx` (grupo `(dev)`).
Ruta: `/debug` dentro de la app.

Incluye:
- Login mobile (X-Client: mobile)
- /auth/me
- /athlete/profile
- /ranking/summary
- Logout

Nota: en builds release, la pantalla muestra "Not available in production" y no expone acciones.
