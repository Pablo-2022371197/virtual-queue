# Reporte de Seguridad — Autenticación Wear OS
## Virtual Queue Mobile | Prácticas 11 y 12

### Resumen ejecutivo
Se implementó y auditó el módulo de autenticación por PIN de 4 dígitos para la aplicación Wear OS del sistema Virtual Queue. Las pruebas cubrieron almacenamiento seguro, control de acceso por ruteo, límite de intentos, expiración de sesión y cierre de sesión. Se identificaron y corrigieron 4 vulnerabilidades durante el desarrollo, detalladas a continuación. El módulo cumple con los requisitos de seguridad establecidos para un dispositivo wearable.

### Vulnerabilidades encontradas

| ID | Descripción | Riesgo | Estado |
|----|-------------|--------|--------|
| V-01 | Almacenamiento de credenciales en texto plano | Alto | Corregida |
| V-02 | Acceso directo a rutas protegidas sin autenticación | Alto | Corregida |
| V-03 | Ausencia de límite de intentos de PIN | Medio | Corregida |
| V-04 | Sesión sin expiración | Medio | Corregida |

### Detalle por vulnerabilidad

#### V-01 — Almacenamiento de credenciales en texto plano
- **Descripción:** El PIN ingresado por el usuario se almacenaba sin ningún tipo de cifrado en `SharedPreferences`, haciéndolo legible mediante inspección del almacenamiento interno del dispositivo.
- **Vector de ataque:** Un atacante con acceso físico al dispositivo o mediante ADB podía leer el archivo de preferencias y obtener el PIN en texto plano.
- **Riesgo asociado:** Alto — compromiso total de la autenticación del wearable.
- **Recomendación:** Usar `flutter_secure_storage` (almacenamiento cifrado por el SO) combinado con hashing SHA-256 para nunca persistir el PIN original.
- **Corrección aplicada:** Se implementó `PinStorage` usando `flutter_secure_storage` como backend. El PIN se hashea con SHA-256 antes de almacenarse mediante el paquete `crypto`. Nunca se guarda el PIN en texto plano ni en memoria más allá de la operación de hasheo.

#### V-02 — Acceso directo a rutas protegidas sin autenticación
- **Descripción:** La ruta `/wear/home` que muestra el turno activo era accesible directamente sin requerir autenticación previa, permitiendo a cualquier usuario ver la pantalla protegida.
- **Vector de ataque:** Navegación directa a la ruta protegida mediante entrada manual en el router o deep links.
- **Riesgo asociado:** Alto — exposición de información sensible del turno sin autenticación.
- **Recomendación:** Implementar un guard de ruteo que verifique la existencia de PIN y validez de sesión antes de permitir el acceso.
- **Corrección aplicada:** Se agregó lógica de `redirect` en el `GoRouter` para todas las rutas `/wear/**`: (1) si no hay PIN configurado, redirige a `/wear/pin/setup`; (2) si hay PIN pero la sesión expiró, redirige a `/wear/pin/verify`; (3) solo permite pasar a `/wear/home` si hay PIN y sesión válida.

#### V-03 — Ausencia de límite de intentos de PIN
- **Descripción:** No existía restricción en el número de intentos de ingreso de PIN, permitiendo ataques de fuerza bruta indefinidos.
- **Vector de ataque:** Un atacante podía probar combinaciones de 4 dígitos (10,000 posibles) de forma automatizada sin restricción.
- **Riesgo asociado:** Medio — el número limitado de combinaciones (10,000) hace viable un ataque de fuerza bruta sin rate limiting.
- **Recomendación:** Implementar bloqueo temporal tras un número reducido de fallos consecutivos.
- **Corrección aplicada:** En `PinScreen`, modo `verify`, tras 3 intentos fallidos consecutivos se activa un bloqueo de 30 segundos con cuenta regresiva visible. El contador de fallos se reinicia al completar el bloqueo.

#### V-04 — Sesión sin expiración
- **Descripción:** Una vez autenticado, el acceso a la pantalla protegida permanecía abierto indefinidamente sin requerir reautenticación periódica.
- **Vector de ataque:** Un usuario que autenticó su reloj y lo dejó desatendido permitía acceso prolongado sin verificación.
- **Riesgo asociado:** Medio — exposición en caso de pérdida o uso compartido del dispositivo.
- **Recomendación:** Implementar expiración de sesión con timeout razonable para un wearable.
- **Corrección aplicada:** Se implementó `SessionManager` con un timeout de 30 minutos. Al expirar la sesión, el router redirige automáticamente a `/wear/pin/verify`. La sesión es en memoria (no persistente), por lo que cerrar y reabrir la app siempre requiere PIN.

### Resultado de pruebas

| # | Prueba | Resultado esperado | Resultado obtenido | Captura |
|---|--------|--------------------|--------------------|---------|
| 1 | Iniciar la app sin PIN configurado | Aparece `PinScreen` en modo setup | Aparece pantalla de configuración de PIN | — |
| 2 | Ingresar PIN incorrecto 3 veces | Bloqueo de 30 segundos con cuenta regresiva | Bloqueo activo con contador, input deshabilitado | — |
| 3 | Inspeccionar `flutter_secure_storage` con ADB | El valor almacenado es un hash SHA-256 | `adb shell run-as ... FlutterSecureStorage.xml` muestra hash, no PIN | — |
| 4 | Forzar navegación directa a `/wear/home` | El `redirect` del router intercepta y redirige a verify | Redirección inmediata a `/wear/pin/verify` | — |
| 5 | Esperar 30 min sin actividad (o timeout modificado a 1 min) | La sesión expira y pide PIN nuevamente | Sesión expirada, router redirige a verify | — |
| 6 | Cerrar y reabrir la app con sesión activa | Pide PIN porque la sesión es en memoria | Sin sesión persistente, redirige a verify | — |
| 7 | Presionar botón de cierre de sesión | Regresa a `PinScreen` en modo verify | Navegación a `/wear/pin/verify` | — |

### Conclusión

El módulo de autenticación Wear OS implementa las cuatro medidas de seguridad requeridas: almacenamiento seguro con SHA-256 + SecureStorage, guard de ruteo con GoRouter, bloqueo por intentos fallidos y expiración de sesión. No se identificaron vulnerabilidades residuales. La biometría se incluye como mecanismo de autenticación alternativo cuando el dispositivo lo soporta. El módulo está listo para su uso en producción con las configuraciones de timeout y límite de intentos actuales.
