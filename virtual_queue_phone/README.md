# Turnix — Cliente móvil (teléfono)

App Flutter **CUSTOMER** del ecosistema **Virtual Queue**: login, búsqueda de establecimientos, tomar turno, consultarlo en tiempo real (STOMP) y cancelarlo.

> Carpeta: `virtual_queue_phone`

## Ecosistema

```
virtual-queue-back  →  virtual_queue_phone (teléfono)
                    →  virtual-queue-mobile (Wear OS)
```

Núcleo compartido: [`packages/virtual_queue_core`](../packages/virtual_queue_core)

## Stack

| Tecnología | Uso |
|------------|-----|
| Flutter 3.5+ | UI Material 3 |
| Riverpod | Auth, turno, salud del API |
| go_router | `/login`, `/home`, `/search`, `/place/:id` |
| virtual_queue_core | Dio, JWT, `TicketRepository`, `PlaceRepository`, STOMP |

## Entregable 2 (octubre) — alcance actual

- Login real `POST /api/auth/login` solo **CUSTOMER** (staff/admin reciben mensaje y se cierra sesión).
- Sesión JWT + refresh en `flutter_secure_storage` (persiste al reiniciar la app).
- Búsqueda `GET /api/places` (nombre, dirección, categoría).
- Tomar turno `POST /api/places/{id}/tickets`, consultar `GET /api/tickets/mine`, cancelar `DELETE /api/tickets/{id}`.
- STOMP `/user/queue/ticket` + polling cada 8 s.
- `TicketNotificationWidget` (StatefulWidget) persistente: mapa del establecimiento, **Cómo llegar** y **Cancelar turno** en Mi turno.

**Noviembre (Entregable 3):** FCM, notificaciones push del sistema, build release.

## Ejecución

```bash
cd virtual_queue_phone
flutter pub get
flutter run --dart-define=API_URL=http://10.0.2.2:8080
```

Levanta `virtual-queue-back` en el puerto **8080**. Usuario de prueba típico: **customer** (contraseña según tu seed del backend).

## Estructura

```
lib/
├── main.dart
├── app.dart
├── router/app_router.dart
├── providers/
│   ├── backend_status_provider.dart
│   └── phone_ticket_provider.dart
├── features/
│   ├── auth/login_screen.dart
│   ├── ticket/home_screen.dart
│   └── places/
├── widgets/
│   ├── phone_shell.dart
│   ├── ticket_notification_widget.dart
│   └── api_error_panel.dart
```
