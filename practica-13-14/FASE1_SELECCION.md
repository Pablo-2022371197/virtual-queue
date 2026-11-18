# Fase 1 — Selección de componentes críticos (Prácticas 13 y 14)

Derivado de hallazgos de Prácticas 11 (white box) y 12 (estrés/resiliencia).

## Tres componentes

| Tipo | Componente | Ubicación | Justificación |
|------|------------|-----------|----------------|
| Función móvil crítica | **Tomar turno** | `virtual_queue_phone/lib/providers/phone_ticket_provider.dart` | Flujo principal del cliente; doble toque y carrera de UI pueden duplicar solicitudes. |
| Servicio / comunicación | **POST `/api/places/{placeId}/tickets`** + cabecera `Idempotency-Key` | `packages/virtual_queue_core/.../ticket_repository.dart`, `virtual-queue-back/.../TicketController.java` | Contrato HTTP crítico; errores de red y conflictos de negocio. |
| Persistencia | **Sesión JWT** (`TokenStorage` / `FlutterSecureStorage`) | `packages/virtual_queue_core/lib/storage/token_storage.dart` | Sin sesión correcta no hay autorización ni recuperación de turno. |

## Defecto ancla (prevención por automatización)

**D-P12-02:** carrera concurrente en `takeTicket` del mismo usuario puede provocar `DataIntegrityViolationException` por `idx_tickets_user_active` y respuesta **500** en lugar de **409**.

Pruebas automatizadas en cliente (idempotencia, reconcile por red) y en servidor (handler → 409) evitan regresiones.

**D-P12-04 (complementario):** ANR en «Cómo llegar» por `Geolocator.getCurrentPosition` sin límite de tiempo; se cubre con prueba de timeout y `timeLimit` en producción.

## Matriz

Ver [MATRIZ_AUTOMATIZACION.md](MATRIZ_AUTOMATIZACION.md).