# Despliegue híbrido: nube (API + web) + Wear local

En este modo **backend y frontend web viven en la nube** (gratuitos, con límites), y el **wearable se ejecuta en local** (emulador o reloj) apuntando a esa API pública.

No es el flujo diario de desarrollo (API en `:8080` + Vite en `:5173`). Ese modo ya está documentado en los README del repo. Aquí el objetivo es **demostrar / integrar Wear contra un entorno publicado**.

## Arquitectura

```text
NUBE                                              LOCAL
─────────────────────────────────────────         ──────────────────────────
Supabase (PostgreSQL + Flyway)                    
        ▲                                         
        │ JDBC                                    
Render / API Spring Boot  ◄── HTTPS / WSS ──────  Wear OS (emulador / reloj)
        ▲                         │               flutter run --flavor wear
        │                         │               
Netlify / SPA React+Vite          │               
(navegador de cualquier sitio)    │               
                                  └── mismos JWT, mismos endpoints /api y /ws
Firebase (FCM, opcional) ◄── backend
```

| Pieza | Dónde | Tecnología del proyecto |
|-------|--------|-------------------------|
| Base de datos | Nube | Supabase Free (PostgreSQL) |
| API | Nube | Spring Boot 4.1 / Java 21 + Dockerfile |
| Web | Nube | Vite + React en Netlify (o Vercel) |
| Wear OS | **Local** | Flutter flavor `wear`, `lib/main_wear.dart` |
| Móvil phone (opcional) | Local o ignorado | Mismo `API_URL` / `WS_URL` que Wear |

---

## Coste y límites (2026)

| Servicio | Plan | Nota |
|----------|------|------|
| Supabase | Free | DB compartida; puede pausarse por inactividad |
| Render Web Service | Free | Cold start ~30–60 s tras ~15 min sin tráfico |
| Netlify | Starter free | Hosting de la SPA |
| Firebase | Spark free | Solo si usas push |
| Wear | $0 | Emulador Android Studio / dispositivo USB |

La primera petición al API tras dormir puede fallar o tardar: espera y reintenta antes de culpar al login del reloj.

---

## 1. Publicar backend + base de datos

Detalle paso a paso (Dockerfile, variables, health):  
[`despliegue-gratuito-completo.md`](./despliegue-gratuito-completo.md) secciones **Supabase** y **Render**.

Resumen mínimo:

1. Proyecto Supabase → JDBC en variables del API.
2. Render → Web Service Docker, root `virtual-queue-back`.
3. Env del API (ejemplo):

```text
SPRING_PROFILES_ACTIVE=prod
SUPABASE_DB_URL=jdbc:postgresql://db.<ref>.supabase.co:5432/postgres?sslmode=require
SUPABASE_DB_USERNAME=postgres
SUPABASE_DB_PASSWORD=...
JWT_SECRET=<≥32 caracteres>
STAFF_REGISTRATION_KEY_PEPPER=<≥32 caracteres>
ALLOWED_ORIGINS=https://<tu-app>.netlify.app
FIREBASE_CREDENTIALS_PATH=   # o secret file si usas FCM
```

4. Anota la URL del API, p. ej.:

```text
https://virtual-queue-api.onrender.com
```

Comprueba:

```text
GET https://virtual-queue-api.onrender.com/actuator/health
```

---

## 2. Publicar frontend web

Proyecto: `virtual-queue/`.

1. Netlify → Import Git → directorio `virtual-queue`.
2. Build: `pnpm install && pnpm build` (o npm equivalente).
3. Publish: `dist`.
4. Variables:

```text
VITE_API_URL=https://virtual-queue-api.onrender.com
VITE_WS_URL=https://virtual-queue-api.onrender.com/ws
VITE_USE_MOCK=false
```

5. Asegura SPA fallback (`public/_redirects`):

```text
/*    /index.html   200
```

6. `ALLOWED_ORIGINS` del backend **debe** incluir exactamente `https://<tu-app>.netlify.app`.

Con esto puedes administrar establecimientos, staff y turnos desde el navegador, sin correr Vite en local.

---

## 3. Wear OS solo en local (contra la nube)

El reloj **no se “despliega”**: se instala/ejecuta desde tu máquina apuntando al API publicado.

### Emulador Wear

```bash
cd virtual-queue-mobile

flutter run -d emulator-5554 --flavor wear -t lib/main_wear.dart \
  --dart-define=API_URL=https://virtual-queue-api.onrender.com \
  --dart-define=WS_URL=wss://virtual-queue-api.onrender.com/ws
```

Usa **HTTPS / WSS**, no `10.0.2.2`: el API ya no está en tu PC.

### Reloj físico (USB / Wi‑Fi debug)

```bash
flutter devices   # anota el id del watch

flutter run -d <wear-device-id> --flavor wear -t lib/main_wear.dart \
  --dart-define=API_URL=https://virtual-queue-api.onrender.com \
  --dart-define=WS_URL=wss://virtual-queue-api.onrender.com/ws
```

### APK de prueba (sin `flutter run`)

```bash
flutter build apk --debug --flavor wear -t lib/main_wear.dart \
  --dart-define=API_URL=https://virtual-queue-api.onrender.com \
  --dart-define=WS_URL=wss://virtual-queue-api.onrender.com/ws

adb -s <wear> install -r build/app/outputs/flutter-apk/app-wear-debug.apk
```

### Login en Wear

Usa el teclado nativo RemoteInput (botones “Usuario” / “Contraseña” → confirmar → Entrar) y las mismas credenciales que en la web desplegada.

---

## 4. Flujo de demo sugerido

1. Abre la web en Netlify → login staff/admin → deja la fila lista.
2. En otra sesión (o usuario customer) toma un turno desde la web **o** desde el teléfono si lo tienes.
3. En el emulador Wear: login customer → ver turno / cancelar.
4. En staff (web): ver avance de fila y el aviso de último turno saltado/cancelado.

Si el Wear falla al login justo después de mucho rato sin usar el API, despierta Render con un `GET /actuator/health` desde el navegador y reintenta.

---

## 5. Qué NO hace falta tener en local

| Componente | ¿Local? |
|------------|---------|
| Spring Boot (`mvnw spring-boot:run`) | No |
| Vite (`pnpm dev`) | No |
| PostgreSQL local | No (Supabase) |
| Wear / Android Studio emulator | **Sí** |
| Flutter SDK | **Sí** |

Opcional en local: app móvil phone con los mismos `dart-define`, si quieres probar FCM o Data Layer además del Wear.

---

## 6. Checklist

- [ ] API en Render responde health (acepta cold start)
- [ ] Web en Netlify inicia sesión y habla con el API
- [ ] CORS incluye la URL de Netlify
- [ ] Wear usa `https://…` y `wss://…` del API (no localhost / 10.0.2.2)
- [ ] Mismo usuario/password válidos en web y Wear
- [ ] (Opcional) ping a `/actuator/health` antes de demos en vivo

---

## Relación con el otro documento

- **Todo en la nube** (web + API + DB; Wear solo como APK de prueba):  
  [`despliegue-gratuito-completo.md`](./despliegue-gratuito-completo.md)
- **Este híbrido**: misma nube para API + web; el Wear se desarrolla y ejecuta siempre desde tu PC contra esa nube.
