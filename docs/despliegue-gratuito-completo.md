# Despliegue gratuito completo (todo en la nube)

Guía para publicar **Virtual Queue** sin costo mensual fijo, usando el stack real del repo y planes gratuitos vigentes (2026).

## Stack del proyecto (resumen)

| Pieza | Tecnología | Puerto / ruta |
|-------|------------|---------------|
| API | Spring Boot 4.1 / Java 21 | `:8080`, `/api`, `/ws` |
| Base de datos | PostgreSQL en **Supabase** + Flyway | JDBC SSL |
| Web | React 19 + Vite 8 + HeroUI | SPA estática |
| Móvil / Wear | Flutter (flavors `mobile` / `wear`) | `--dart-define` |
| Push | Firebase Cloud Messaging | Admin SDK + app Flutter |
| Contenedor | `virtual-queue-back/Dockerfile` | JRE 21, puerto 8080 |

## Arquitectura objetivo

```text
[Usuario web] ──► Netlify (SPA) ──HTTPS──► Render (Spring Boot) ──JDBC──► Supabase
[Emulador / APK] ──────────────────────────HTTPS/WSS─────────────► Render
[FCM] ◄── Firebase ◄── backend (credenciales de servicio)
```

## Coste real (expectativa)

| Servicio | Plan | Limitación importante |
|----------|------|------------------------|
| **Supabase** | Free | ~500 MB DB, pausa tras inactividad prolongada |
| **Render** Web Service | Free | Se duerme ~15 min sin tráfico; cold start 30–60 s |
| **Netlify** | Starter free | Ideal para Vite SPA; créditos mensuales de build/bandwidth |
| **Firebase** | Spark (free) | Suficiente para FCM de prueba / demo |
| **Wear / móvil** | APK debug | No hace falta Play Store para demos |

> “Gratis absoluto y siempre encendido” ya no existe para JVM en PaaS. Esta opción es **gratis**, pero el API puede tardar en despertar.

---

## 1. Base de datos (Supabase Free)

Ya es la opción del proyecto (`SUPABASE_DB_*` en `.env.example`).

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. Settings → Database → connection string **URI** (preferir Session mode / direct; **no** Transaction Pooler para Flyway).
3. Convierte a JDBC:

```text
jdbc:postgresql://db.<PROJECT_REF>.supabase.co:5432/postgres?sslmode=require
```

4. Al arrancar el backend en la nube, Flyway aplicará `V1`…`V5` solos.

Variables:

```text
SUPABASE_DB_URL=jdbc:postgresql://...
SUPABASE_DB_USERNAME=postgres
SUPABASE_DB_PASSWORD=...
SUPABASE_DB_POOL_MAX_SIZE=5
```

---

## 2. Backend en Render (Docker gratuito)

El repo ya tiene Dockerfile multi-stage (`eclipse-temurin:21`).

### Pasos

1. Sube el monorepo a GitHub (o solo `virtual-queue-back` en un repo).
2. En [render.com](https://render.com) → **New → Web Service** → conecta el repo.
3. Configura:
   - **Root Directory:** `virtual-queue-back` (si es monorepo)
   - **Runtime:** Docker
   - **Dockerfile Path:** `./Dockerfile`
   - **Instance type:** Free
4. Variables de entorno (prod):

```text
SPRING_PROFILES_ACTIVE=prod
SUPABASE_DB_URL=...
SUPABASE_DB_USERNAME=postgres
SUPABASE_DB_PASSWORD=...
SUPABASE_DB_POOL_MAX_SIZE=5
JWT_SECRET=<mínimo 32 caracteres aleatorios>
JWT_ACCESS_TTL=900
JWT_REFRESH_TTL=604800
STAFF_REGISTRATION_KEY_PEPPER=<mínimo 32 caracteres>
ALLOWED_ORIGINS=https://<tu-sitio>.netlify.app,https://<tu-api>.onrender.com
FIREBASE_CREDENTIALS_PATH=/etc/secrets/firebase.json
```

5. Sube el JSON de Firebase Admin como **Secret File** en Render (ruta coincidente con `FIREBASE_CREDENTIALS_PATH`), o deja vacío si aún no usas push.
6. Health check sugerido: `/actuator/health`
7. Tras el deploy, anota la URL, p. ej. `https://virtual-queue-api.onrender.com`

### Comprobaciones

```text
GET https://<api>.onrender.com/actuator/health
GET https://<api>.onrender.com/swagger-ui.html
```

WebSockets STOMP quedan en `https://<api>.onrender.com/ws` (SockJS) / `wss://...` según cliente.

---

## 3. Frontend web en Netlify (gratis)

Proyecto: `virtual-queue/` (Vite).

1. [Netlify](https://www.netlify.com) → Import from Git → carpeta `virtual-queue`.
2. Build settings:
   - **Build command:** `pnpm install && pnpm build`  
     (o `npm install && npm run build` si no usas pnpm en Netlify; en ese caso añade `PNPM` vía plugin o usa npm)
   - **Publish directory:** `dist`
3. Variables de entorno:

```text
VITE_API_URL=https://<api>.onrender.com
VITE_WS_URL=https://<api>.onrender.com/ws
VITE_USE_MOCK=false
```

4. SPA routing: crea `virtual-queue/public/_redirects`:

```text
/*    /index.html   200
```

5. Redeploy. Abre `https://<app>.netlify.app` e inicia sesión con usuarios seed / registrados.

> Alternativa equivalente: **Vercel** Hobby (mismo `dist`, mismos `VITE_*`). Netlify permite uso comercial en free; Vercel Hobby es no comercial.

### CORS

`ALLOWED_ORIGINS` del backend **debe** incluir la URL exacta de Netlify (con `https://`).

---

## 4. Widget Flutter (opcional en despliegue completo)

Si usas el iframe `/flutter/` embebido:

1. En local (o CI):

```bash
cd virtual-queue-mobile
flutter build web -t lib/main_stats.dart --release \
  --dart-define=API_URL=https://<api>.onrender.com \
  --dart-define=WS_URL=wss://<api>.onrender.com/ws \
  --dart-define=POST_MESSAGE_ORIGIN=https://<app>.netlify.app
```

2. Copia el build a `virtual-queue-back/src/main/resources/static/flutter/` y vuelve a desplegar el API (el Dockerfile empaqueta `src`).

Sin ese paso, el iframe fallará; el resto de la web SPA sigue funcionando.

---

## 5. Móvil y Wear apuntando a la nube

No hay hosting de apps Wear “gratis en la tienda” sin Play Console. Para demo:

```bash
# Teléfono / emulador móvil
flutter run --flavor mobile \
  --dart-define=API_URL=https://<api>.onrender.com \
  --dart-define=WS_URL=wss://<api>.onrender.com/ws

# Wear
flutter run -d <wear-device> --flavor wear -t lib/main_wear.dart \
  --dart-define=API_URL=https://<api>.onrender.com \
  --dart-define=WS_URL=wss://<api>.onrender.com/ws
```

APK release:

```bash
flutter build apk --flavor wear -t lib/main_wear.dart --release \
  --dart-define=API_URL=https://<api>.onrender.com \
  --dart-define=WS_URL=wss://<api>.onrender.com/ws
```

Firebase: usa el mismo proyecto `google-services.json` / configuración ya presente; el backend necesita el service account para enviar push.

---

## 6. Checklist final

- [ ] Supabase conectado y migraciones V1–V5 aplicadas
- [ ] Render responde `/actuator/health` (acepta cold start)
- [ ] Netlify carga login y llama a la API por HTTPS
- [ ] CORS incluye origen Netlify
- [ ] JWT_SECRET ≥ 32 caracteres
- [ ] STOMP `/ws` abre desde web (consola sin errores)
- [ ] Flutter/Wear con `https`/`wss` (no `http` en release)
- [ ] (Opcional) Firebase credentials en Render

---

## Alternativas equivalentes (mismo esquema)

| Rol | Opción A (recomendada aquí) | Opción B |
|-----|-----------------------------|----------|
| API | Render Free + Docker | Koyeb Free (scale-to-zero) |
| Web | Netlify Free | Vercel Hobby / Cloudflare Pages |
| DB | Supabase Free | Neon Free (cambiar JDBC) |
| Túnel no aplica | — | — |

Railway ya no es “gratis siempre”: créditos muy bajos; no lo uses como plan principal sin presupuesto.

---

## Limitaciones que debes aceptar

1. **Cold start** del API en Render Free: el primer login/WebSocket puede fallar o tardar; reintenta.
2. Supabase Free puede **pausar** el proyecto; hay que reactivarlo en el dashboard.
3. Wear/móvil dependen de que el API esté despierto; conviene un ping periódico (cron externo gratis) a `/actuator/health` si demuestras en vivo.
4. No hay `docker-compose` de stack completo: cada pieza se despliega por separado (coherente con el diseño actual: DB externa + API Docker + SPA).
