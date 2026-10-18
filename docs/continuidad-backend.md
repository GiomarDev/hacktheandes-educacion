# Continuidad del backend

Relevo de Claude a Codex, 17 de octubre de 2026. Rama: `feat/backend-fundacion`.

## Alcance recuperado

El [plan de fundación](superpowers/plans/2026-10-17-backend-fundacion-auth-siagie.md) comprende 13 tareas para `ms-auth` y `ms-siagie`. Después del relevo se implementó **F2 — ms-alerta**, según su [plan](superpowers/plans/2026-10-17-ms-alerta.md) y [contratos de API](ms-alerta.md). **F3 — ms-simon** continúa con reportes, planes cifrados y visitas, según su [plan](superpowers/plans/2026-10-17-ms-simon.md) y [contratos](ms-simon.md). **F4 — ms-escale** lo continuó Claude según su [plan](superpowers/plans/2026-10-17-ms-escale.md) y [contratos](ms-escale.md). El frontend y la puesta en marcha se describen al final.

Al iniciar el relevo, las tareas 1–12 ya estaban en Git; el último commit era `8feaff1`. La tarea 13 tenía archivos sin commit: seeds de ambos servicios, IDs compartidos, resumen del estudiante y prueba entre servicios. El registro local de Claude está en `.superpowers/sdd/2026-10-17-backend-fundacion-auth-siagie/progress.md` (ignorado por Git).

| Tareas | Resultado recuperado |
| --- | --- |
| 1–3 | Monorepo, esquemas de identidad, llaves cifradas y JWKS |
| 4–6 | Login, bloqueo por intentos, refresh rotativo, logout, cambio de contraseña y guard JWT compartido |
| 7–9 | Modelo escolar, DRE/UGEL/IE y usuarios con roles y alcance |
| 10–12 | Secciones, estudiantes, matrícula, asistencia, notas y acceso por QR |
| 13 | Seeds, resumen auditado, integración y documentación completados; carga en schemas reales pendiente de confirmación |

El plan original menciona Jest y ESLint. La implementación adoptó **Vitest + Supertest y oxlint**. Usar los scripts de `package.json` y el README vigente.

## Correcciones del relevo

- Modificar una matrícula histórica ya no revoca el carné del año actual. La prueba de regresión reprodujo primero la revocación indebida entre IEs. Corrección guardada en `0c7c5ba`.
- Reactivar una matrícula requiere que no exista una matrícula vigente en otra IE. La regresión reprodujo el `200` indebido antes de exigir `409`.
- Carné, ingreso manual y resumen usan exclusivamente la matrícula del año calendario actual en Lima. Una matrícula pasada o futura no habilita estas operaciones.
- El resumen calcula asistencia diaria, excluye registros por hora, devuelve notas del periodo y registra `VIEW_STUDENT` después de autorizar la lectura. Una IE ajena recibe `403`.
- Repetir el seed no cambia contraseñas ni desbloquea usuarios existentes. Se comprueba que no se dupliquen usuarios, roles, estudiantes, apoderados, matrículas, secciones ni periodos.
- El builder SWC anterior emitía las apps sin `libs/common`; el JavaScript compilado fallaba con `ERR_MODULE_NOT_FOUND`. Se usa el builder Rspack de Nest con sus dependencias oficiales y una comprobación del arranque de ambos ejecutables. Corrección guardada en `fdedc20`.
- Se eliminó `@nestjs/mau`, una herramienta de despliegue sin uso, que originaba cinco alertas transitivas de npm. No se aplicaron actualizaciones forzadas.
- Se agregaron pruebas de la protección de URLs de test y scripts para ejecutar la suite completa, el build y el arranque compilado.

## Skills y herramientas

Se verificó la existencia de las **17 skills** de `skills-lock.json` en `.agents/skills/`. Las 16 skills de diseño/desarrollo visual tienen además una copia coincidente de `SKILL.md` en `.claude/skills/`; `chofex-hackathon` está disponible desde `.agents/skills/` y el catálogo de Codex.

- Stitch: `design-md`, `enhance-prompt`, `site-md`, `taste-design`, `stitch-loop`, generación, sistema de diseño, extracción y subida de HTML, React y React Native.
- Interfaz y video: `react-vite-dashboard`, `shadcn-ui`, `remotion`.
- Evento: `chofex-hackathon` para trámites y entregas del hackathon cuando se soliciten.

Las skills están disponibles; **no se expusieron herramientas MCP de Stitch en esta sesión**. Antes de iterar diseños, conectar Stitch. El plan antiguo referencia `superpowers:*`; esas skills no figuran en el catálogo de esta sesión. No se requiere instalar nada de ello para ejecutar los scripts de backend actuales.

## Verificación

Usar los comandos de la sección Backend del README. Las pruebas e2e comparten tablas y deben ejecutarse de manera secuencial. Los seeds y las pruebas de integración de este relevo se ejecutan exclusivamente contra `auth_test` y `siagie_test`; los schemas reales no se siembran sin confirmación explícita.

La primera ejecución registró 39 pruebas unitarias aprobadas y 87 e2e aprobadas; tres nuevas regresiones fallaron como se esperaba antes de corregirlas. Las 20 pruebas dirigidas a QR, resumen e integración pasaron después de las correcciones.

Resultado del relevo de fundación del 17/10/2026, antes de F2:

| Verificación | Resultado |
| --- | --- |
| `npm run lint` | Sin errores; incluye apps, librerías, scripts y configuración de tests |
| `npm run typecheck` | Sin errores; incluye también ambos seeds |
| `npm test` | 43 pruebas aprobadas en 10 archivos |
| `npm run test:e2e` | 94 pruebas aprobadas en 16 archivos; ningún test saltado |
| `npm run build` | Ambos servicios compilados con Rspack |
| `npm run test:smoke` | Ambos ejecutables arrancan y responden `/health`; procesos detenidos al terminar |
| Auditoría npm tras retirar Mau | 0 vulnerabilidades reportadas |
| Formato y `git diff --check` | Sin errores en los archivos modificados |

Las migraciones de los schemas reales se consultaron **sin modificar datos** mediante `prisma migrate status`: `auth` (2 migraciones) y `siagie` (1 migración) están actualizados. La carga de demo en esos schemas sigue pendiente.

## Continuación F2 — ms-alerta

Implementado un tercer servicio NestJS/Prisma en puerto 3002. Incluye las siete reglas iniciales, alertas filtradas por ámbito, caso único abierto por estudiante e IE, bitácora, contacto simulado y respuesta familiar idempotente. El escalamiento resuelve dirección, psicólogo/comité y UGEL mediante la API interna de auth.

SIAGIE guarda eventos de asistencia, acceso y notas en una outbox transaccional. Alerta recibe referencias en una inbox persistente y consulta evidencia mediante HTTP interno; no lee schemas ajenos ni replica nombres o teléfonos. Los workers reintentan tras fallos, conservan registros y revalidan las preferencias del apoderado. `ConsoleProvider` solo imprime IDs técnicos.

Migraciones nuevas: `apps/ms-siagie/prisma/migrations/20261018000000_event_outbox` y `apps/ms-alerta/prisma/migrations/20261018000000_init`. **Aplicadas solo a `siagie_test` y `alerta_test`**. El estado real de migraciones descrito arriba corresponde al relevo anterior; para poner F2 en marcha sobre schemas reales hay que aplicar estas dos migraciones primero, siguiendo el README. No se ejecutaron seeds de usuarios/alumnos reales.

Se ampliaron la protección de URLs de test y la prueba de arranque a los tres servicios. Resultado de la suite completa: **55 pruebas unitarias y 111 de integración aprobadas**, sin saltos. Se conservó el contrato existente de `/internal/schools/:id` y se separó el contexto adicional en las nuevas rutas de riesgo.

Después del último ajuste, la suite específica de F2 pasó **18 de 18 pruebas**, incluida la cancelación de mensajes al cerrar un caso. La cobertura verificada suma **55 unitarias + 94 e2e de fundación + 18 e2e de F2 = 167 pruebas únicas**. Tipos, lint y compilación de los tres servicios sin errores. El arranque compilado de los tres procesos devuelve `/health` correctamente.

Los escenarios verificados incluyen entrega repetida y simultánea sin duplicados, caída de alerta sin perder el pase de lista, reintento de inbox, permisos de IE y UGEL, cambio de responsable, psicólogo disponible, consentimiento revocado, avisos de ingreso/salida, nota sin asistencia, cierre y respuesta tardía, y restricciones de destinatarios en PostgreSQL. La prueba de arranque se ejecuta por separado de las suites e2e, porque iniciar alerta también inicializa reglas globales faltantes.

## Continuación F3 — ms-simon

Cuarto servicio NestJS/Prisma en puerto 3003, con schema propio `simon`. Genera cuatro tipos de reporte a partir de APIs internas de SIAGIE y Alerta; dirección envía y UGEL revisa/observa con control de revisión e independencia respecto al remitente. Los agregados no incluyen datos personales ni diagnóstico. Las limitaciones de cobertura y las instantáneas actuales se declaran en el payload.

Planes únicos por estudiante/año, contexto de matrícula y asignaciones validado en SIAGIE, diagnóstico cifrado AES-256-GCM con clave independiente y contexto autenticado. Solo tutor asignado, psicología y dirección lo leen, con auditoría; secretaría/docentes asignados reciben datos sin diagnóstico. Versiones manuales por bimestre, colaboración docente y aprobación exclusiva del tutor, comprobando la fecha de la versión leída. Planes archivados y versiones aprobadas inmutables. Visitas con docente validado, observador fijo y transiciones auditadas de observación a devolución.

Migración `apps/ms-simon/prisma/migrations/20261018010000_init`: **aplicada exclusivamente a `simon_test`**. Sin migraciones ni carga de demo nuevas en schemas reales. Protección de URLs de prueba y comprobación de arranque ampliadas a cuatro servicios. El detalle de APIs y límites está en [ms-simon.md](ms-simon.md).

Verificación dirigida: **73 unitarias y 13 e2e de F3 aprobadas**, sin saltos. Lint, tipos y compilación de los cuatro servicios correctos. La primera ejecución unitaria dentro del sandbox no pudo abrir el servidor local JWKS; la repetición con acceso a red aprobó las 73 pruebas. **Suite completa: 125 e2e aprobadas en 18 archivos**, sin saltos (94 de fundación + 18 de F2 + 13 de F3). Junto con las 73 unitarias, son **198 pruebas únicas**. Los cuatro ejecutables compilados arrancan y responden `/health`; los procesos se detienen al terminar la prueba. Formato y `git diff --check` correctos.

## Continuación F4 — ms-escale

Relevo de Codex a Claude, 17 de octubre de 2026. Antes de continuar se verificó lo que dejó Codex en `1ab813f`: lint, tipos, 73 pruebas unitarias, build, arranque de los cuatro ejecutables y 125 e2e. Todo pasó, sin tests saltados.

ms-escale es el quinto servicio NestJS/Prisma, en el puerto 3004 con schema `escale`.
- **Importación:** recibe los CSV oficiales de `docs/` y evita importar dos veces el mismo archivo comparando su sha256. Un archivo con errores responde 400 y no se guarda nada.
- **Totales:** se comprobó que los totales nacionales cuadran con `desercion_por_region_siagie_2023_2024.csv`: secundaria 72 282 / 2 842 831 y primaria 64 463 / 3 721 852.
- **Agregados:** calcula un agregado diario por IE con datos de SIAGIE y Alerta, y a partir de ahí tres indicadores mensuales por UGEL: asistencia, aulas en silencio y casos contactados.
- **Acceso:** los indicadores oficiales los ve cualquier usuario autenticado; los calculados, solo MINEDU y los especialistas dentro de su ámbito.

Cambios en otros servicios, todos compatibles con lo existente:
- SIAGIE: `GET /internal/escale/schools`.
- Alerta: el reporte interno ahora devuelve también `currentlyContactedOpenCases`.

Una revisión independiente de F4 no encontró nada crítico y sí cuatro puntos importantes. Los cuatro se corrigieron con TDD:
- El periodo es obligatorio al importar el CSV de SIAGIE.
- Ese CSV debe traer todas las regiones, y Lima no puede aparecer entera y dividida a la vez.
- `POST /stats/compute` no calcula hoy ni fechas futuras, y al recalcular un día pasado se conservan sus casos.
- Los días fuera de los periodos académicos no cuentan como aulas en silencio.

Hallazgos menores (resueltos en el relevo del 17/10 por la noche, ver abajo):
- Columnas de periodo repetidas y sin tope en el CSV de ESCALE.
- Dos importaciones o cálculos simultáneos responden con un 409 genérico.
- Un día que falla no se reintenta solo después de la medianoche.
- Hay que confirmar que `prisma migrate dev` no intente quitar el `NULLS NOT DISTINCT` del índice único.

Verificación final: lint, tipos y build de los cinco servicios sin errores; **91 unitarias** en 16 archivos y **141 e2e** en 20 archivos, sin tests saltados (125 previas + 16 de F4); los cinco ejecutables compilados arrancan y responden `/health`.

Migración `apps/ms-escale/prisma/migrations/20261018020000_init`: **aplicada solo a `escale_test`**. La URL de `escale_test` se deriva de `SIMON_TEST_DATABASE_URL` cuando falta `ESCALE_TEST_DATABASE_URL`. Para correr el servicio sobre el schema real hay que agregar `ESCALE_DATABASE_URL` al `.env`; los marcadores ya están en `.env.example`.

## Frontend — Amauti (antes Centinela Escolar)

Claude implementó `apps/web` a partir del [bosquejo de Claude Design](https://claude.ai/artifact/UT5n57ZJPMv7sX4mY3XqhB), siguiendo su [plan](superpowers/plans/2026-10-17-frontend-centinela.md). Las pantallas cubren tres grupos de usuarios: el portal docente (Hoy, pase de lista, ficha del estudiante), dirección (Escuela) y los especialistas o MINEDU (Panorama). Además hay centro de alertas, detalle de caso con bitácora y contacto simulado, reportes SIMON con envío y revisión, y fuentes de datos para importar los CSV.

Los datos visibles salen de las APIs. Lo que el bosquejo mostraba sin respaldo en el backend se reemplazó por datos reales:
- El score de ML, los pesos SHAP y los textos de heladas o infraestructura pasaron a ser alertas por regla y asistencia.
- Las cifras nacionales inventadas pasaron a ser la deserción SIAGIE y ESCALE importada.

La cabecera dice "Piloto · Hack the Andes" en lugar de "Gobierno del Perú · Ministerio de Educación", para no presentarnos como esa institución.

Cambios de backend que pidió el frontend, cada uno con sus pruebas e2e:
- `GET /sections`: secciones a cargo de cada usuario.
- `GET /attendance`: asistencia diaria de una sección por rango.
- `GET /internal/staff/:userId/sections`.

Correcciones de seguridad que reportó la revisión automática del push: el personal de aula solo lee fichas, nóminas, alertas y casos de sus secciones.

`npm run demo:stack` levanta la demo completa sobre los schemas `_test`: los limpia, siembra datos sintéticos, genera 10 días de asistencia, importa los CSV y calcula indicadores. Mientras corre, no se pueden ejecutar las suites e2e. También se corrigieron los scripts `*:seed`: tsx no aplicaba los decoradores porque el `tsconfig` raíz tiene `"files": []`.

Verificación del frontend:
- 15 pruebas: cliente con renovación única del token, roles, shell, pase de lista y escala del mapa.
- Tipos y build sin errores.
- Recorrido visual con Playwright a 1440 px y 390 px con los roles de tutor, UGEL y dirección: login, pase de lista guardado, alertas, caso, panorama, escuela y reporte generado.

## Continuación — relevo del 17/10/2026 (noche)

Se retomó la rama en otra máquina con Node 26 (nvm). npm 11 bloquea los scripts de instalación sin `allowScripts`; se ejecutan con `npm rebuild` sin tocar `package.json`.

Puesta en marcha, con autorización explícita del responsable:
- Migraciones aplicadas en los schemas reales: `siagie` (outbox), `alerta`, `simon`, `escale` y el índice nuevo de `auth`.
- Seeds sintéticos ejecutados en `auth`, `siagie` y `alerta` reales (10 usuarios, una IE con 2 secciones y 60 estudiantes, reglas iniciales).
- CSV oficiales importados en `escale` real.

Correcciones:
- Test de nómina desactualizado: desde `9bafa39` el docente sin carga en la sección recibe 403.
- F4, los cuatro hallazgos menores: periodos repetidos, no consecutivos o más de 40 rechazados; importaciones y cálculos mensuales serializados con candado (el duplicado responde "Este archivo ya fue importado"); el job reintenta días fallidos hasta una semana; se confirmó que `migrate diff` no ve diferencias con el índice `NULLS NOT DISTINCT`, así que `migrate dev` no lo quita.
- Seguridad: dos refresh simultáneos del mismo token dejaban vigente el token nuevo del ganador. La rotación de cada familia ahora va bajo un candado transaccional. Solo se reproducía con una base rápida (falla 5/5 antes, pasa 5/5 después).
- La demo reintenta el login del admin antes de cargar indicadores.
- `apps/web/vite.config.ts` declara `process`: el build aislado (Docker, CI) no tenía `@types/node`.

Nuevo backend:
- ms-auth: límite de login por IP (20 fallos en 15 minutos → 429 con `Retry-After`, contado en `auth_events`); `TRUST_PROXY` para leer `X-Forwarded-For`; `GET /users` lista cuentas por IE, UGEL o DRE según el ámbito.
- ms-siagie: `GET /schools/:id/periods`, `GET /sections/:id/areas` y `GET /grades` (registro de un área, sección y periodo).

Nuevo frontend: registro de notas (`/notas`), reporte bimestral, planes de apoyo (`/planes`), visitas de monitoreo (`/visitas`) y administración de cuentas, roles y reglas (`/admin`); menú "Más" en el móvil. Recorrido en Chrome como docente, tutor y dirección: notas guardadas y recalculadas, plan creado, versión aprobada y plan activado, visita agendada, observada y con devolución, reporte bimestral generado; sin scroll horizontal a 390 px.

Despliegue y CI: `deploy/` (imagen única de backend, nginx con el build estático, compose en el puerto 8080) verificado con Docker sobre los schemas reales y los jobs apagados; `.github/workflows/ci.yml` con Postgres propio.

Verificación final contra un PostgreSQL 17 local (el servidor compartido da `SocketTimeout` intermitentes en suites largas): lint y tipos sin errores, **100 unitarias**, **171 e2e en 22 archivos** y arranque compilado de los cinco servicios; frontend con 21 pruebas y build de producción.

## Amauti y recorrido de bienvenida (18/10/2026)

- Mascota Amauti integrada en `apps/web/src/mascot/` desde la exportación del equipo (motor SVG + GSAP sin cambios de lógica; estilos propios en `amauti-theme.css`). Nueva dependencia del frontend: `gsap` 3.15.0.
- Recorrido por rol (`apps/web/src/onboarding/`), generado desde `navFor` para que coincida siempre con la navegación. Estado en `users.onboarded_roles` (migración `20261018040000_onboarded_roles`): **aplicada en `auth_test` y en el PostgreSQL local de CI; falta aplicarla en `auth` real** antes de desplegar este frontend (sin ella el recorrido simplemente no aparece).
- Mejoras de diseño tomadas de las skills del repo (`taste-design`, `react-vite-dashboard`): Geist + Geist Mono en lugar de Inter, esqueletos en lugar de spinners, estados vacíos con la mascota, entrada escalonada de cada pantalla, respuesta táctil en botones, login a dos columnas y grillas sin desborde en el móvil en todas las pantallas.
- El bundle del frontend pasó de 144 a 186 kB comprimidos por GSAP; dividir el código por ruta queda como mejora.

## Pendientes ordenados

1. **Validación de dominio:** confirmar el código oficial del estudiante y el cálculo oficial de notas. La moda con desempate por la columna más reciente es una decisión provisional del plan; la pantalla de notas lo advierte.
2. **Despliegue real:** elegir el servidor o la nube, HTTPS delante de nginx y la gestión de secretos. Las imágenes y el compose ya están listos; falta publicarlas (registro de contenedores) y definir quién aplica las migraciones en cada versión.
3. **Operación:** respaldos de la base `school`, monitoreo de `/health` y alertas por fallas de los jobs.
4. **Frontend, mejoras:** importar el calendario de periodos (hoy los crea el seed), restablecer contraseñas desde administración y crear reglas nuevas (hoy solo se editan las existentes).
5. **Servidor compartido:** las suites e2e largas contra `panel.keoit.com` sufren timeouts de red; para una corrida completa conviene un PostgreSQL local, como en CI.
