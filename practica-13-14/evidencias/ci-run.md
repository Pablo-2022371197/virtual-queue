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

Después de `git push origin main`, abrir **Actions** y verificar los tres jobs en verde.

- **AUT-07:** primer workflow run con tests + CI nuevos
- **AUT-08:** segundo push (commit `ci-run.md` actualizado) vuelve a disparar el mismo pipeline

URL directa: https://github.com/Pablo-2022371197/virtual-queue/actions/workflows/ci.yml