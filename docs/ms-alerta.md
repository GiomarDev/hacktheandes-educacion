# ms-alerta — API y operación F2

Puerto por defecto: **3002**. Schema propio: `alerta`; tests: `alerta_test`. Migración de SIAGIE adicional: `20261018000000_event_outbox`. Migración de alerta: `20261018000000_init`.

Las migraciones de esta fase se verifican en los schemas de prueba. Para usar las nuevas escrituras de asistencia, notas y acceso sobre un entorno existente, aplicar primero la migración de outbox de SIAGIE y la inicial de alerta siguiendo el README. No se sembraron cuentas ni alumnos en los schemas reales.

## Contratos públicos

Todas estas rutas exigen `Authorization: Bearer <accessToken>` emitido por ms-auth. Se aplican ámbitos de IE, UGEL, DRE y MINEDU.

| Ruta | Uso |
| --- | --- |
| `GET /health` | Público; salud del proceso |
| `GET /alerts?schoolId=&status=&limit=&offset=` | Alertas del ámbito; límite de 1 a 100 |
| `PATCH /alerts/:id` | `{ "status": "ACKNOWLEDGED" }`, `RESOLVED` o `DISMISSED`; responsable o autoridad |
| `GET /cases?schoolId=&status=&limit=&offset=` | Casos del ámbito |
| `GET /cases/:id` | Caso con alertas, últimas 100 acciones, notificaciones y respuestas |
| `POST /cases/:id/actions` | Bitácora; responsable o autoridad |
| `POST /cases/:id/send-message` | Encolar contacto simulado con apoderados habilitados |
| `GET /rules` | Reglas globales y del ámbito |
| `POST /rules` | Regla nueva; MINEDU para globales, director para su IE |
| `PATCH /rules/:id` | Ajustar `params`, `severity` o `isActive` sin cambiar tipo ni ámbito |

Una llamada a `send-message` lleva un UUID `requestId` que el cliente reutiliza si reintenta el mismo envío:

```json
{
  "requestId": "01920000-0000-7000-8000-000000000401",
  "body": "La IE desea conversar para acompañar la asistencia de su estudiante."
}
```

`body` es opcional: se usa un texto neutro de acompañamiento si se omite. Un `requestId` ya utilizado con otro texto devuelve `409`. Si no hay apoderados habilitados, devuelve `422` sin generar una notificación. Se respeta `receivesAlerts`; WhatsApp exige además `whatsappOptIn` y preferencia `WHATSAPP`. SMS requiere preferencia `SMS`. Una preferencia `CALL` no se convierte en envío escrito.

Acciones manuales: `NOTE`, `CALL`, `MEETING`, `REFERRAL_PSYCHOLOGIST`, `REFERRAL_DEMUNA`, `REFERRAL_CEM`, `REFERRAL_JUNTOS` y `STATUS_CHANGE`; todas requieren `notes` no vacía (hasta 2000 caracteres). Solo `STATUS_CHANGE` lleva `status`: `CONTACTING`, `REFERRED`, `CLOSED_RETURNED`, `CLOSED_TRANSFERRED` o `CLOSED_DROPPED_OUT`. Un cierre exige motivo de hasta 250 caracteres, registra `closedAt` y resuelve las alertas abiertas del caso. No se reabre por una respuesta tardía.

El contacto familiar pasa de `OPEN` a `CONTACTING` al encolar el mensaje y a `CONTACTED` con una respuesta verificable del proveedor simulado. Las llamadas registradas no inventan una respuesta ni completan `firstContactAt`.

Al cerrar el caso, sus entregas pendientes quedan en `FAILED` con motivo de cancelación y se excluyen de los reintentos. Se conserva el historial de mensajes ya enviados.

## Reglas iniciales

| Código | Parámetros | Evidencia |
| --- | --- | --- |
| `ABSENCES_3_IN_10` | `count: 3`, `windowSchoolDays: 10` | Faltas del día; ignora marcas por hora y faltas justificadas |
| `CONSECUTIVE_ABSENCES_3` | `count: 3`, `windowSchoolDays: 10` | Tres días escolares efectivamente reportados con ausencia |
| `LATE_3_IN_10` | `count: 3`, `windowSchoolDays: 10` | Tres tardanzas diarias |
| `SECTION_SILENT` | `{}` | Sección con matriculados y ningún reporte del día después de las 13:00 en Lima |
| `GRADE_LOW_ATTENDANCE` | `minAttendanceRate: 50` | Nota `AD` o `A` con porcentaje de asistencia menor al umbral |
| `LEFT_WITHOUT_EXIT` | `{}` | Marca `LEFT_EARLY` sin evento de salida en esa IE y fecha |
| `ATTENTION_GOAL_GAP` | `minGap: 1` | Meta menos asistentes, después del corte y con todas las listas diarias completas |

Estos umbrales son decisiones de la demo, no reglas oficiales del MINEDU. Los días escolares se aproximan por lunes a viernes; no se descuentan feriados ni vacaciones. Las reglas de IE son adicionales a las globales; configurar una regla propia no desactiva reglas globales.

Las reglas globales faltantes se crean al iniciar el servicio; no se sobrescriben las que ya se modificaron o desactivaron. `npm run alerta:seed` permite inicializarlas explícitamente con el mismo comportamiento idempotente.

Una alerta activa por regla, estudiante y sección conserva y actualiza la evidencia del episodio. Hay como máximo un caso abierto por estudiante e IE (índice parcial de PostgreSQL). El cierre de un caso no vuelve a abrirlo al reevaluar exactamente la misma evidencia.

## Responsables y plazos

La sección determina el responsable inicial: auxiliar si existe, o tutor. Sin contacto y con plazo vencido, se escala a dirección (nivel 1), psicólogo disponible o dirección como comité (nivel 2), y especialista UGEL (nivel 3). Los responsables se resuelven por API interna de ms-auth entre usuarios activos. Si no se encuentra uno, el caso conserva su estado y plazo vencido para reintento, con aviso técnico en logs.

Cada plazo dura dos días hábiles a la misma hora de Lima. Un intento de llamada, una reunión o un contacto encolado renueva el plazo. Una nota aislada no lo renueva. Un caso `CONTACTED`, `REFERRED` o cerrado no escala por falta de contacto. No se inventa un diagnóstico ni se usan modelos de IA para clasificar a la familia; `classifiedReason` es un dato opcional del simulador.

## Eventos y rutas internas

Estas rutas usan `x-internal-key: INTERNAL_API_KEY`, sin JWT de usuario. El webhook de demo **exige autenticación interna**; no es una integración de WhatsApp Cloud.

| Servicio | Ruta | Uso |
| --- | --- | --- |
| SIAGIE | `POST /internal/events/dispatch` | Reintentar eventos pendientes de outbox |
| SIAGIE | `GET /internal/risk/sections?date=YYYY-MM-DD` | Evidencia de asistencia, notas y salidas, sin nombres ni teléfonos |
| SIAGIE | `GET /internal/risk/sections/:id?date=` | Evidencia de una sección |
| SIAGIE | `GET /internal/risk/grades/:id?date=` | Contexto de una nota del periodo |
| SIAGIE | `GET /internal/risk/access/:id` | Contexto de un evento de puerta |
| SIAGIE | `GET /internal/students/:id/contact-context?schoolId=` | IDs y preferencias de apoderados de una matrícula vigente |
| Auth | `GET /internal/staff?schoolId=&ugelId=` | IDs de dirección, psicólogos y especialistas disponibles |
| Alerta | `POST /internal/events` | Persistir evento en inbox y responder `202` |
| Alerta | `POST /internal/jobs/run` | Procesar inbox, evaluar reglas, escalar casos y entregar avisos |
| Alerta | `POST /webhooks/notifications` | Registrar respuesta simulada idempotente |

Evento sin datos personales:

```json
{
  "id": "01920000-0000-7000-8000-000000000402",
  "type": "ATTENDANCE_RECORDED",
  "resourceId": "01920000-0000-7000-8000-000000000010",
  "date": "2026-10-16"
}
```

Tipos: `ATTENDANCE_RECORDED` referencia sección, `ACCESS_RECORDED` referencia evento de puerta y `GRADE_RECORDED` referencia nota del periodo. El ID del evento no se puede reutilizar con otro tipo, recurso o fecha. El receptor consulta la fuente de verdad en SIAGIE; no confía en evidencia ni datos personales enviados por el productor.

Respuesta simulada, usando el `providerMessageId` de una notificación enviada al apoderado:

```json
{
  "providerEventId": "01920000-0000-7000-8000-000000000403",
  "providerMessageId": "console:<uuid-de-notificacion>",
  "rawText": "Podemos coordinar su regreso a clases.",
  "classifiedReason": "FAMILY"
}
```

La misma respuesta devuelve el registro ya existente; reutilizar `providerEventId` con otro contenido o notificación devuelve `409`. No se aceptan respuestas para mensajes inventados ni para notificaciones internas a personal.

## Entrega y recuperación

Asistencia, notas y accesos se guardan junto con su evento en la misma transacción de SIAGIE. No se llama a alerta durante la escritura del docente. Outbox e inbox persisten intentos, errores, fecha de próximo intento y una concesión temporal para que dos workers no reclamen el mismo registro.

Con `BACKGROUND_JOBS_ENABLED=true` (por defecto), cada minuto se entrega outbox y se procesa inbox, escalamiento y notificaciones. La evaluación global ocurre cada hora. Los errores se reintentan sin borrar datos; outbox usa espera exponencial de uno a sesenta minutos. `BACKGROUND_JOBS_ENABLED=false` desactiva temporizadores; las rutas internas permiten pruebas deterministas.

`ConsoleProvider` devuelve un ID estable `console:<id>`. Solo imprime el UUID de la notificación, nunca destinatarios, texto, respuesta familiar ni datos del menor. Los avisos de ingreso/salida van al apoderado habilitado y al auxiliar por `IN_APP`. Antes de cada intento, incluso después de un fallo, se revalida el consentimiento.

La demo procesa tandas de hasta 50 entregas y 100 escalamientos. Antes de producción se necesita calendario escolar real, estrategia de paginación del contexto de SIAGIE, observabilidad operativa y un proveedor externo con autenticación e idempotencia propias.
