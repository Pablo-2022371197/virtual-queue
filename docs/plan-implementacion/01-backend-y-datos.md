# Parte 1 — Backend, datos y contratos

## Recomendación de inicio

Esta es la **primera parte que se debe desarrollar**. Los clientes web, móvil, Wear OS y el widget Flutter ya intentan consumir endpoints y eventos que todavía no existen. Empezar por las interfaces gráficas produciría más datos simulados y retrabajo.

Orden global recomendado:

1. Backend, base de datos y contratos.
2. Cliente web.
3. Flutter móvil, Wear OS y widget web.

La parte móvil puede preparar pantallas en paralelo, pero la integración funcional debe esperar a que los contratos del backend estén estables.

## Objetivo

Construir una API Spring Boot segura y persistente que gestione usuarios, establecimientos, filas, turnos, dispositivos, estadísticas y notificaciones en tiempo real.

Al finalizar esta parte debe existir una fuente de verdad única que puedan consumir los tres clientes.

## Estado verificado del repositorio

Proyecto: `virtual-queue-back`.

Implementado:

- Spring Boot 4.1.0 y Java 21.
- Dependencias de Web, WebSocket, Security, Validation, JPA, H2, PostgreSQL, Firebase Admin y JJWT.
- `GET /api/notifications/preview` con una respuesta fija.
- `SecurityConfig` permite cualquier petición y desactiva CSRF.
- Una prueba que únicamente comprueba que el contexto de Spring inicia.
- El build `.\mvnw.cmd test` finaliza correctamente.

Pendiente o incompleto:

- No hay entidades, repositorios, servicios ni casos de uso.
- No hay autenticación JWT real.
- No existen los endpoints que ya consumen React y Flutter.
- No existe configuración STOMP.
- No hay registro de tokens FCM ni envío real de notificaciones.
- La aplicación desactiva datasource/JPA mediante `application.properties`.
- No hay migraciones, datos semilla, perfiles de entorno, Docker ni CI.
- No hay pruebas de reglas de negocio, seguridad, controladores o persistencia.
- La documentación actual describe una base PostgreSQL y WebSockets como si fueran parte del flujo, pero todavía están planificados. La base se alojará en Supabase.

## Decisiones que el agente debe fijar antes de programar

Usar estas decisiones como valores predeterminados para evitar ambigüedad:

- Supabase como base de datos principal administrada. Supabase utiliza PostgreSQL, por lo que se conserva el driver JDBC de PostgreSQL y Testcontainers PostgreSQL para pruebas de integración aisladas.
- Flyway para versionar el esquema; no usar `ddl-auto=update` en producción.
- JWT de acceso corto y refresh token rotatorio.
- Contraseñas con BCrypt.
- Identificadores UUID.
- Fechas en UTC con `Instant`, serializadas en ISO-8601.
- API bajo `/api`.
- Errores con `ProblemDetail` y códigos funcionales estables.
- WebSocket STOMP con autenticación en el frame `CONNECT`.
- Eventos privados de turno en destinos `/user/queue/ticket`.
- Estadísticas públicas o autorizadas por rol en `/topic/stats/{placeId}`.
- Notificaciones FCM disparadas por eventos de dominio, no desde controladores.
- Una fila de servicio activa por establecimiento en la primera versión. Nombrar la entidad Java `ServiceQueue`, no `Queue`.

## Modelo funcional mínimo

### Entidades

#### User

- `id`
- `fullName`
- `email` único
- `username` único
- `passwordHash`
- `role`: `CUSTOMER`, `STAFF`, `ADMIN`
- `enabled`
- `createdAt`, `updatedAt`

#### Place

- `id`
- `name`
- `address`
- `category`
- `description`
- `active`
- `createdAt`, `updatedAt`

#### ServiceQueue

- `id`
- `placeId`
- `prefix`, por ejemplo `A`
- `lastSequence`
- `averageServiceMinutes`
- `openCounters`
- `active`
- `version` para bloqueo optimista

#### Ticket

- `id`
- `queueId`
- `userId`
- `number`
- `sequence`
- `status`
- `issuedAt`
- `calledAt`
- `serviceStartedAt`
- `completedAt`
- `cancelledAt`

Estados canónicos:

- `WAITING`
- `NEARLY`
- `CALLED`
- `SERVING`
- `COMPLETED`
- `CANCELLED`
- `EXPIRED`

#### DeviceRegistration

- `id`
- `userId`
- `fcmToken` único
- `platform`: `ANDROID`, `WEB`
- `deviceName`
- `active`
- `lastSeenAt`

#### RefreshToken

- `id`
- `userId`
- hash del token
- `expiresAt`
- `revokedAt`
- identificador de familia para detectar reutilización

### Reglas de negocio

- Un usuario solo puede tener un turno activo.
- Un usuario no puede entrar dos veces a la misma fila.
- La asignación de secuencia debe ser transaccional y segura ante concurrencia.
- La posición se calcula con turnos activos anteriores de la misma fila.
- `NEARLY` se emite cuando quedan dos personas o menos.
- Solo `STAFF` o `ADMIN` pueden llamar, iniciar o completar atención.
- Solo el dueño del turno puede cancelarlo.
- Un token FCM pertenece al usuario autenticado y se actualiza si vuelve a registrarse.
- Cada cambio de turno publica un evento privado y actualiza las estadísticas del establecimiento.
- Un fallo de FCM no debe revertir el cambio válido de un turno.

## Contrato REST objetivo

### Autenticación

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`

Respuesta de login/refresh:

```json
{
  "accessToken": "jwt",
  "refreshToken": "opaque-token",
  "tokenType": "Bearer",
  "expiresIn": 900,
  "user": {
    "id": "uuid",
    "username": "pablo",
    "fullName": "Pablo",
    "role": "CUSTOMER"
  }
}
```

### Establecimientos y filas

- `GET /api/places?query=&category=&page=&size=`
- `GET /api/places/{placeId}`
- `GET /api/places/{placeId}/queue`
- `GET /api/places/{placeId}/stats`
- `POST /api/places` — `ADMIN`
- `PUT /api/places/{placeId}` — `ADMIN`
- `PATCH /api/places/{placeId}/status` — `ADMIN`

### Turnos de cliente

- `POST /api/places/{placeId}/tickets` — tomar turno.
- `GET /api/tickets/mine` — turno activo; devolver `204` si no existe.
- `GET /api/tickets/{ticketId}` — dueño, `STAFF` o `ADMIN`.
- `DELETE /api/tickets/{ticketId}` — cancelar turno propio.

DTO canónico de turno:

```json
{
  "id": "uuid",
  "placeId": "uuid",
  "placeName": "Banco Centro",
  "number": "A-047",
  "position": 2,
  "estimatedMinutes": 8,
  "status": "NEARLY",
  "issuedAt": "2026-08-03T20:00:00Z"
}
```

### Operación de personal

- `GET /api/staff/queues/{queueId}/tickets?status=WAITING`
- `POST /api/staff/queues/{queueId}/call-next`
- `POST /api/staff/tickets/{ticketId}/start`
- `POST /api/staff/tickets/{ticketId}/complete`
- `POST /api/staff/tickets/{ticketId}/expire`
- `PATCH /api/staff/queues/{queueId}` — ventanillas y tiempo promedio.

### Dispositivos

- `POST /api/devices/register`
- `DELETE /api/devices/{registrationId}`

Petición de registro:

```json
{
  "fcmToken": "token",
  "platform": "ANDROID",
  "deviceName": "Pixel API 36"
}
```

## Contrato en tiempo real

Configurar endpoint STOMP `/ws`.

Destinos:

- `/user/queue/ticket`: evento privado del turno del usuario autenticado.
- `/topic/stats/{placeId}`: estadísticas agregadas del lugar.
- `/topic/staff/queue/{queueId}`: lista operativa para personal autorizado.

Evento privado:

```json
{
  "eventId": "uuid",
  "type": "TICKET_UPDATED",
  "occurredAt": "2026-08-03T20:00:00Z",
  "ticket": {
    "id": "uuid",
    "placeId": "uuid",
    "number": "A-047",
    "position": 2,
    "estimatedMinutes": 8,
    "status": "NEARLY"
  }
}
```

No usar `/topic/queue/my-ticket` como canal compartido: un topic global puede filtrar información entre usuarios. React y Flutter tendrán que migrar al destino privado.

## Estructura objetivo

Crear paquetes orientados por dominio:

```text
src/main/java/mx/edu/uteq/virtual_queue_back/
├── auth/
├── user/
├── place/
├── queue/
├── ticket/
├── device/
├── notification/
├── realtime/
├── security/
└── common/
```

Cada dominio debe separar:

- controller
- service o usecase
- repository
- entity
- dto
- mapper

Archivos transversales previstos:

```text
src/main/resources/
├── application.properties
├── application-dev.properties
├── application-test.properties
├── application-prod.properties
└── db/migration/
    ├── V1__initial_schema.sql
    └── V2__seed_development_data.sql
```

### Placeholders de Supabase en `application.properties`

La aplicación debe conectarse directamente a Supabase; no se levantará PostgreSQL local. Agregar esta configuración usando variables de entorno:

```properties
spring.datasource.url=${SUPABASE_DB_URL}
spring.datasource.username=${SUPABASE_DB_USERNAME}
spring.datasource.password=${SUPABASE_DB_PASSWORD}
spring.datasource.driver-class-name=org.postgresql.Driver

spring.jpa.hibernate.ddl-auto=validate
spring.jpa.open-in-view=false

spring.flyway.enabled=true
spring.flyway.locations=classpath:db/migration

spring.datasource.hikari.maximum-pool-size=${SUPABASE_DB_POOL_MAX_SIZE:5}
```

Valores que se deben obtener desde **Supabase Dashboard → Project Settings → Database**:

- `<PROJECT_REF>`: referencia del proyecto.
- `SUPABASE_DB_URL`: URL JDBC de conexión directa o del Session Pooler.
- `SUPABASE_DB_USERNAME`: normalmente `postgres` en conexión directa o `postgres.<PROJECT_REF>` con pooler.
- `SUPABASE_DB_PASSWORD`: contraseña de la base de datos.

Ejemplo de variables, sin valores reales:

```text
SUPABASE_DB_URL=jdbc:postgresql://db.<PROJECT_REF>.supabase.co:5432/postgres?sslmode=require
SUPABASE_DB_USERNAME=postgres
SUPABASE_DB_PASSWORD=<SUPABASE_DB_PASSWORD>
SUPABASE_DB_POOL_MAX_SIZE=5
```

Usar siempre `sslmode=require`. Si el entorno no soporta IPv6 para la conexión directa, utilizar la cadena del **Session Pooler** proporcionada por Supabase. No versionar valores reales ni usar el Transaction Pooler para migraciones Flyway.

## Plan de ejecución para un agente

### Fase 0 — Línea base y contratos

1. Ejecutar `.\mvnw.cmd test`.
2. Añadir Spring Boot Actuator, Flyway, Testcontainers y dependencias de test necesarias.
3. Crear un OpenAPI en `src/main/resources/static/openapi.yaml` o generar documentación con springdoc.
4. Definir DTO, estados y formato uniforme de errores antes de tocar los clientes.
5. Añadir `.env.example` o documentación de variables sin incluir secretos.

Criterio de salida:

- El proyecto compila.
- Los contratos de autenticación, lugares, turnos y dispositivos quedan documentados y versionados.

### Fase 1 — Persistencia

1. Retirar la exclusión de datasource/JPA.
2. Crear perfiles `dev`, `test` y `prod`.
3. Crear migraciones Flyway.
4. Implementar entidades y repositorios.
5. Añadir restricciones únicas e índices para email, username, FCM token, turnos activos y consultas por fila/estado.
6. Crear el proyecto Supabase y configurar en el entorno los placeholders definidos en `application.properties`.

Criterio de salida:

- La aplicación se conecta a Supabase sin credenciales escritas en Git.
- Flyway inicializa el esquema en una base vacía de Supabase.
- Pruebas de repositorio corren contra PostgreSQL Testcontainers.

### Fase 2 — Autenticación y autorización

1. Implementar registro, login, refresh, logout y usuario actual.
2. Crear `JwtService`, filtro Bearer y `UserDetailsService`.
3. Configurar CORS mediante variables de entorno.
4. Proteger rutas por rol.
5. Limitar intentos de login o documentar un mecanismo de rate limiting.
6. No registrar contraseñas, JWT, refresh tokens ni tokens FCM.

Criterio de salida:

- Un usuario se registra, inicia sesión, renueva sesión y cierra sesión.
- Un token expirado recibe `401`.
- Un cliente sin rol recibe `403` en rutas de personal.

### Fase 3 — Establecimientos, filas y turnos

1. Implementar CRUD de establecimientos.
2. Implementar consulta y búsqueda paginada.
3. Implementar toma, consulta y cancelación de turno.
4. Implementar llamada, inicio, finalización y expiración por personal.
5. Proteger asignación y `call-next` frente a solicitudes concurrentes.
6. Calcular posición y espera estimada en un servicio de dominio.

Criterio de salida:

- Dos solicitudes concurrentes nunca reciben el mismo número.
- `GET /api/tickets/mine` coincide con el DTO canónico.
- Cada transición inválida devuelve `409` con un código funcional.

### Fase 4 — STOMP y estadísticas

1. Crear `WebSocketConfig`.
2. Autenticar el frame `CONNECT`.
3. Publicar eventos privados con `SimpMessagingTemplate.convertAndSendToUser`.
4. Publicar estadísticas por establecimiento.
5. Definir reconexión e idempotencia mediante `eventId`.
6. Agregar pruebas de conexión autorizada y no autorizada.

Criterio de salida:

- Solo el usuario dueño recibe su turno.
- El widget recibe `activeTickets`, `averageWaitMinutes`, `openCounters` y `turnCalled`.

### Fase 5 — Firebase Cloud Messaging

1. Inicializar Firebase Admin desde una variable/ruta segura.
2. Implementar registro y baja de dispositivos.
3. Escuchar eventos `NEARLY`, `CALLED`, `CANCELLED` y `EXPIRED`.
4. Enviar payload `notification` y `data`.
5. Desactivar tokens que Firebase marque como inválidos.
6. Añadir reintentos acotados y métricas; no bloquear la transacción principal.

Criterio de salida:

- Un emulador Android registrado recibe una notificación.
- El payload contiene el mismo DTO de turno que REST/STOMP.

### Fase 6 — Calidad, observabilidad y entrega

1. Añadir pruebas unitarias de reglas y transiciones.
2. Añadir pruebas MVC de validación, `401`, `403`, `404` y `409`.
3. Añadir integración completa con Testcontainers.
4. Exponer health/readiness con Actuator sin publicar datos sensibles.
5. Crear Dockerfile multi-stage.
6. Añadir CI para `mvnw test` y build de imagen.
7. Actualizar el README con ejecución real.

## Matriz mínima de pruebas

- Registro duplicado por email y username.
- Login correcto, incorrecto y usuario deshabilitado.
- Refresh válido, expirado, revocado y reutilizado.
- Creación concurrente de turnos.
- Usuario con turno activo intentando crear otro.
- Cancelación por dueño y por usuario ajeno.
- Transiciones válidas e inválidas de estado.
- `call-next` con y sin turnos.
- Cálculo de posición tras completar/cancelar.
- Autorización REST y STOMP.
- Registro repetido del mismo token FCM.
- Fallo de Firebase sin rollback del turno.
- Publicación de estadísticas tras cada transición.

## Variables de entorno previstas

```text
SPRING_PROFILES_ACTIVE
SUPABASE_DB_URL
SUPABASE_DB_USERNAME
SUPABASE_DB_PASSWORD
SUPABASE_DB_POOL_MAX_SIZE
JWT_SECRET
JWT_ACCESS_TTL
JWT_REFRESH_TTL
FIREBASE_CREDENTIALS_PATH
ALLOWED_ORIGINS
```

No almacenar `firebase-service-account.json`, contraseñas ni secretos JWT en Git.

## Definición de terminado

- Todos los endpoints acordados están implementados y documentados.
- Supabase y Flyway funcionan desde una base vacía.
- La autenticación y los roles protegen REST y STOMP.
- Las reglas de turnos son transaccionales.
- React y Flutter pueden usar el mismo DTO sin adaptadores especiales.
- STOMP emite eventos privados y estadísticas.
- FCM se valida al menos en un emulador Android.
- Pruebas unitarias e integración pasan en CI.
- No hay secretos versionados.

## Prompt sugerido para el agente ejecutor

> Implementa por fases `docs/plan-implementacion/01-backend-y-datos.md`. Empieza por la Fase 0 y no avances si sus pruebas o criterios de salida fallan. Conserva el package raíz actual, documenta cualquier cambio de contrato y no modifiques los clientes hasta estabilizar OpenAPI y los DTO canónicos. Al terminar cada fase ejecuta `.\mvnw.cmd test`, resume cambios, pruebas y deuda pendiente.
