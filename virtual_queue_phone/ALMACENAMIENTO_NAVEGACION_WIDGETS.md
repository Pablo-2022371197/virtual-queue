# Turnix (teléfono) — Almacenamiento, navegación y widgets

Proyecto: `virtual_queue_phone`  
Stack: Flutter (Material 3), Riverpod, go_router, núcleo compartido `packages/virtual_queue_core`.  
Rol: solo **CUSTOMER**.

---

## 1. Almacenamiento

El teléfono **no usa SQLite, Room ni SharedPreferences**. La persistencia local es **almacenamiento seguro de la sesión JWT**. El resto de datos (turno, establecimientos) vive en el backend y se pide por HTTP.


| Tipo                                            | Tecnología                                                      | Dónde                                                                                                                             | Qué guarda                                                                                                                         |
| ----------------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Almacenamiento seguro (Keystore / Keychain)** | `flutter_secure_storage` vía `TokenStorage`                     | `[packages/virtual_queue_core/lib/storage/token_storage.dart](../packages/virtual_queue_core/lib/storage/token_storage.dart)`     | Claves `access_token`, `refresh_token` y `user_summary` (JSON del usuario).                                                        |
| **Sesión en memoria**                           | `bool _unlocked` en `TokenStorage`                              | Mismo archivo                                                                                                                     | Flag de sesión desbloqueada (no se persiste en disco).                                                                             |
| **Estado de app en RAM**                        | Riverpod (`StateNotifier` / `StateProvider` / `FutureProvider`) | `[lib/providers/](lib/providers/)`, `[lib/app.dart](lib/app.dart)`                                                                | Auth (`coreAuthStateProvider`), turno (`phoneTicketProvider`), visibilidad del widget de notificación, ping de `/actuator/health`. |
| **Datos remotos (no locales)**                  | HTTP **Dio** + JWT                                              | Núcleo: `dio_client.dart`, `auth_service.dart`, `ticket_repository.dart`; teléfono: `placeRepositoryProvider` en búsqueda/detalle | Login, refresh, lugares, `GET /api/tickets/mine`, tomar y cancelar turno.                                                          |




### Operaciones de persistencia de sesión


| Operación                 | Método                                                          | Dónde se dispara                                                                                             |
| ------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Guardar tokens + usuario  | `TokenStorage.saveSession`                                      | Tras `POST /api/auth/login` en `AuthService.login`                                                           |
| Leer tokens               | `readAccessToken` / `readRefreshToken`                          | Interceptor Dio y bootstrap                                                                                  |
| Restaurar sesión al abrir | `CoreAuthStateNotifier.bootstrap` → `AuthService.bootstrapUser` | `[lib/app.dart](lib/app.dart)` (`initState`)                                                                 |
| Borrar sesión             | `TokenStorage.clearSession`                                     | Logout en `[lib/widgets/phone_shell.dart](lib/widgets/phone_shell.dart)` y si el rol no es CUSTOMER en login |




### Patrón de acceso

- El teléfono **no** instancia `FlutterSecureStorage` directo: lo usa el paquete `virtual_queue_core`.
- Tras cerrar la app, **sí** quedan el refresh token y el resumen de usuario; al reabrir, `bootstrap()` intenta `POST /api/auth/refresh`.
- El turno **no** se guarda en una BD local: cada vez se consulta el API / STOMP.

**No se usa:** `sqflite`, Room, `SharedPreferences`, archivos de texto, ni caché del catálogo mock (ese archivo ya no está en el cliente).

---



## 2. Navegación


| Enfoque                     | Detalle                                                                                       | Archivo                                                                                          |
| --------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| **Rutas declarativas**      | `go_router` + `MaterialApp.router`                                                            | `[lib/router/app_router.dart](lib/router/app_router.dart)`, `[lib/app.dart](lib/app.dart)`       |
| **Guard de autenticación**  | `redirect` según `coreAuthStateProvider` (anónimo → `/login`; autenticado en login → `/home`) | `[lib/router/app_router.dart](lib/router/app_router.dart)`                                       |
| **Refresh de rutas**        | `RouterRefreshNotifier` escucha el estado de auth                                             | Mismo archivo                                                                                    |
| **Pestañas inferiores**     | `StatefulShellRoute.indexedStack` + `NavigationBar`                                           | Router + `[lib/widgets/phone_shell.dart](lib/widgets/phone_shell.dart)`                          |
| **Navegación programática** | `context.go` / `context.push`                                                                 | Login, shell, home, search, detalle                                                              |
| **Diálogo modal**           | `showDialog` + `AlertDialog`; cierra con `Navigator.pop`                                      | `[lib/widgets/confirm_cancel_ticket_dialog.dart](lib/widgets/confirm_cancel_ticket_dialog.dart)` |




### Rutas


| Ruta         | Pantalla            | Notas                                      |
| ------------ | ------------------- | ------------------------------------------ |
| `/login`     | `LoginScreen`       | Fuera del shell (sin bottom nav).          |
| `/home`      | `HomeScreen`        | Rama 0: Mi turno.                          |
| `/search`    | `SearchScreen`      | Rama 1: Establecimientos.                  |
| `/place/:id` | `PlaceDetailScreen` | Encima del shell (`push`); parámetro `id`. |


Flujo visual:

```
main() → ProviderScope → TurnixPhoneApp
           → (si auth loading) MaterialApp + CircularProgressIndicator
           → MaterialApp.router
                → /login          LoginScreen
                → PhoneShell      AppBar + NavigationBar
                     → /home      HomeScreen
                     → /search    SearchScreen
                → /place/:id      PlaceDetailScreen
                → (modal)         AlertDialog cancelar turno
```

Llamadas concretas:

- `context.go('/home')` — login OK y tras tomar turno.
- `context.go('/search')` — CTA “sin turno” en home.
- `context.go('/login')` — logout.
- `context.push('/place/${place.id}')` — “Ver fila” en búsqueda.

---



## 3. Widgets



### 3.1 Por rol en la arquitectura Flutter


| Widget                     | Tipo                                      | Archivo                                                                                        | Función                                                |
| -------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `TurnixPhoneApp`           | **ConsumerStatefulWidget**                | `[lib/app.dart](lib/app.dart)`                                                                 | Raíz: bootstrap de sesión, tema, `MaterialApp.router`. |
| `LoginScreen`              | **ConsumerStatefulWidget**                | `[lib/features/auth/login_screen.dart](lib/features/auth/login_screen.dart)`                   | Formulario, login real, rechazo de STAFF/ADMIN.        |
| `PhoneShell`               | **ConsumerStatefulWidget**                | `[lib/widgets/phone_shell.dart](lib/widgets/phone_shell.dart)`                                 | AppBar, chip API, logout, `NavigationBar`.             |
| `HomeScreen`               | **ConsumerWidget** (Stateless + Riverpod) | `[lib/features/ticket/home_screen.dart](lib/features/ticket/home_screen.dart)`                 | Turno, notificación, cancelar.                         |
| `_StatRow`                 | **StatelessWidget** (privado)             | `home_screen.dart`                                                                             | Fila posición / tiempo estimado.                       |
| `SearchScreen`             | **ConsumerStatefulWidget**                | `[lib/features/places/search_screen.dart](lib/features/places/search_screen.dart)`             | Buscador y lista de lugares.                           |
| `PlaceDetailScreen`        | **ConsumerStatefulWidget**                | `[lib/features/places/place_detail_screen.dart](lib/features/places/place_detail_screen.dart)` | Detalle y tomar turno.                                 |
| `TicketNotificationWidget` | **ConsumerStatefulWidget**                | `[lib/widgets/ticket_notification_widget.dart](lib/widgets/ticket_notification_widget.dart)`   | Ubicación del establecimiento (mapa OSM), **Cómo llegar** y **Cancelar turno**. |
| `ApiErrorPanel`            | **StatelessWidget**                       | `[lib/widgets/api_error_panel.dart](lib/widgets/api_error_panel.dart)`                         | Error de red + Reintentar.                             |


`ConsumerStatefulWidget` / `ConsumerWidget` son widgets de **flutter_riverpod** (leen providers sin `ProviderScope` extra).

### 3.2 Widgets de Material usados en la UI


| Widget                                                       | Ubicación                                                    |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| `MaterialApp` / `MaterialApp.router`                         | `app.dart`                                                   |
| `ThemeData` / `ColorScheme.fromSeed`                         | `[lib/theme/turnix_theme.dart](lib/theme/turnix_theme.dart)` |
| `Scaffold` + `AppBar`                                        | Shell, detalle, splash de carga                              |
| `NavigationBar` + `NavigationDestination`                    | Shell — Mi turno / Establecimientos                          |
| `Chip`                                                       | Shell: **API OK** / **Sin API**                              |
| `SafeArea`, `SingleChildScrollView`, `ListView`              | Login, home, búsqueda                                        |
| `Card`, `Form`, `TextFormField`, `GlobalKey<FormState>`      | Login (y cards en el resto)                                  |
| `FilledButton`, `OutlinedButton`, `TextButton`, `IconButton` | Acciones                                                     |
| `AlertDialog`                                                | Confirmar cancelación                                        |
| `SnackBar` + `ScaffoldMessenger`                             | Turno tomado/cancelado, errores                              |
| `CircularProgressIndicator`                                  | Carga (auth, login, turno, lugares)                          |
| `Chip` de categoría, `Icon`                                  | Búsqueda y detalle                                           |




### 3.3 StatefulWidget de notificación (punto del cronograma)

`[TicketNotificationWidget](lib/widgets/ticket_notification_widget.dart)` es **persistente**: mientras haya turno activo permanece en **Mi turno** (no se oculta con una X).

Estado local con `setState`:

- Carga del `Place` (`GET /api/places/{id}`) y coordenadas (`lib/services/place_location.dart`: seeds de desarrollo o Nominatim).
- Mapa embebido (`flutter_map` + OpenStreetMap) con pin del establecimiento.
- **Cómo llegar** abre Google Maps vía `url_launcher`.
- **Cancelar turno** abre el `AlertDialog` y llama `DELETE /api/tickets/{id}`.

En `[PlaceDetailScreen](lib/features/places/place_detail_screen.dart)`, **Tomar turno** queda deshabilitado si `phoneTicketProvider.hasActiveTicket` (el backend también rechaza un segundo turno con `ACTIVE_TICKET_EXISTS`).

### 3.4 Gestión de estado


| Capa                          | Tecnología                           | Dónde                                                     |
| ----------------------------- | ------------------------------------ | --------------------------------------------------------- |
| Sesión y turno compartidos    | **Riverpod** `StateNotifierProvider` | `coreAuthStateProvider`, `phoneTicketProvider`            |
| Flags / async puntuales       | `FutureProvider`                     | `backendHealthProvider`                                   |
| Formulario, búsqueda, detalle | `setState` del propio `State`        | Login, Search, PlaceDetail                                |
| Widget de notificación        | `setState` interno                   | `TicketNotificationWidget`                                |


No hay BLoC ni `Provider` clásico.

---

## 4. Tipo de interfaz

Hay **dos tipos** clásicos de interfaz de usuario: **inglesa** y **americana**. Turnix usa la **americana**.

### Interfaz inglesa

Consiste en **texto y comandos**. El usuario escribe órdenes (como en una terminal: `login`, `cancel ticket A-042`). La comunicación es secuencial y verbal: hay que recordar la sintaxis. Es precisa, pero poco práctica en un teléfono. Ejemplos: consola de Windows, shell de Linux.

Turnix **no** es inglesa: no hay consola ni lenguaje de comandos para operar la fila.

### Interfaz americana

Consiste en **gráficos y manipulación directa**. Ventanas, iconos, botones, listas y gestos (tocar, deslizar). El usuario ve el estado en pantalla (número de turno, posición, mapa) y actúa tocando un control (Entrar, Cómo llegar, Cancelar turno), sin memorizar comandos. Es el modelo GUI / WIMP aplicado al móvil.

Turnix **sí es americana**: Material 3, `Scaffold`, `Card`, `FilledButton`, `NavigationBar` y el `TicketNotificationWidget` con acciones visibles.

| Detalle | Dónde |
|---------|--------|
| Tema Material 3 (colores, botones, cards) | [`lib/theme/turnix_theme.dart`](lib/theme/turnix_theme.dart) |
| Pantallas gráficas (login, turno, búsqueda) | `lib/features/` |
| Mapa, pin y botones Cómo llegar / Cancelar (no comandos de texto) | [`lib/widgets/ticket_notification_widget.dart`](lib/widgets/ticket_notification_widget.dart) |
| Barra inferior de iconos + etiquetas | [`lib/widgets/phone_shell.dart`](lib/widgets/phone_shell.dart) |

---

## 5. Resumen rápido

| Pregunta | Respuesta en este proyecto |
|----------|----------------------------|
| ¿Almacenamiento? | **Secure storage** (JWT y usuario) en el núcleo; turno y lugares **solo en el backend**. Sin SQLite/Room. |
| ¿Navegación? | `go_router`: `/login`, `/home`, `/search`, `/place/:id`, shell con **NavigationBar**, guard de auth y `AlertDialog`. |
| ¿Widgets clave? | **ConsumerStatefulWidget** (login, shell, búsqueda, detalle, notificación con mapa), **ConsumerWidget** (home), UI **Material 3**. |
| ¿Tipo de interfaz? | **Americana** (gráfica: botones, iconos, toques). No es inglesa (comandos de texto). |


