# Virtual Queue Back

Backend del sistema **Gestión de Filas de Espera con Notificaciones a Wearable**. Centraliza usuarios, establecimientos, filas, turnos, dispositivos FCM, estadísticas en tiempo real y notificaciones push.

## Stack

| Tecnología | Uso |
|------------|-----|
| Java 21 + Spring Boot 4.1 | API REST, seguridad, WebSocket |
| Supabase (PostgreSQL) | Base de datos en producción |
| Flyway | Migraciones de esquema |
| JWT + refresh tokens rotatorios | Autenticación |
| STOMP sobre `/ws` | Eventos de turno y estadísticas |
| Firebase Admin SDK | Notificaciones push (opcional) |

## Requisitos

- JDK 21
- Proyecto Supabase con PostgreSQL
- Variables de entorno (ver `.env.example`)

## Configuración

Copia `.env.example` y define las variables en tu entorno:

```text
SPRING_PROFILES_ACTIVE=dev
SUPABASE_DB_URL=jdbc:postgresql://db.<PROJECT_REF>.supabase.co:5432/postgres?sslmode=require
SUPABASE_DB_USERNAME=postgres
SUPABASE_DB_PASSWORD=<password>
JWT_SECRET=<al menos 32 caracteres>
STAFF_REGISTRATION_KEY_PEPPER=<al menos 32 caracteres>
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:8080
FIREBASE_CREDENTIALS_PATH=   # opcional
```

## Migraciones (Supabase)

Los scripts Flyway viven en `src/main/resources/db/migration/`.

| Situación | Qué ejecutar en Supabase |
|-----------|--------------------------|
| Base vacía | `V1` → `V2` → `V3` → `V4` → **`V5__place_staff_registration_key.sql`** |
| Ya aplicaste V1–V4 | Solo **`V5__place_staff_registration_key.sql`** |

`V5` añade `places.staff_registration_key_digest` (HMAC-SHA256 hex, nullable, único). **No guarda ni expone la clave en texto plano.** Las sucursales quedan sin clave hasta que un administrador genere una desde el panel web (`Generar/rotar clave`). No hay claves fijas en SQL ni en logs.

Tras generar una clave, el personal puede registrarse en la web eligiendo tipo **Personal** e ingresando esos 8 caracteres.

## Ejecución

```powershell
.\mvnw.cmd spring-boot:run
```

- API: `http://localhost:8080`
- Swagger UI: `http://localhost:8080/swagger-ui.html`
- OpenAPI: `http://localhost:8080/api-docs`
- Health: `http://localhost:8080/actuator/health`

## Endpoints principales

| Área | Rutas |
|------|-------|
| Auth | `POST /api/auth/register` (CUSTOMER/STAFF), `login`, `refresh`, `logout`, `GET/PATCH /api/auth/me`, `PUT /api/auth/password` |
| Lugares | `GET /api/places`, `GET /api/places/{id}/queue`, `GET /api/places/{id}/stats`, `POST /api/places/{id}/staff-registration-key/rotate` (ADMIN) |
| Turnos | `POST /api/places/{id}/tickets`, `GET /api/tickets/mine`, `DELETE /api/tickets/{id}` |
| Personal | `GET /api/staff/place`, `POST /api/staff/tickets/{id}/accept`, `call-next`, `start`, `complete`, `expire` |
| Dispositivos | `POST /api/devices/register`, `DELETE /api/devices/{id}` |

## WebSocket STOMP

Endpoint: `/ws` (SockJS). Autenticación JWT en el frame `CONNECT` (`Authorization: Bearer <token>`).

| Destino | Uso |
|---------|-----|
| `/user/queue/ticket` | Evento privado del turno del usuario |
| `/topic/stats/{placeId}` | Estadísticas del establecimiento |
| `/topic/staff/queue/{queueId}` | Lista operativa para personal |

## Datos semilla (desarrollo)

Tras Flyway `V2`, existen usuarios con contraseña `password`:

| Usuario | Rol |
|---------|-----|
| `admin` | ADMIN |
| `staff` | STAFF |
| `customer` | CUSTOMER |

## Tests

```powershell
.\mvnw.cmd test
```

Los tests usan H2 en memoria (`profile=test`). Para integración con PostgreSQL real, usar Testcontainers (requiere Docker).

## Docker

```bash
docker build -t virtual-queue-back .
docker run -p 8080:8080 --env-file .env virtual-queue-back
```

## Estructura

```text
src/main/java/mx/edu/uteq/virtual_queue_back/
├── auth/          # Registro, login, refresh tokens
├── user/          # Entidad y repositorio de usuarios
├── place/         # Establecimientos y estadísticas
├── queue/         # ServiceQueue
├── ticket/        # Turnos y operación de personal
├── device/        # Registro FCM
├── notification/  # Firebase
├── realtime/      # STOMP
├── security/      # JWT, filtros, CORS
└── common/        # Errores, enums, auditoría
```

## Documentación de contratos

- OpenAPI estático: `src/main/resources/static/openapi.yaml`
- Plan de implementación: `docs/plan-implementacion/01-backend-y-datos.md`
