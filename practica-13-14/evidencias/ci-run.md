# Evidencia CI — Prácticas 13 y 14

## Workflow

- Archivo: `.github/workflows/ci.yml`
- Disparadores: `push` (todas las ramas), `pull_request`
- Jobs: `flutter-core`, `flutter-phone`, `backend` (`./mvnw -B test`, Java 21)

## Ejecución local (referencia)

| Job CI | Comando local | Resultado |
|--------|---------------|-----------|
| flutter-core | `flutter test` en `packages/virtual_queue_core` | 18 passed |
| flutter-phone | `flutter test` en `virtual_queue_phone` | 21 passed |
| backend | `.\mvnw.cmd test` en `virtual-queue-back` | 28 passed |

## GitHub Actions

Repositorio: https://github.com/Pablo-2022371197/virtual-queue

URL: https://github.com/Pablo-2022371197/virtual-queue/actions/workflows/ci.yml

### Fallos iniciales (runs #1 y #2)

- `flutter-core` / `flutter-phone`: `Expected to find project root` — en GitHub no estaban `pubspec.yaml` ni el código de `virtual_queue_core` / `virtual_queue_phone` (solo tests sueltos).
- `backend`: `./mvnw: Permission denied` — el wrapper se subió desde Windows sin bit ejecutable.

### Corrección (commit `fix(ci): publicar proyectos Flutter...`)

- Se publicó el código completo de ambos proyectos Flutter.
- El job Java usa `sh ./mvnw -B test`.

- **AUT-07:** runs rojos documentados (#1 y #2).
- **AUT-08:** nuevo push tras la corrección.

URL directa: https://github.com/Pablo-2022371197/virtual-queue/actions/workflows/ci.yml