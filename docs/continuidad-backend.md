# Continuidad del backend

Relevo de Claude a Codex, 17 de octubre de 2026. Rama: `feat/backend-fundacion`.

## Alcance recuperado

El [plan de fundación](superpowers/plans/2026-10-17-backend-fundacion-auth-siagie.md) comprende 13 tareas para `ms-auth` y `ms-siagie`. La [especificación](superpowers/specs/2026-10-17-backend-microservicios-design.md) incluye después `ms-alerta`, `ms-simon` y `ms-escale`. Estos tres servicios y el frontend aún no están implementados.

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

Resultado final del 17/10/2026:

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

## Pendientes ordenados

1. **Carga de demo en schemas reales:** paso 4 de la tarea 13. Requiere confirmación explícita; no es requisito para probar ni desarrollar sobre los schemas de test.
2. **F2 — ms-alerta:** redactar el plan de implementación con eventos internos de SIAGIE, reglas de riesgo, alertas, casos, escalamiento y proveedor de notificaciones por consola. Prueba objetivo: tres faltas → alerta → caso → borrador/mensaje simulado → respuesta → contacto registrado.
3. **F3 — ms-simon:** reportes mensuales y de meta de atención; planes de apoyo manuales y control de información sensible.
4. **F4 — ms-escale:** importar CSV oficiales del repositorio y construir agregados e indicadores verificables por UGEL.
5. **Frontend:** recuperar los prototipos que el README menciona bajo `STICH_ITERATION_1/` (esa carpeta no está en este checkout), conectar Stitch y construir la interfaz sobre APIs verificadas.
6. **Operación:** definir despliegue, CI y limitación por IP de autenticación. La limitación por cuenta ya existe; la limitación por IP quedó diferida en el registro de Claude.
7. **Validación de dominio:** confirmar código oficial del estudiante y cálculo oficial de notas. La moda con desempate por última columna es una decisión provisional del plan, no una regla oficial validada.
8. **Entorno:** al actualizar el runtime, elegir una versión de Node admitida por las herramientas del CLI; Node 25.8.1 produce advertencias de engines en Angular Devkit aunque las verificaciones del proyecto funcionan.
