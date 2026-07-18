# Virtual Queue Back

Backend del sistema **Gestión de Filas de Espera con Notificaciones a Wearable**. Centraliza la lógica de turnos, establecimientos, autenticación, WebSockets en tiempo real y envío de notificaciones push (FCM) hacia la app móvil, que a su vez reenvía el estado al smartwatch emparejado.

## Rol en el ecosistema

```
┌─────────────────────┐         ┌─────────────────────┐
│   virtual-queue     │         │ virtual-queue-mobile│
│   (React web)       │         │ (Android + Wear OS) │
└─────────┬───────────┘         └─────────┬───────────┘
          │ REST / WS / /flutter          │ REST / WS / FCM
          └──────────────┬──────────────────┘
                         ▼
              ┌──────────────────────┐
              │  virtual-queue-back  │
              │    Spring Boot       │
              ├──────────────────────┤
              │  PostgreSQL (futuro) │
              │  Firebase Admin SDK  │
              │  STOMP WebSocket     │
              │  static/flutter/     │
              └──────────────────────┘
```

| Cliente | Qué consume del backend |
|---------|-------------------------|
| **virtual-queue** | `/api/places`, `/api/tickets/mine`, `/ws`, assets en `/flutter/` |
| **virtual-queue-mobile** | `/api/auth/login`, `/api/devices/register`, `/ws`, FCM outbound |
| **Widget Flutter Web** | Servido desde `static/flutter/`, STOMP en `/topic/stats/{placeId}` |

## Stack tecnológico

| Tecnología | Versión | Uso |
|------------|---------|-----|
| Java | 21 | Lenguaje base |
| Spring Boot | 4.1.0 | Framework REST y WebSocket |
| Spring Security | — | Autenticación (JWT planificado) |
| Spring Data JPA | — | Persistencia (PostgreSQL planificado) |
| H2 | runtime | Base embebida para desarrollo |
| PostgreSQL | runtime | Base de datos de producción (pendiente) |
| Firebase Admin SDK | 9.9.0 | Envío de notificaciones push |
| JJWT | 0.12.6 | Tokens JWT |
| Lombok | — | Reducción de boilerplate |
| Maven | — | Build (incluye Maven Wrapper) |

## Estado actual

El proyecto está en fase inicial:

- **Implementado:** endpoint de preview de notificaciones, configuración de seguridad permisiva, exclusión de autoconfig de JPA/datasource para arrancar sin PostgreSQL.
- **Planificado:** autenticación JWT, CRUD de turnos y establecimientos, WebSockets STOMP, envío real FCM, persistencia en PostgreSQL.

La carpeta `src/main/resources/static/flutter/` aloja el build web del widget de estadísticas compilado desde `virtual-queue-mobile`.

## Requisitos previos

- JDK 21
- Maven (opcional; el proyecto incluye Maven Wrapper)

## Configuración

Archivo `src/main/resources/application.properties`:

```properties
spring.application.name=virtual-queue-back
server.port=8080
```

Por ahora JPA y datasource están excluidos para permitir el arranque sin base de datos. Más adelante se configurarán:

```properties
# spring.datasource.url=jdbc:postgresql://localhost:5432/virtual_queue
# spring.datasource.username=...
# spring.datasource.password=...
# firebase.service-account=classpath:firebase-service-account.json
```

## Cómo ejecutar

```bash
# Windows
.\mvnw.cmd spring-boot:run

# Linux / macOS
./mvnw spring-boot:run
```

La aplicación arranca en `http://localhost:8080`.

## API disponible

### Preview de notificación

```
GET /api/notifications/preview
```

Retorna un ejemplo del payload que se enviaría por FCM cuando el turno del usuario está por llegar.

**Respuesta de ejemplo (200 OK):**

```json
{
  "fcmToken": "dGhpcyBpcyBhIGZha2UgdG9rZW4...",
  "title": "¡Ya casi es tu turno!",
  "body": "Faltan 2 personas antes que tú en BBVA Bancomer",
  "ticketId": "tk-20260520-a047",
  "placeId": "place-bbva-qro-centro",
  "placeName": "BBVA Bancomer Querétaro Centro",
  "placeAddress": "Av. Constituyentes 1, Centro, Querétaro, Qro.",
  "placeCategory": "Banco",
  "ticketNumber": "A-047",
  "currentPosition": 2,
  "estimatedWaitMinutes": 8,
  "status": "NEARLY",
  "issuedAt": "2026-05-20T19:30:00Z",
  "notifiedAt": "2026-06-12T04:57:30.241779500Z",
  "androidPriority": "HIGH",
  "vibrate": true,
  "accentColor": "#1A73E9"
}
```

Valores posibles de `status`: `WAITING`, `NEARLY`, `CALLED`, `EXPIRED`.

## API planificada (consumida por los clientes)

| Método | Ruta | Cliente | Descripción |
|--------|------|---------|-------------|
| `POST` | `/api/auth/login` | Mobile | Autenticación y emisión de JWT |
| `GET` | `/api/places` | Web | Listado de establecimientos |
| `GET` | `/api/tickets/mine` | Web, Mobile | Turno activo del usuario |
| `POST` | `/api/devices/register` | Web, Mobile | Registro de token FCM |
| WebSocket | `/ws` | Todos | Canal STOMP sobre SockJS |

### Topics STOMP previstos

| Topic | Publicador | Suscriptor | Contenido |
|-------|------------|------------|-----------|
| `/topic/queue/{ticketId}` | Backend | Web (por turno) | Actualización de posición y estado |
| `/topic/queue/my-ticket` | Backend | Mobile | Turno del usuario autenticado |
| `/topic/stats/{placeId}` | Backend | Widget Flutter Web | Métricas de fila en vivo |

## Assets estáticos (widget Flutter)

El dashboard React embebe estadísticas desde:

```
GET /flutter/?placeId={placeId}
```

Para generar esos archivos:

```powershell
cd ../virtual-queue-mobile
flutter build web --release --web-renderer canvaskit -t lib/main_stats.dart
Copy-Item -Path build/web/* -Destination ../virtual-queue-back/src/main/resources/static/flutter/ -Recurse -Force
```

## Estructura del proyecto

```
src/main/java/mx/edu/uteq/virtual_queue_back/
├── VirtualQueueBackApplication.java   # Punto de entrada
├── config/
│   └── SecurityConfig.java            # Seguridad (permissiva en desarrollo)
├── controller/
│   └── NotificationController.java    # Endpoints REST de notificaciones
└── dto/
    └── NotificationPreviewDTO.java    # Payload de notificación

src/main/resources/
├── application.properties
└── static/flutter/                    # Build web del widget de estadísticas
```

## Seguridad

Por ahora todas las rutas son públicas (CSRF deshabilitado, `permitAll`). La autenticación JWT y la protección de endpoints se configurarán en una fase posterior.

## Próximos pasos

- [ ] Configurar PostgreSQL (`spring.datasource.*`)
- [ ] Configurar Firebase Admin SDK (service account JSON)
- [ ] Implementar autenticación JWT (`/api/auth/login`)
- [ ] Endpoints de turnos y establecimientos
- [ ] Envío real de notificaciones FCM
- [ ] WebSockets STOMP para actualizaciones en tiempo real de la fila
- [ ] Registro de dispositivos (`/api/devices/register`)

## Tests

```bash
# Windows
.\mvnw.cmd test

# Linux / macOS
./mvnw test
```

## Repositorio

https://github.com/Pablo-2022371197/virtual-queue-back
