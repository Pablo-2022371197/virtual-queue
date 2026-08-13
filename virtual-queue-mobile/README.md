# Virtual Queue Wear OS

Cliente **Wear OS standalone** del sistema **Virtual Queue**. Permite iniciar sesión en el reloj, consultar el turno activo y recibir actualizaciones en tiempo real vía REST y WebSocket STOMP.

## Rol en el ecosistema

```
┌─────────────────────────┐
│   virtual-queue-back    │
│  REST · WebSocket STOMP │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  virtual-queue-mobile   │
│  (Wear OS standalone)   │
└─────────────────────────┘
```

El front web (`virtual-queue`) y el backend (`virtual-queue-back`) se despliegan por separado. Este proyecto es la app del smartwatch que se revisa en simulador o dispositivo Wear OS.

## Stack tecnológico

| Tecnología | Uso |
|------------|-----|
| Flutter 3.5+ | UI Wear OS |
| Riverpod | Estado y providers |
| go_router | Navegación y guards de autenticación |
| Dio | Cliente HTTP con interceptor JWT |
| stomp_dart_client | WebSocket STOMP para fila en vivo |
| wear_plus | UI adaptada a pantalla redonda/cuadrada |
| flutter_secure_storage | Persistencia del token JWT |

## Funcionamiento

1. **Login** (`WearLoginScreen`): autentica contra `POST /api/auth/login` con RemoteInput de Wear OS.
2. **PIN opcional** (`PinScreen`): protege la sesión en el reloj.
3. **Turno** (`TurnoWearWidget`): muestra número de turno, posición, tiempo estimado y alertas de llamado.
4. **Tiempo real** (`WearTicketListener`): STOMP sobre `/user/queue/ticket` con polling de respaldo cada 8 s.

La app es **standalone** (`com.google.android.wearable.standalone=true`): no depende de un teléfono emparejado.

## Requisitos previos

- Flutter SDK >= 3.5.0
- Android Studio con emulador Wear OS o reloj físico
- Backend en ejecución (`virtual-queue-back`)

## Configuración

La URL del API se define en tiempo de compilación:

```bash
flutter run --dart-define=API_URL=http://10.0.2.2:8080
```

## Cómo ejecutar

```bash
flutter pub get
flutter run
```

En emulador Wear OS, `10.0.2.2` apunta al host local donde corre el backend.

## Estructura del proyecto

```
lib/
├── main.dart
├── router/wear_router.dart
├── wear/
│   ├── turnoWearWidget.dart
│   ├── wear_safe_area.dart
│   └── auth/
├── providers/
│   ├── wear_queue_provider.dart
│   └── wear_ticket_provider.dart
├── features/tickets/ticket_repository.dart
├── core/
│   ├── auth/auth_service.dart
│   ├── http/dio_client.dart
│   ├── realtime/stomp_service.dart
│   └── storage/token_storage.dart
└── models/
```

## Endpoints consumidos

| Método | Ruta | Uso |
|--------|------|-----|
| `POST` | `/api/auth/login` | Autenticación |
| `GET` | `/api/tickets/mine` | Turno activo |
| `DELETE` | `/api/tickets/{id}` | Cancelar turno |
| WebSocket | `/ws` → `/user/queue/ticket` | Actualizaciones del turno |
