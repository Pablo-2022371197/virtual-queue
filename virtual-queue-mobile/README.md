# Virtual Queue Mobile

Cliente móvil y Wear OS del sistema **Virtual Queue**. Permite a los usuarios consultar su turno, recibir notificaciones push (FCM) y sincronizar el estado de la fila con un smartwatch Android emparejado.

Además, este repositorio incluye un **entry point web** (`main_stats.dart`) que se compila como widget embebido en el dashboard React.

## Rol en el ecosistema

```
                    ┌─────────────────────────┐
                    │   virtual-queue-back    │
                    │  REST · WebSocket · FCM │
                    └───────────┬─────────────┘
                                │
         ┌──────────────────────┼──────────────────────┐
         │                      │                      │
         ▼                      ▼                      ▼
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│  App Android    │   │  Wear OS app    │   │  Flutter Web    │
│  (main.dart)    │   │ (main_wear.dart)│   │ (main_stats.dart)│
│  FCM + STOMP    │──►│  Muestra turno  │   │ iframe en React │
└─────────────────┘   └─────────────────┘   └─────────────────┘
```

| Entry point | Plataforma | Propósito |
|-------------|------------|-----------|
| `lib/main.dart` | Android | App principal: login, turno, búsqueda |
| `lib/main_wear.dart` | Wear OS | Reloj: número de turno, posición y tiempo estimado |
| `lib/main_stats.dart` | Web | Widget de estadísticas embebido en `virtual-queue` |

## Stack tecnológico

| Tecnología | Uso |
|------------|-----|
| Flutter 3.5+ | UI multiplataforma |
| Riverpod | Estado y providers |
| go_router | Navegación y guards de autenticación |
| Dio | Cliente HTTP con interceptor JWT |
| stomp_dart_client | WebSocket STOMP para fila en vivo |
| Firebase Messaging | Notificaciones push |
| flutter_local_notifications | Alertas en primer plano (Android) |
| wear_plus | UI adaptada a reloj |
| flutter_wear_os_connectivity | Sincronización teléfono ↔ wearable |
| flutter_secure_storage | Persistencia del token JWT |

## Funcionamiento

### App Android (`main.dart`)

1. **Inicio de sesión** (`LoginScreen`): autentica contra `POST /api/auth/login` y guarda el JWT en almacenamiento seguro.
2. **Home** (`HomeScreen`): consulta el turno activo y arranca el `QueueListenerService`.
3. **Búsqueda** (`SearchScreen`): navega a establecimientos y sus filas.
4. **Fila del establecimiento** (`PlaceQueueScreen`): vista del estado de un lugar concreto.

El router redirige a `/login` si no hay token y evita volver al login cuando ya hay sesión.

### Notificaciones FCM (`FcmService`)

Al iniciar la app:

1. Solicita permisos de notificación.
2. Obtiene el token FCM del dispositivo.
3. Lo registra en el backend con `POST /api/devices/register`.
4. Muestra notificaciones locales cuando llega un mensaje en primer plano.

### Tiempo real y wearable (`QueueListenerService`)

Cuando el usuario tiene sesión, el servicio:

1. Conecta STOMP a `{API_URL}/ws` con header `Authorization: Bearer {jwt}`.
2. Se suscribe a `/topic/queue/my-ticket`.
3. Ante cada actualización:
   - Actualiza el estado local (`queuePositionProvider`).
   - Sincroniza datos al reloj vía `WearableService.syncQueueStatus`.
   - Si la posición es menor a 3, envía una alerta al wearable.
4. Si el turno se cancela o completa, limpia el estado en teléfono y reloj.

### App Wear OS (`main_wear.dart`)

Muestra en pantalla redonda o rectangular:

- Número de turno
- Posición en la fila
- Tiempo estimado de espera

Los datos llegan desde el teléfono emparejado mediante `flutter_wear_os_connectivity`. Soporta modo ambient (pantalla always-on).

### Widget web de estadísticas (`main_stats.dart`)

Pensado para ejecutarse dentro de un iframe en el dashboard React:

1. Lee `placeId` de la query string (`?placeId=demo`).
2. Conecta STOMP a `/topic/stats/{placeId}`.
3. Renderiza métricas: turnos activos, tiempo promedio y ventanillas abiertas.
4. Si `turnCalled == true`, envía `postMessage` al padre con `{ type: 'TURN_CALLED', payload }`.

## Requisitos previos

- Flutter SDK >= 3.5.0
- Android Studio / SDK para compilar Android y Wear OS
- Backend en ejecución (`virtual-queue-back`)
- Proyecto Firebase configurado (`google-services.json` en Android)

## Configuración

La URL del API se define en tiempo de compilación:

```bash
# Valor por defecto: http://localhost:8080
flutter run --dart-define=API_URL=http://localhost:8080
```

Para emulador Android apuntando al host local:

```bash
flutter run --dart-define=API_URL=http://10.0.2.2:8080
```

## Cómo ejecutar

### App Android

```bash
flutter pub get
flutter run
```

### Wear OS

```bash
flutter run -t lib/main_wear.dart
```

### Widget web (para embeber en React)

```powershell
cd virtual-queue-mobile
flutter build web --release --web-renderer canvaskit -t lib/main_stats.dart
Copy-Item -Path build/web/* -Destination ../virtual-queue-back/src/main/resources/static/flutter/ -Recurse -Force
```

El dashboard React carga el bundle en `/flutter/?placeId={placeId}`.

## Estructura del proyecto

```
lib/
├── main.dart                    # App Android
├── main_wear.dart               # App Wear OS
├── main_stats.dart              # Widget web embebido
├── router/
│   └── goRouterConfig.dart      # Rutas y redirect por JWT
├── features/
│   ├── home/homeScreen.dart
│   ├── login/loginScreen.dart
│   ├── search/searchScreen.dart
│   ├── place/placeQueueScreen.dart
│   └── wearable/wearableService.dart
├── core/
│   ├── http/dioClient.dart      # Dio + interceptor JWT
│   ├── websocket/stompService.dart
│   ├── notifications/fcmService.dart
│   └── storage/tokenStorage.dart
├── services/
│   └── queueListenerService.dart
├── providers/
│   ├── activeTicketProvider.dart
│   └── queuePositionProvider.dart
├── dashboard/
│   └── statswidget.dart         # UI del widget web
├── wear/
│   └── turnoWearWidget.dart     # UI del reloj
└── models/
    └── ticket.dart
```

## Endpoints consumidos

| Método | Ruta | Uso |
|--------|------|-----|
| `POST` | `/api/auth/login` | Autenticación |
| `GET` | `/api/tickets/mine` | Turno activo |
| `POST` | `/api/devices/register` | Registro de token FCM |
| WebSocket | `/ws` → `/topic/queue/my-ticket` | Actualizaciones del turno |
| WebSocket | `/ws` → `/topic/stats/{placeId}` | Estadísticas (solo widget web) |

> Varios endpoints dependen de implementaciones pendientes en el backend.

## Flujo de datos al wearable

```
Backend (STOMP)
      │
      ▼
QueueListenerService (teléfono)
      │
      ├──► queuePositionProvider (estado local)
      │
      └──► WearableService
                │
                ├── syncData → /queue/status (posición, turno, minutos)
                ├── sendMessage → /queue/alert (aviso de turno próximo)
                └── removeData (turno completado/cancelado)
                          │
                          ▼
                   TurnoWearWidget (reloj)
```
