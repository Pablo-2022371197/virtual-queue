# Virtual Queue (Web)

Frontend web del sistema **Virtual Queue**: gestión de filas de espera digitales con actualizaciones en tiempo real.

Este proyecto es la interfaz para usuarios finales y administradores que consultan turnos, buscan establecimientos y visualizan estadísticas de filas en vivo.

## Rol en el ecosistema

```
┌─────────────────────┐     REST / WebSocket     ┌──────────────────────┐
│   virtual-queue     │ ◄──────────────────────► │  virtual-queue-back  │
│   (React + Vite)    │                          │   (Spring Boot)      │
└─────────────────────┘                          └──────────┬───────────┘
                                                              │
                                                              ▼
                                                   ┌──────────────────────┐
                                                   │ virtual-queue-mobile   │
                                                   │ (Wear OS standalone)   │
                                                   └──────────────────────┘
```

| Componente | Descripción |
|------------|-------------|
| **virtual-queue** | Sitio público, panel autenticado y dashboard web |
| **virtual-queue-back** | API REST y WebSockets STOMP |
| **virtual-queue-mobile** | App Wear OS standalone para consultar el turno en el reloj |

## Stack tecnológico

| Tecnología | Uso |
|------------|-----|
| React 19 + TypeScript | Interfaz de usuario |
| Vite 8 | Bundler y servidor de desarrollo |
| React Router 7 | Navegación |
| TanStack Query | Caché y peticiones al backend |
| HeroUI + Tailwind CSS 4 | Componentes y estilos |
| STOMP + SockJS | Actualizaciones de fila en tiempo real |
| Fuse.js | Búsqueda difusa de establecimientos en el cliente |

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
| `/search` | Lista establecimientos (`GET /api/places`, catálogo en memoria) y filtra en el cliente con búsqueda difusa [Fuse.js](https://www.fusejs.io/) por nombre, dirección y categoría |
| `/place/:id/queue` | Estadísticas en vivo del establecimiento |
| `/estadisticas` | Panel de métricas en tiempo real |

### Tiempo real

- **`useQueueSocket`**: suscripción STOMP a eventos de turno vía SockJS en `/ws`.
- **`usePlaceStatsSocket`**: actualiza métricas del establecimiento desde `/topic/stats/{placeId}`.

### Cliente HTTP

`src/shared/api/client.ts` centraliza las peticiones:

- Prefijo base: `VITE_API_URL` (por defecto `http://localhost:8080`)
- Interceptor que adjunta `Authorization: Bearer {jwt}`
- Redirección automática a `/login` ante respuestas `401`

En desarrollo, Vite hace proxy de `/api` y `/ws` hacia el backend (ver `vite.config.ts`).

## Requisitos previos

- Node.js 20+
- pnpm, npm o yarn
- Backend en ejecución (`virtual-queue-back` en el puerto 8080)

## Configuración

Copia las variables de entorno en `.env`:

```env
VITE_API_URL=http://localhost:8080
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

# Tests
pnpm test
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
│       └── PlaceQueuePage.tsx
├── public/                 # Sitio público (landing, FAQ, contacto…)
├── hooks/                  # useMyTicket, usePlaces, useQueueSocket…
├── lib/                    # fuseSearchPlaces, siteConfig
├── shared/                 # API, realtime, componentes
└── types/                  # Place, Ticket
```

## Endpoints consumidos

| Método | Ruta | Uso |
|--------|------|-----|
| `GET` | `/api/places` | Listado de establecimientos |
| `GET` | `/api/tickets/mine` | Turno activo del usuario |
| WebSocket | `/ws` → `/topic/stats/{placeId}` | Estadísticas del establecimiento |
