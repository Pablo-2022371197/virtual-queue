# virtual_queue_core

Paquete Dart compartido entre **virtual-queue-mobile** (Wear OS) y **virtual_queue_phone** (teléfono).

Incluye:

- `AppConfig` (`API_URL`, `WS_URL`)
- Cliente HTTP (`Dio`) con refresh JWT
- `AuthService`, `TokenStorage`, `StompService`
- Modelos (`Ticket`, `UserSummary`, …)
- `TicketRepository`, `PlaceRepository`
- `checkBackendHealth()` → `GET /actuator/health`

La lógica de **PIN de Wear** permanece solo en `virtual-queue-mobile`, no en este paquete.

## Uso

```yaml
dependencies:
  virtual_queue_core:
    path: ../packages/virtual_queue_core
```

```dart
import 'package:virtual_queue_core/virtual_queue_core.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  AppConfig.init();
  runApp(...);
}
```
