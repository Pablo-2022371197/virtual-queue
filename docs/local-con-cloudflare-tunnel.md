# Ejecutar Virtual Queue en local con Cloudflare Tunnel

Esta guía explica cómo exponer tu PC como servidor temporal para que **cualquier persona** abra un enlace público y use la aplicación, sin desplegar en Render/Netlify.

La idea: los servicios siguen corriendo en `localhost`, y **Cloudflare Tunnel** (`cloudflared`) crea URLs HTTPS públicas que reenvían el tráfico a tu máquina.

```text
Visitante  →  https://….trycloudflare.com  →  Cloudflare  →  tu PC (Vite / Spring Boot)
```

---

## Qué necesitas

1. Backend Spring Boot en marcha (`http://localhost:8080`)
2. Frontend Vite en marcha (`http://localhost:5173`)
3. [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/) instalado
4. Que tu PC **no se suspenda** mientras demuestras la app

### Instalar `cloudflared` (Windows)

Opción rápida con winget:

```powershell
winget install --id Cloudflare.cloudflared
```

O descarga el binario desde la documentación oficial de Cloudflare y agrégalo al `PATH`.

Comprueba:

```powershell
cloudflared --version
```

---

## Flujo recomendado (túnel rápido / Quick Tunnel)

Usarás **dos túneles**: uno para el API y otro para la web. Cada vez que los inicies, Cloudflare te da URLs nuevas (`*.trycloudflare.com`).

### Paso 1 — Arranca el backend

En PowerShell, desde `virtual-queue-back` (cargando `.env` como ya sueles hacer):

```powershell
cd virtual-queue-back

Get-Content .env | ForEach-Object {
  if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
    [Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim(), 'Process')
  }
}

.\mvnw.cmd spring-boot:run
```

Deja esta ventana abierta.

### Paso 2 — Túnel del backend (API + WebSocket)

En **otra** terminal:

```powershell
cloudflared tunnel --url http://localhost:8080
```

Cuando arranque verás algo como:

```text
https://random-words-api.trycloudflare.com
```

Guarda esa URL. Llamémosla `API_PUBLIC` (ejemplo: `https://abc-api.trycloudflare.com`).

Notas:

- El túnel soporta HTTP **y** WebSockets (`/ws`), necesarios para STOMP/SockJS.
- No cierres esta terminal.

### Paso 3 — Configura CORS y variables del frontend

En `virtual-queue-back/.env`, añade (o actualiza) el origen del front **público**. Como aún no tienes la URL del front, primero puedes dejar el backend con orígenes amplios para la demo, o reiniciar el backend en el paso 5 cuando ya tengas ambas URLs.

Valores que necesitarás:

| Variable | Dónde | Valor |
|----------|--------|--------|
| `ALLOWED_ORIGINS` | `virtual-queue-back/.env` | URL pública del front (y opcionalmente `http://localhost:5173`) |
| `VITE_API_URL` | `virtual-queue/.env` | `API_PUBLIC` (https del túnel API) |
| `VITE_WS_URL` | `virtual-queue/.env` | `API_PUBLIC/ws` (mismo host del API + `/ws`) |

Ejemplo de `virtual-queue/.env` para la demo:

```env
VITE_API_URL=https://abc-api.trycloudflare.com
VITE_WS_URL=https://abc-api.trycloudflare.com/ws
VITE_USE_MOCK=false
```

> SockJS en el cliente web usa la URL HTTP(S) del endpoint `/ws` (no hace falta escribir `wss://` a mano en `VITE_WS_URL` si usas el mismo esquema HTTPS del túnel).

### Paso 4 — Arranca el frontend

```powershell
cd virtual-queue
npm install
npm run dev -- --host
```

`--host` permite que el túnel llegue a Vite (escucha en `0.0.0.0`, no solo en loopback).

### Paso 5 — Túnel del frontend

En **otra** terminal:

```powershell
cloudflared tunnel --url http://localhost:5173
```

Obtendrás algo como:

```text
https://random-words-web.trycloudflare.com
```

Esa es la URL que compartes. Llámalo `WEB_PUBLIC`.

### Paso 6 — Ajusta CORS y reinicia el backend

En `virtual-queue-back/.env`:

```env
ALLOWED_ORIGINS=https://random-words-web.trycloudflare.com,http://localhost:5173
```

Reinicia el backend (Ctrl+C y vuelve a ejecutar el comando del paso 1) para que tome el nuevo `ALLOWED_ORIGINS`.

Si cambiaste `VITE_*`, reinicia también `npm run dev`.

### Paso 7 — Prueba

1. Abre `WEB_PUBLIC` en el navegador (otro dispositivo o red).
2. Inicia sesión / regístrate.
3. Verifica que la fila en vivo y el WebSocket conecten (indicador de conexión en la UI).

---

## Orden práctico de terminales

| # | Qué corre | Comando resumido |
|---|-----------|------------------|
| 1 | Backend | `mvnw spring-boot:run` (con `.env`) |
| 2 | Túnel API | `cloudflared tunnel --url http://localhost:8080` |
| 3 | Frontend | `npm run dev -- --host` (con `VITE_API_URL` / `VITE_WS_URL`) |
| 4 | Túnel web | `cloudflared tunnel --url http://localhost:5173` |

Comparte **solo** la URL del túnel web (`WEB_PUBLIC`).

---

## Wear OS / móvil apuntando al túnel

Si quieres que el reloj o el emulador usen tu API pública (útil fuera de la red local):

```powershell
flutter run -d <device> --flavor wear -t lib/main_wear.dart `
  --dart-define=API_URL=https://abc-api.trycloudflare.com `
  --dart-define=WS_URL=wss://abc-api.trycloudflare.com/ws
```

Para app móvil (flavor phone), el mismo `API_URL` / `WS_URL`.

Nota: con Quick Tunnel la URL cambia al reiniciar `cloudflared`; hay que volver a pasar `--dart-define`.

---

## Limitaciones del túnel rápido

- La URL **cambia** cada vez que reinicias `cloudflared`.
- Pensado para **demos / pruebas**, no para producción.
- Tu PC debe permanecer encendida y con internet estable.
- Cualquiera con el enlace puede llegar a tu API: no lo dejes abierto de forma permanente.
- Hay rate limits y políticas de uso de Cloudflare Quick Tunnels.

Cuando termines la demo: cierra las ventanas de `cloudflared` y, si quieres, vuelve `VITE_API_URL=http://localhost:8080` y `ALLOWED_ORIGINS` a valores locales.

---

## Opción avanzada: túnel con nombre (URL estable)

Si tienes cuenta en Cloudflare y un dominio:

1. Autentica: `cloudflared tunnel login`
2. Crea un túnel: `cloudflared tunnel create virtual-queue`
3. Enruta hostnames (ej. `api.tudominio.com` → `localhost:8080`, `app.tudominio.com` → `localhost:5173`)
4. Ejecuta: `cloudflared tunnel run virtual-queue`

Así no cambian las URLs en cada sesión. La configuración detallada está en la [documentación de Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/).

---

## Problemas frecuentes

| Síntoma | Qué revisar |
|---------|-------------|
| CORS / bloqueo en el navegador | `ALLOWED_ORIGINS` incluye exactamente `WEB_PUBLIC` (sin barra final) y reiniciaste el backend |
| Login OK pero no hay tiempo real | `VITE_WS_URL` apunta a `API_PUBLIC/ws`; el túnel del API sigue activo |
| Página en blanco o API 404 | Reiniciaste Vite **después** de cambiar `.env` (`VITE_*` se leen al arrancar) |
| Túnel conecta pero timeout | Firewall local, antivirus, o que el servicio no escuche en el puerto indicado |
| “Connection refused” en cloudflared | Backend/front no están corriendo en `8080` / `5173` |
| Wear no conecta | Usa `https`/`wss` del túnel API, no `10.0.2.2` |

---

## Resumen

1. Levanta backend y front en local.
2. Expón cada uno con `cloudflared tunnel --url …`.
3. Apunta el front al API público (`VITE_API_URL` / `VITE_WS_URL`).
4. Autoriza el origen del front en `ALLOWED_ORIGINS`.
5. Comparte la URL pública del **frontend**.

Tu PC actúa como servidor; Cloudflare solo reenvía el tráfico de forma segura por HTTPS.
