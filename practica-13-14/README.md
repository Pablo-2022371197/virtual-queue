# Prácticas 13 y 14 — Automatización y CI Turnix

## Ejecución local

```powershell
cd packages\virtual_queue_core; flutter test
cd ..\..\virtual_queue_phone; flutter test
cd ..\virtual-queue-back; .\mvnw.cmd test
```

## CI

Pipeline: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) — push y pull_request.

## Documentos

- [FASE1_SELECCION.md](FASE1_SELECCION.md)
- [MATRIZ_AUTOMATIZACION.md](MATRIZ_AUTOMATIZACION.md)
- [REPORTE_Practica13_14.md](REPORTE_Practica13_14.md)
- PDF: `python genera_reporte_pdf.py`