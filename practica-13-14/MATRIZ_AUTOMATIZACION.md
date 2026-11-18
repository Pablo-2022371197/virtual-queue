# Matriz de automatización — AUT-01 a AUT-08

| ID | Tipo | Alcance | Archivo de prueba | Resultado | Evidencia |
|----|------|---------|-------------------|-----------|-----------|
| AUT-01 | Unitarias | `PhoneTicketController` / `applyTicket` | `virtual_queue_phone/test/phone_ticket_controller_test.dart` | Aprobada | `evidencias/flutter-phone-test.txt` (21/21) |
| AUT-02 | Unitarias | `TokenStorage` válido / vacío / clear | `packages/virtual_queue_core/test/token_storage_test.dart` | Aprobada | `evidencias/flutter-core-test.txt` (18/18) |
| AUT-03 | Unitarias | Timeout GPS D-P12-04 | `virtual_queue_phone/test/user_location_test.dart` | Aprobada | idem phone |
| AUT-04 | Integración | POST take ticket 201 + Idempotency-Key | `packages/virtual_queue_core/test/ticket_repository_test.dart` | Aprobada | idem core |
| AUT-05 | Integración | 409 / red / reconcile getMine | `ticket_repository_test.dart` | Aprobada | idem core |
| AUT-06 | Persistencia | login → saveSession; handler 409 | `auth_service_test.dart`, `GlobalExceptionHandlerTest.java` | Aprobada | core + `maven-test.txt` (28/28) |
| AUT-07 | CI | Workflow push/PR primer run | `.github/workflows/ci.yml` | Ver `ci-run.md` | GitHub Actions |
| AUT-08 | CI | Segundo push (entregables doc) | GitHub Actions | Ver `ci-run.md` | Segundo workflow run |