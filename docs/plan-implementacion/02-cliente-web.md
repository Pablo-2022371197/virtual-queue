# Parte 2 — Cliente web React

## Cuándo comenzar

Comenzar esta parte después de que la Parte 1 tenga estables:

- OpenAPI y DTO de autenticación.
- Listado y detalle de establecimientos.
- Creación, consulta y cancelación de turnos.
- Autenticación STOMP.
- Estadísticas por establecimiento.

Se puede adelantar la estructura visual y las pruebas con un servidor simulado, pero no deben inventarse contratos diferentes a los definidos en `01-backend-y-datos.md`.

## Objetivo

Convertir `virtual-queue` en un cliente web completo para:

- Sitio público.
- Registro e inicio de sesión.
- Operación del usuario final.
- Operación de personal.
- Administración de establecimientos.
- Estadísticas en tiempo real.

## Estado verificado del repositorio

Implementado:

- React 19, TypeScript, Vite 8, HeroUI, Tailwind y TanStack Query.
- Sitio público con landing, nosotros, FAQ, contacto, privacidad, términos y cookies.
- Formularios de login y registro.
- Layout autenticado.
- Pantallas para turno activo, búsqueda, detalle de fila y estadísticas.
- Cliente HTTP basado en `fetch`.
- Build de producción correcto con `npm run build`.

Incompleto o inconsistente:

- Login fijo `admin/admin`.
- Registro solo crea una sesión local; no persiste usuarios.
- El token `static.*` no es un JWT del backend.
- No hay renovación de sesión ni recuperación de cuenta.
- No existe acción para tomar o cancelar un turno.
- La pantalla de estadísticas contiene números y barras fijos.
- El formulario de contacto no envía información.
- El README afirma que existen STOMP, SockJS y Firebase, pero esas dependencias no están en `package.json`.
- No existe el hook `useQueueSocket` descrito en el README.
- `DashboardStats` acepta `postMessage` desde cualquier origen.
- No hay pruebas unitarias, de componentes ni end-to-end.
- El bundle principal es de aproximadamente 592 kB minificado y Vite advierte que supera 500 kB.
- Los tipos de `Ticket` y `Place` son demasiado pequeños para el contrato objetivo.
- La interfaz presenta el panel como si todo estuviera en vivo aunque el backend no lo soporte aún.

## Alcance por rol

### Visitante

- Consultar páginas públicas.
- Registrarse.
- Iniciar sesión.
- Consultar establecimientos públicos, si el producto decide permitirlo.

### Cliente

- Ver su perfil.
- Buscar y filtrar establecimientos.
- Ver estado y estimación de una fila.
- Tomar un turno.
- Ver su turno activo.
- Recibir cambios en tiempo real.
- Cancelar su turno.
- Activar notificaciones web opcionales.

### Personal

- Ver la fila asignada.
- Llamar al siguiente turno.
- Iniciar, completar o marcar ausente un turno.
- Modificar ventanillas abiertas y tiempo promedio.

### Administrador

- Crear, editar, activar y desactivar establecimientos.
- Asignar personal.
- Consultar estadísticas reales.

## Arquitectura objetivo

Mantener React Router y TanStack Query. Organizar el código por dominio:

```text
src/
├── app/
│   ├── router/
│   └── providers/
├── features/
│   ├── auth/
│   ├── places/
│   ├── tickets/
│   ├── staff/
│   ├── admin/
│   ├── stats/
│   └── notifications/
├── public/
├── shared/
│   ├── api/
│   ├── realtime/
│   ├── components/
│   ├── errors/
│   └── types/
└── test/
```

No es obligatorio mover todo al inicio. Hacer migraciones pequeñas y mantener la aplicación compilable.

## Contratos que debe consumir

Usar exclusivamente los DTO definidos por el backend:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/places`
- `GET /api/places/{id}`
- `GET /api/places/{id}/queue`
- `POST /api/places/{id}/tickets`
- `GET /api/tickets/mine`
- `DELETE /api/tickets/{id}`
- Endpoints `/api/staff/**` y `/api/places/**` protegidos por rol.
- `/ws` con destino privado `/user/queue/ticket`.
- `/topic/stats/{placeId}` para estadísticas.

Generar tipos desde OpenAPI cuando sea posible. Si se escriben manualmente, agregar pruebas de contrato para detectar desalineaciones.

## Manejo de sesión

Implementación recomendada para web:

- Access token en memoria.
- Refresh token en cookie `HttpOnly`, `Secure` y `SameSite`.
- Al recargar la página, llamar una vez a `/api/auth/refresh`.
- Reintentar una sola vez una petición que reciba `401`.
- Si la renovación falla, limpiar estado y redirigir a `/login`.
- No guardar refresh tokens en `localStorage`.
- Las rutas se protegen por sesión y por rol.

Si el backend inicialmente devuelve ambos tokens en JSON para soportar Flutter, agregar también un modo cookie específico para web antes de producción.

## Estado del servidor y estado local

- TanStack Query para datos remotos.
- Context o un store pequeño solo para sesión y preferencias.
- No duplicar el turno activo en varios estados.
- Al recibir un evento STOMP, actualizar la caché `['tickets', 'mine']`.
- Invalidar `places`, `queue` y `stats` después de mutaciones.
- Mostrar estados de carga, vacío, error y reconexión.

## Plan de ejecución para un agente

### Fase 0 — Estabilizar y documentar

1. Ejecutar `npm run build` y `npm run lint`.
2. Añadir `.env.example` con `VITE_API_URL`, `VITE_WS_URL` y variables Firebase solo si se usarán.
3. Crear una capa de tipos alineada con OpenAPI.
4. Configurar un mock de red para desarrollar sin depender siempre del backend.
5. Crear pruebas de humo para rutas públicas y autenticadas.

Criterio de salida:

- Build y lint pasan.
- La aplicación puede ejecutar contra mock o backend mediante configuración, sin editar código.

### Fase 1 — Autenticación real

1. Eliminar `STATIC_USERNAME`, `STATIC_PASSWORD` y tokens `static.*`.
2. Implementar registro, login, refresh, logout y `/auth/me`.
3. Crear `AuthProvider` con estados `loading`, `authenticated` y `anonymous`.
4. Crear `ProtectedRoute` y `RoleRoute`.
5. Manejar mensajes de validación del backend.
6. Añadir recuperación de contraseña solo si el backend la implementa.

Criterio de salida:

- Registro y login crean una sesión real.
- Una recarga conserva la sesión mediante refresh seguro.
- Un usuario no puede abrir una ruta de administrador.

### Fase 2 — Experiencia del cliente

1. Completar tipos y consultas de establecimientos.
2. Agregar paginación, búsqueda y filtros desde API.
3. Completar la pantalla de detalle del establecimiento.
4. Implementar botón “Tomar turno” con confirmación.
5. Implementar turno activo con estado, posición, estimación y lugar.
6. Implementar cancelación con confirmación e idempotencia visual.
7. Evitar doble envío deshabilitando botones durante mutaciones.

Criterio de salida:

- Un usuario puede completar el flujo registro → búsqueda → tomar turno → consultar → cancelar.
- Los errores `409` muestran una explicación funcional.

### Fase 3 — Tiempo real

1. Instalar una librería STOMP compatible con el backend y SockJS solo si realmente se necesita.
2. Crear un único cliente en `src/shared/realtime/`.
3. Enviar JWT en `CONNECT`.
4. Suscribirse a `/user/queue/ticket`.
5. Implementar reconexión con backoff, indicador de conexión y cierre al terminar sesión.
6. Actualizar TanStack Query al recibir eventos.
7. Ignorar eventos duplicados por `eventId`.

Criterio de salida:

- La posición cambia sin recargar.
- Otro usuario no puede observar eventos ajenos.
- Una desconexión temporal se recupera sin crear suscripciones duplicadas.

### Fase 4 — Widget Flutter de estadísticas

1. Mantener el iframe solo si es un requisito académico; en otro caso React puede renderizar los datos directamente.
2. Comprobar que `/flutter/` existe antes de mostrar el iframe.
3. Codificar `placeId` con `encodeURIComponent`.
4. Validar `event.origin` y `event.source` en `postMessage`.
5. Eliminar el destino `'*'` desde Flutter y usar un origen permitido.
6. Mostrar fallback accesible cuando el widget no esté disponible.
7. Reemplazar valores fijos de `StatsPage` por API.

Criterio de salida:

- Las métricas coinciden con el backend.
- Mensajes enviados por otro origen no producen efectos.

### Fase 5 — Panel de personal y administración

1. Crear rutas `/staff/**` y `/admin/**`.
2. Implementar cola operativa y acciones de transición.
3. Implementar CRUD de establecimientos.
4. Mostrar conflictos de concurrencia y refrescar el estado.
5. Añadir auditoría visible: quién llamó o completó un turno y cuándo, si el backend expone esos datos.

Criterio de salida:

- Personal puede operar una fila completa.
- Administrador puede administrar establecimientos.
- Los controles no aparecen para roles no autorizados y el backend también los rechaza.

### Fase 6 — Notificaciones web y contacto

1. Decidir si FCM web forma parte del producto. No instalarlo solo porque aparece en el README.
2. Si se incluye, configurar service worker, permiso explícito y registro del token.
3. Permitir revocar el dispositivo desde preferencias.
4. Conectar el formulario de contacto a un endpoint o servicio definido.
5. Añadir protección antispam y consentimiento de privacidad.

Criterio de salida:

- El usuario puede activar y desactivar notificaciones.
- No se solicita permiso al cargar la landing; debe partir de una acción del usuario.

### Fase 7 — Calidad, accesibilidad y rendimiento

1. Añadir Vitest y React Testing Library.
2. Añadir Playwright para flujos críticos.
3. Probar navegación por teclado, foco, etiquetas y contraste.
4. Aplicar lazy loading por ruta para reducir el chunk principal.
5. Separar el panel administrativo y dependencias pesadas.
6. Añadir Error Boundary y página 404 real.
7. Crear CI para lint, test y build.

## Pruebas mínimas

### Unitarias

- Cliente HTTP y renovación de token.
- Guards por sesión y rol.
- Transformación de errores `ProblemDetail`.
- Reductor o store de autenticación.
- Deduplicación de eventos STOMP.

### Componentes

- Login y registro con validaciones.
- Lista vacía, cargando y error de establecimientos.
- Tomar y cancelar turno.
- Tarjeta para cada estado de turno.
- Botones de personal según rol.
- Rechazo de `postMessage` con origen incorrecto.

### End-to-end

- Registro → login → tomar turno → cancelar.
- Personal llama y completa un turno.
- Cliente observa actualización en tiempo real.
- Sesión expirada se renueva.
- Usuario cliente no accede a `/admin`.

## Riesgos que el agente debe evitar

- No mantener credenciales fijas como fallback silencioso.
- No considerar el ocultamiento de botones como autorización.
- No registrar JWT en consola.
- No aceptar cualquier origen en `postMessage`.
- No mostrar estadísticas inventadas como datos reales.
- No abrir una conexión STOMP por componente renderizado.
- No introducir un segundo modelo de `Ticket` incompatible con Flutter.

## Definición de terminado

- No quedan credenciales ni estadísticas fijas.
- Todos los flujos del cliente usan el backend real.
- Sesión y roles funcionan después de recargar.
- El usuario puede tomar y cancelar un turno.
- Personal y administrador tienen herramientas funcionales.
- Los cambios de turno llegan en tiempo real.
- El iframe valida su origen o se reemplaza por una implementación React documentada.
- Build, lint, unitarias y end-to-end pasan en CI.
- La documentación coincide con las dependencias realmente instaladas.

## Prompt sugerido para el agente ejecutor

> Implementa por fases `docs/plan-implementacion/02-cliente-web.md` usando como contrato `01-backend-y-datos.md` y el OpenAPI generado por el backend. No inventes respuestas ni mantengas datos simulados en producción. Conserva la interfaz pública existente cuando sea posible. Después de cada fase ejecuta lint, pruebas y `npm run build`, e informa cualquier incompatibilidad de contrato antes de adaptar el cliente.
