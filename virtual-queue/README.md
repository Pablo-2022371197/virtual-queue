# Virtual Queue (Web)

Frontend web del sistema **Virtual Queue**: gestión de filas de espera digitales con actualizaciones en tiempo real y notificaciones al dispositivo móvil/wearable.

Este proyecto es la interfaz para usuarios finales y administradores que consultan turnos, buscan establecimientos y visualizan estadísticas de filas en vivo.

## Rol en el ecosistema

```
┌─────────────────────┐     REST / WebSocket     ┌──────────────────────┐
│   virtual-queue     │ ◄──────────────────────► │  virtual-queue-back  │
│   (React + Vite)    │                          │   (Spring Boot)      │
└─────────┬───────────┘                          └──────────┬───────────┘
          │ iframe /flutter                                   │
          ▼                                                   ▼
┌─────────────────────┐                          ┌──────────────────────┐
│ Widget Flutter Web  │                          │  virtual-queue-mobile│
│ (main_stats.dart)   │                          │  (Android + Wear OS) │
└─────────────────────┘                          └──────────────────────┘
```

| Componente | Descripción |
|------------|-------------|
| **virtual-queue** | Sitio público, panel autenticado y dashboard web |
| **virtual-queue-back** | API REST, WebSockets STOMP y assets estáticos del widget Flutter |
| **virtual-queue-mobile** | App nativa, reloj Wear OS y build web del widget de estadísticas |

## Stack tecnológico

| Tecnología | Uso |
|------------|-----|
| React 19 + TypeScript | Interfaz de usuario |
| Vite 8 | Bundler y servidor de desarrollo |
| React Router 7 | Navegación |
| TanStack Query | Caché y peticiones al backend |
| HeroUI + Tailwind CSS 4 | Componentes y estilos |
| STOMP + SockJS | Actualizaciones de fila en tiempo real |
| Firebase (web) | Registro de tokens FCM (preparado) |

## Funcionamiento

### Sitio público

Rutas accesibles sin autenticación, con layout propio (`PublicLayout`):

| Ruta | Página |
|------|--------|
| `/` | Landing |
| `/nosotros` | Acerca del proyecto |
| `/faq` | Preguntas frecuentes |
| `/contacto` | Formulario y datos de contacto |
| `/privacidad` | Política de privacidad |
| `/terminos` | Términos de uso |

La configuración de marca y contacto vive en `src/lib/siteConfig.ts`.

### Área autenticada

Tras iniciar sesión, el usuario accede al panel con sidebar (`Layout`):

| Ruta | Función |
|------|---------|
| `/home` | Muestra el turno activo del usuario (`GET /api/tickets/mine`) |
| `/search` | Lista y filtra establecimientos (`GET /api/places`) |
| `/place/:id/queue` | Estadísticas en vivo del establecimiento |
| `/estadisticas` | Panel de métricas con widget embebido |

**Autenticación temporal:** mientras el backend implementa JWT, el login usa credenciales estáticas (`admin` / `admin`) y guarda un token en `localStorage`. Las rutas protegidas redirigen a `/login` si no hay sesión.

### Tiempo real

- **`useQueueSocket`**: suscripción STOMP a `/topic/queue/{ticketId}` vía SockJS en `/ws`.
- **`DashboardStats`**: embebe un iframe apuntando a `/flutter/?placeId={id}`. Ese bundle Flutter Web (compilado desde `virtual-queue-mobile`) se conecta a `/topic/stats/{placeId}` y notifica a React con `postMessage` cuando se llama un turno.

### Cliente HTTP

`src/lib/client.ts` centraliza las peticiones:

- Prefijo base: `VITE_API_URL` (por defecto `http://localhost:8080`)
- Interceptor que adjunta `Authorization: Bearer {jwt}`
- Redirección automática a `/login` ante respuestas `401`

En desarrollo, Vite hace proxy de `/api`, `/ws` y `/flutter` hacia el backend (ver `vite.config.ts`).

## Requisitos previos

- Node.js 20+
- pnpm, npm o yarn
- Backend en ejecución (`virtual-queue-back` en el puerto 8080)

## Configuración

Copia las variables de entorno en `.env`:

```env
VITE_API_URL=http://localhost:8080
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_PROJECT_ID=your-firebase-project-id
VITE_FIREBASE_SENDER_ID=your-firebase-sender-id
VITE_FIREBASE_APP_ID=your-firebase-app-id
VITE_FIREBASE_VAPID_KEY=your-firebase-vapid-key
```

## Cómo ejecutar

```bash
# Instalar dependencias
pnpm install

# Servidor de desarrollo (http://localhost:5173)
pnpm dev

# Build de producción
pnpm build

# Vista previa del build
pnpm preview

# Linter
pnpm lint
```

## Estructura del proyecto

```
src/
├── App.tsx                 # Definición de rutas
├── main.tsx                # Punto de entrada (QueryClient, Router, HeroUI)
├── auth/
│   └── LoginPage.tsx       # Formulario de inicio de sesión
├── app/                    # Panel autenticado
│   ├── HomePage.tsx        # Turno activo
│   ├── SearchPage.tsx      # Búsqueda de establecimientos
│   ├── StatsPage.tsx       # Dashboard de estadísticas
│   ├── layout/             # Sidebar, menú de usuario
│   └── place/
│       ├── PlaceQueuePage.tsx
│       └── DashboardStats.tsx   # iframe del widget Flutter
├── public/                 # Sitio público (landing, FAQ, contacto…)
├── hooks/                  # useMyTicket, usePlaces, useQueueSocket…
├── lib/                    # client, auth, firebase, siteConfig
├── shared/                 # Brand, iconos, providers
└── types/                  # Place, Ticket
```

## Endpoints consumidos

| Método | Ruta | Uso |
|--------|------|-----|
| `GET` | `/api/places` | Listado de establecimientos |
| `GET` | `/api/tickets/mine` | Turno activo del usuario |
| `POST` | `/api/devices/register` | Registro de token FCM (web) |
| WebSocket | `/ws` → `/topic/queue/{ticketId}` | Actualizaciones del turno |
| WebSocket | `/ws` → `/topic/stats/{placeId}` | Estadísticas del establecimiento (widget Flutter) |

> Varios de estos endpoints están planificados en el backend y pueden no estar implementados aún.

## Widget Flutter embebido

Para que `/place/:id/queue` y `/estadisticas` muestren datos en vivo, compila el widget web desde `virtual-queue-mobile` y cópialo al backend. Ver el README de `virtual-queue-mobile` para los comandos.
