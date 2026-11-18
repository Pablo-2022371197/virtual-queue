# Reporte técnico — Prácticas 13 y 14: Automatización y CI (Turnix)

**Asignatura:** Desarrollo para dispositivos · **Ecosistema:** Flutter (`virtual_queue_phone`, `virtual_queue_core`) + Spring Boot (`virtual-queue-back`).

## Resumen

Se automatizaron componentes críticos derivados de la Práctica 12: **tomar turno** (móvil), **POST /api/places/{id}/tickets** con `Idempotency-Key`, y **persistencia de sesión** (`TokenStorage`). Se añadieron **18 pruebas Dart** nuevas o ampliadas y **2 pruebas Java** del manejador global de excepciones. El pipeline **GitHub Actions** ejecuta `flutter test` (core + phone) y `./mvnw test` en cada push/PR.

## Fase 1 — Componentes

| Capa | Selección | Riesgo P12 |
|------|-----------|------------|
| Móvil | `PhoneTicketController.takeTicket`, guard `_takingTicket` | Doble solicitud |
| Servicio | `TicketRepository` + API tickets | D-P12-02 (500 vs 409) |
| Persistencia | `TokenStorage` / `FlutterSecureStorage` | Sesión corrupta o residual |

## Fase 2 — Unitarias (≥5)

| Prueba | Entrada / caso | Resultado |
|--------|----------------|-----------|
| `TokenStorage` round-trip | Tokens + usuario válidos | OK |
| `readUser` vacío / JSON corrupto | null, `{not-json` | null (sin crash) |
| `clearSession` | Tras `saveSession` | Sin refresh token |
| `PhoneTicketController` concurrente | Segundo `takeTicket` en vuelo | `ApiException` |
| `applyTicket` cancelado | Status `CANCELLED` | `hasActiveTicket == false` |
| `resolveUserLocation` timeout | GPS lento 30 s, límite 50 ms | Mensaje de tiempo agotado |

## Fase 3 — Integración (≥3)

| Prueba | Comportamiento validado |
|--------|-------------------------|
| `takeTicket` 201 | Cabecera `Idempotency-Key` y parseo JSON |
| 409 / red | Conflicto HTTP; reconcile `getMine` mismo `placeId` |
| `AuthService.login` | 200 persiste sesión; 401 no escribe almacén |
| `GlobalExceptionHandler` | `DataIntegrityViolation` → **409** `ACTIVE_TICKET_EXISTS` |

## Fase 4 — CI

Archivo: `.github/workflows/ci.yml`. Jobs: `flutter-core`, `flutter-phone`, `backend` (Java 21, Maven).

## Fase 5 — Ejecución local

| Suite | Pruebas | Tiempo aprox. | Fallos |
|-------|---------|---------------|--------|
| `virtual_queue_core` | 18 | ~4 s | 0 |
| `virtual_queue_phone` | 21 | ~4 s | 0 |
| `virtual-queue-back` | 28 | ~43 s | 0 |

**Correcciones aplicadas:** handler `DataIntegrityViolationException`; `Geolocator` con `timeLimit` 8 s + `timeout`; `readUser` tolera JSON inválido.

Evidencias: `practica-13-14/evidencias/flutter-*-test.txt`, `maven-test.txt`, `ci-run.md`.

## Fase 6 — Conclusión

La automatización actúa como red de seguridad al evolucionar Turnix: los contratos de turno, idempotencia y sesión quedan verificados sin depender del emulador ni de Supabase en cada cambio. El CI en GitHub reproduce la misma batería en Ubuntu, reduciendo regresiones del tipo D-P12-02 (500 por carrera) y D-P12-04 (ANR por GPS). Tras cada modificación, un push dispara las tres suites; un fallo local o en Actions indica el componente exacto antes de integrar a `main`.