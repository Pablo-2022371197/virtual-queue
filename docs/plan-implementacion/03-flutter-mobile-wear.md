# Parte 3 — Flutter móvil, Wear OS y widget web

## Cuándo comenzar

Comenzar la integración de esta parte después de estabilizar autenticación, turnos, registro de dispositivos y STOMP en la Parte 1.

El trabajo visual de Wear OS puede ejecutarse antes, pero el flujo completo depende del backend y de una app Android emparejada.

## Dispositivo wearable objetivo

El AVD confirmado en el equipo es:

```text
Id: Wear_OS_Large_Round
Nombre: Wear OS Large Round
Sistema: Android 16 ("Baklava")
ABI: x86_64
```

Comandos base:

```powershell
flutter emulators --launch Wear_OS_Large_Round
flutter devices
flutter run -d <id-detectado> --flavor wear -t lib/main_wear.dart `
  --dart-define=API_URL=http://10.0.2.2:8080 `
  --dart-define=WS_URL=ws://10.0.2.2:8080/ws
```

`10.0.2.2` representa al equipo anfitrión desde el emulador Android. `localhost` dentro del reloj apunta al propio reloj, no al backend de Windows.

El AVD por sí solo permite probar interfaz, navegación, PIN, modo ambiente y recepción directa desde backend si se implementa. Para validar `flutter_wear_os_connectivity` se necesita además:

- Un teléfono Android físico emparejado, o
- Un emulador de teléfono emparejado con el AVD Wear OS desde Android Studio.

La app del teléfono y la del reloj deben usar el mismo `applicationId` y certificado de firma para que Android Wearable Data Layer las reconozca como la misma aplicación.

## Objetivo

Completar tres productos construidos desde `virtual-queue-mobile`:

1. App Android para clientes.
2. App companion Wear OS.
3. Widget Flutter Web de estadísticas embebido por React.

Los tres deben compartir modelos y contratos, pero tener arranque, navegación, permisos y servicios separados.

## Estado verificado del repositorio

### Implementado

- Entry points `main.dart`, `main_wear.dart` y `main_stats.dart`.
- Riverpod, Dio, go_router, STOMP, Firebase Messaging, notificaciones locales, `wear_plus`, Data Layer, secure storage y autenticación local.
- Consulta básica del turno activo.
- Listado básico de establecimientos.
- Emisión de datos del teléfono hacia `/queue/status`.
- Emisión de mensajes hacia `/queue/alert`.
- UI redonda con número, posición y tiempo estimado.
- Modo ambiente.
- PIN local y un intento de biometría.
- Widget web que recibe estadísticas por STOMP y usa `postMessage`.
- Una prueba de widget del teclado PIN.

### Problemas funcionales

- El login móvil actual solo crea/verifica un PIN local; no llama a `/api/auth/login` ni obtiene JWT.
- El router considera el PIN local equivalente a autenticación de backend. Después de introducirlo, las peticiones protegidas no tienen JWT.
- El mismo router se usa en móvil y reloj. `main_wear.dart` inicia en `/home`, por lo que puede terminar en el login móvil en vez de `/wear/pin/setup`.
- El reloj no tiene un listener para recibir `/queue/status` ni `/queue/alert`; solo existe el envío desde el teléfono.
- No se llama `configureWearableAPI()` ni se gestiona el ciclo de vida de la conectividad.
- El estado de sesión Wear vive solo en memoria durante 30 minutos y se pierde al reiniciar el proceso.
- La pantalla de lugar en móvil es un placeholder.
- La consulta del turno captura cualquier excepción y la convierte en “sin turno”, ocultando errores de red y autorización.
- El listener STOMP se inicia desde Home pero no se detiene al salir.
- No hay manejo de refresh token, reconexión observable ni deduplicación de eventos.
- El widget web usa `dart:js`, API obsoleta, y envía `postMessage` a `'*'`.

### Problemas Android/Firebase

- No existe `google-services.json` ni `firebase_options.dart`.
- Gradle no aplica el plugin `com.google.gms.google-services`.
- `INTERNET` solo está en el manifest de debug; un release no tendría red. El manifest principal tampoco declara `POST_NOTIFICATIONS`, `VIBRATE` ni `USE_BIOMETRIC`.
- El manifest no declara la característica `android.hardware.type.watch`.
- No existe metadata `com.google.android.wearable.standalone`.
- Hay dos `MainActivity.kt` con paquetes diferentes; debe quedar únicamente el que coincide con `com.queueSystem.virtualqueue`.
- `local_auth` puede requerir que la actividad Android herede de `FlutterFragmentActivity`; debe verificarse en la versión instalada antes de considerar funcional la biometría.
- No hay separación de manifests/configuración entre móvil y Wear.
- `wear_plus` requiere como mínimo Android API 23; fijar y comprobar `minSdk >= 23`.
- El release usa firma debug.
- HTTP sin TLS puede ser bloqueado por Android; una excepción cleartext debe existir solo en debug.

### Resultado de verificaciones

- `flutter test`: una prueba, pasa.
- `flutter analyze`: 21 hallazgos; 2 warnings por imports sin uso y el resto principalmente nombres de archivo, `const` y `dart:js` obsoleto.
- El AVD está configurado, pero no estaba iniciado al ejecutar `flutter devices`.
- El build Wear debug quedó detenido durante varios minutos en Gradle y emitió una advertencia: `flutter_wear_os_connectivity` todavía aplica Kotlin Gradle Plugin, camino incompatible con la migración a Built-in Kotlin/AGP 9.

## Decisión de empaquetado

Mantener un solo proyecto Flutter, pero crear dos flavors Android:

- `mobile`
- `wear`

Ambos deben conservar el mismo `applicationId` para Data Layer y usar la misma firma. Deben tener source sets separados:

```text
android/app/src/main/
android/app/src/mobile/
android/app/src/wear/
```

El flavor `wear` aporta:

- `uses-feature android.hardware.type.watch=true`
- metadata de companion/standalone.
- nombre e icono de reloj.
- configuración específica de pantalla y launcher.

El flavor `mobile` aporta configuración de FCM y teléfono.

Si AGP impide flavors con el mismo identificador o la distribución requiere artefactos distintos, usar módulos Android separados conservando package/signature. No cambiar a identificadores diferentes sin comprobar Data Layer.

## Separación de autenticaciones

Hay dos conceptos distintos:

### Sesión de backend

- Usuario y contraseña contra `/api/auth/login`.
- Access y refresh token.
- Requerida para REST, STOMP y registro FCM.
- Se almacena con `flutter_secure_storage`.

### Desbloqueo local

- PIN de seguridad
- Solo protege una sesión ya iniciada o los datos cacheados.
- Nunca crea una identidad de backend.
- Si no existe refresh token válido, debe mostrar login real.

En el reloj el PIN desbloquea la vista del turno sincronizado; no reemplaza la autenticación del teléfono.

## Arquitectura objetivo

```text
lib/
├── app/
│   ├── mobile_app.dart
│   ├── wear_app.dart
│   └── stats_app.dart
├── core/
│   ├── config/
│   ├── http/
│   ├── auth/
│   ├── storage/
│   ├── realtime/
│   └── errors/
├── features/
│   ├── auth/
│   ├── places/
│   ├── tickets/
│   ├── notifications/
│   ├── wearable_sync/
│   └── stats/
├── models/
├── main.dart
├── main_wear.dart
└── main_stats.dart
```

Crear routers separados:

- `mobile_router.dart`
- `wear_router.dart`

No envolver pantallas internas con otro `MaterialApp`; debe existir uno por entry point.

## Configuración Android requerida

### Manifest móvil

- `android.permission.INTERNET`
- `android.permission.POST_NOTIFICATIONS`
- `android.permission.VIBRATE`
- Metadata y servicio requeridos por Firebase/Flutter.
- Deep links solo si se implementan.

### Manifest Wear

- `android.permission.INTERNET` si el reloj tendrá fallback directo.
- `android.permission.VIBRATE`
- `android.hardware.type.watch`
- `com.google.android.wearable.standalone=false` si depende del teléfono.
- Soporte de pantalla redonda.

### Build

- Resolver compatibilidad entre AGP 9, Built-in Kotlin y `flutter_wear_os_connectivity`.
- Primero buscar una versión compatible del paquete.
- Si no existe, fijar temporalmente una combinación AGP/Flutter soportada o mantener un fork mínimo documentado.
- No modificar versiones a ciegas: ejecutar build después de cada cambio.
- Crear firma release externa a Git.

## Plan de ejecución para un agente

### Fase 0 — Estabilizar Flutter y Gradle

1. Preservar los cambios locales existentes.
2. Ejecutar `flutter doctor -v`, `flutter pub get`, `flutter analyze` y `flutter test`.
3. Renombrar archivos Dart a `lower_case_with_underscores` actualizando imports.
4. Eliminar imports sin uso y reemplazar `dart:js` por `dart:js_interop`.
5. Eliminar el `MainActivity` cuyo package no coincide con el namespace.
6. Resolver la advertencia KGP/AGP del plugin Wear.
7. Verificar por separado:

```powershell
flutter build apk --debug --flavor mobile -t lib/main.dart
flutter build apk --debug --flavor wear -t lib/main_wear.dart
flutter build web -t lib/main_stats.dart
```

Criterio de salida:

- `flutter analyze` sin warnings/errores.
- Los tres artefactos compilan.

### Fase 1 — Configuración y contratos compartidos

1. Separar `API_URL` de `WS_URL`.
2. Crear configuración validada por entry point.
3. Usar `https`/`wss` fuera de debug.
4. Crear DTO alineado con OpenAPI.
5. Implementar errores tipados: red, `401`, `403`, `404`, `409`, servidor.
6. No capturar todas las excepciones como ausencia de datos.

Criterio de salida:

- Móvil y reloj usan `10.0.2.2` en emuladores.
- Los modelos serializan el DTO canónico de backend.

### Fase 2 — Autenticación móvil real

1. Restaurar una pantalla de usuario/contraseña o email/contraseña.
2. Implementar login, refresh y logout.
3. Guardar tokens en secure storage.
4. Añadir interceptor con una única renovación concurrente.
5. Crear estado reactivo de autenticación para go_router.
6. Convertir el PIN en desbloqueo opcional posterior al login.
7. Limpiar tokens, caché y conexiones al cerrar sesión.

Criterio de salida:

- Introducir solo un PIN sin JWT no permite acceder a datos.
- Una sesión válida sobrevive al reinicio.
- Un refresh inválido vuelve a login.

### Fase 3 — Flujo móvil de turnos

1. Crear repositorios para lugares y turnos.
2. Tipar la lista de lugares; no usar `dynamic`.
3. Completar detalle de establecimiento.
4. Implementar tomar y cancelar turno.
5. Mostrar estados de carga, vacío, error y retry.
6. Iniciar STOMP una vez por sesión.
7. Suscribirse a `/user/queue/ticket`.
8. Actualizar Riverpod y caché con eventos.
9. Detener conexiones en logout/dispose.

Criterio de salida:

- Flujo login → buscar → tomar turno → observar actualización → cancelar.
- La app distingue “sin turno” de “backend no disponible”.

### Fase 4 — Firebase y notificaciones Android

1. Configurar un proyecto Firebase por entorno.
2. Generar configuración con FlutterFire o agregar `google-services.json` fuera del repositorio público.
3. Aplicar Google Services en Gradle.
4. Inicializar Firebase antes de usar Messaging.
5. Solicitar permiso de notificaciones desde una acción contextual.
6. Crear canal Android antes de mostrar mensajes.
7. Registrar token solo después de autenticar.
8. Escuchar rotación con `onTokenRefresh`.
9. Manejar foreground, background y apertura desde notificación.
10. Navegar al turno indicado por el payload.

Criterio de salida:

- El móvil recibe `NEARLY` y `CALLED`.
- Rotar o revocar sesión actualiza el registro de dispositivo.

### Fase 5 — Aplicación Wear OS

1. Crear `WearApp` y router propios con ruta inicial Wear.
2. Inicializar bindings y plugins antes de leer secure storage.
3. Ajustar PIN a la pantalla Large Round.
4. Añadir estados: bloqueado, sin turno, sincronizando, turno activo, llamado, completado y sin teléfono.
5. Persistir el último turno con expiración para reinicios breves.
6. Hacer que el modo ambiente reduzca color, animaciones y frecuencia de actualización.
7. Desactivar acciones táctiles innecesarias en ambient mode.

Criterio de salida en `Wear_OS_Large_Round`:

- No hay recortes en pantalla redonda.
- Rotary input, botón atrás y modo ambiente no rompen navegación.
- Reiniciar la app conserva de forma segura el último estado o muestra “sincronizando”.

### Fase 6 — Data Layer teléfono ↔ reloj

1. Revisar la API exacta de la versión instalada de `flutter_wear_os_connectivity`.
2. Llamar `configureWearableAPI()` una vez por proceso, tanto en teléfono como en reloj, y manejar errores de inicialización.
3. En teléfono:
   - publicar `/queue/status`;
   - enviar `/queue/alert`;
   - eliminar estado al terminar/cancelar.
4. En reloj:
   - escuchar cambios de datos;
   - escuchar mensajes;
   - convertir payload a modelo tipado;
   - actualizar Riverpod;
   - vibrar en alertas urgentes.
5. Cancelar listeners en dispose.
6. Definir versión del payload para futuras migraciones.
7. Corregir URI/path de eliminación según la API real del plugin.
8. Manejar teléfono no conectado y re-sincronización.

Payload sugerido:

```json
{
  "schemaVersion": 1,
  "ticketId": "uuid",
  "placeName": "Banco Centro",
  "ticketNumber": "A-047",
  "position": 2,
  "estimatedMinutes": 8,
  "status": "NEARLY",
  "updatedAt": "2026-08-03T20:00:00Z"
}
```

Criterio de salida:

- Un cambio recibido por STOMP en teléfono aparece en reloj.
- `CALLED` produce alerta y vibración.
- `COMPLETED` o `CANCELLED` limpia la pantalla.
- Reconectar el reloj recupera el estado vigente.

### Fase 7 — Widget Flutter Web

1. Usar `WS_URL`, no una variable cuyo significado cambia según entry point.
2. Migrar a `dart:js_interop` o un paquete web soportado.
3. Restringir `postMessage` al origen configurado.
4. Añadir estado conectado, reconectando y sin datos.
5. Validar `placeId`.
6. Crear script reproducible que compile y copie a `virtual-queue-back/src/main/resources/static/flutter/`.
7. Evitar versionar builds generados salvo que el despliegue lo requiera.

Criterio de salida:

- React carga el widget desde `/flutter/`.
- El widget recibe estadísticas reales.
- No acepta ni envía mensajes a orígenes no autorizados.

### Fase 8 — Pruebas y entrega

1. Unitarias para modelos, repositorios, auth, refresh y transformación de eventos.
2. Widget tests para todas las pantallas y formas Wear.
3. Fakes para Dio, STOMP, FCM y Data Layer.
4. Integration tests del flujo móvil.
5. Integration tests en `Wear_OS_Large_Round`.
6. Prueba emparejada teléfono-reloj para Data Layer.
7. CI para analyze, test, APK móvil, APK Wear y web.
8. Documentar instalación, pairing y variables.

## Secuencia de validación del AVD

```powershell
# 1. Iniciar
flutter emulators --launch Wear_OS_Large_Round

# 2. Esperar a que aparezca
flutter devices

# 3. Validar UI Wear con datos fake en debug
flutter run -d <wear-device-id> --flavor wear -t lib/main_wear.dart

# 4. Validar backend desde el reloj
adb -s <wear-device-id> shell ping -c 1 10.0.2.2

# 5. Ejecutar con configuración local
flutter run -d <wear-device-id> --flavor wear -t lib/main_wear.dart `
  --dart-define=API_URL=http://10.0.2.2:8080 `
  --dart-define=WS_URL=ws://10.0.2.2:8080/ws
```

Para HTTP local, crear una configuración de seguridad de red solo para `debug`. Producción debe usar TLS.

## Matriz mínima de pruebas

### Móvil

- Login correcto, incorrecto y refresh expirado.
- PIN con y sin sesión backend.
- Lista, detalle, toma y cancelación de turno.
- REST sin conexión y backend con error.
- STOMP reconecta sin duplicar listeners.
- FCM foreground, background y token rotado.

### Wear

- Primera configuración y verificación de PIN.
- Tres intentos fallidos y desbloqueo posterior.
- Proceso reiniciado.
- Pantalla redonda normal y ambient.
- Sin teléfono, teléfono desconectado y reconexión.
- Datos malformados o de versión desconocida.
- `WAITING`, `NEARLY`, `CALLED`, `COMPLETED`, `CANCELLED`, `EXPIRED`.

### Data Layer

- Estado inicial.
- Actualizaciones consecutivas.
- Mensaje urgente.
- Eliminación de estado.
- Reloj desconectado durante un cambio y resincronizado después.

## Riesgos que el agente debe evitar

- No tratar PIN local como JWT.
- No usar `localhost` desde emuladores.
- No probar Data Layer únicamente con el reloj aislado.
- No mantener dos `MainActivity` con package distinto.
- No inicializar FCM sin configuración y sin manejar errores.
- No depender de biometría en Wear OS.
- No crear varios `MaterialApp` anidados.
- No dejar listeners vivos después de logout.
- No almacenar datos sensibles del turno indefinidamente.
- No cambiar package o firma de un solo artefacto y esperar que Data Layer funcione.

## Definición de terminado

- Analyze y pruebas pasan.
- Compilan APK móvil, APK Wear y widget web.
- Login usa backend; PIN es solo desbloqueo.
- Móvil completa el flujo de turnos.
- FCM funciona en Android.
- STOMP actualiza el estado en tiempo real.
- El teléfono sincroniza y el reloj recibe datos.
- El AVD `Wear_OS_Large_Round` valida UI, ambient mode y alertas.
- Una prueba emparejada valida Data Layer.
- Widget web recibe estadísticas y usa `postMessage` seguro.
- Builds release usan firma y configuración fuera de Git.

## Prompt sugerido para el agente ejecutor

> Implementa por fases `docs/plan-implementacion/03-flutter-mobile-wear.md`. Preserva los cambios locales y empieza por estabilizar Flutter/Gradle. Usa los contratos de `01-backend-y-datos.md`; no permitas que el PIN sustituya una sesión backend. Valida Wear OS específicamente en el AVD `Wear_OS_Large_Round` y no declares Data Layer terminado hasta probar con un teléfono o emulador emparejado. Después de cada fase ejecuta analyze, tests y el build del artefacto afectado.
