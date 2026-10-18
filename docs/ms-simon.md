# ms-simon — reportes, planes de apoyo y monitoreo

Servicio NestJS en puerto 3003; Prisma usa el schema propio `simon`. Las referencias de SIAGIE se validan por HTTP interno y no tienen FK entre schemas. No se consultan tablas de otros servicios. La primera iteración es manual: no llama a un modelo de IA.

## Preparación y verificación

Configurar `SIMON_DATABASE_URL`, `SIMON_TEST_DATABASE_URL`, `SIMON_DATA_ENCRYPTION_SECRET`, `SIAGIE_URL`, `ALERTA_URL`, `AUTH_JWKS_URL` e `INTERNAL_API_KEY` según `.env.example`. La clave del diagnóstico debe contener 32 bytes aleatorios codificados en base64, ser independiente de la clave de identidad y conservarse para poder leer los registros. El arranque falla si no tiene la longitud requerida. Esta versión no implementa rotación de claves.

Ejecutar `npm run simon:generate` antes de compilar. `npm run start:simon` inicia desarrollo y `npm run start:simon:prod` ejecuta el build. `/health` público devuelve `{ "status": "ok", "service": "ms-simon" }`.

`npm run test:e2e:simon` migra exclusivamente los cuatro schemas de prueba y comprueba los flujos con JWT real de auth, SIAGIE y Alerta. No correr suites e2e simultáneas ni la prueba de arranque junto a ellas. `npm run test:smoke`, después del build y de las suites, arranca y detiene los cuatro ejecutables.

La migración de F3 se ha verificado en `simon_test`. Para habilitar el servicio sobre el schema real, aplicar `prisma migrate deploy --config apps/ms-simon/prisma.config.ts` cuando se autorice esa puesta en marcha. No hay seed propio de SIMON: sus fuentes son los registros de SIAGIE y Alerta.

## Contrato HTTP

Todas las rutas siguientes requieren `Authorization: Bearer <accessToken>`. Los cuerpos rechazan campos no declarados, incluidos datos calculados, actores y aprobaciones. IDs UUID; año entre 1900 y 2100. Las listas admiten `schoolId`, `year`, `limit` (1–100; por defecto 50) y `offset` (por defecto 0), orden estable. Los filtros se aplican dentro del ámbito del usuario.

### Reportes

| Método y ruta | Cuerpo o resultado | Acceso |
| --- | --- | --- |
| `POST /reports/generate` | `schoolId`, `year`, `type`, `month` o `periodId` | Dirección o secretaría de la IE |
| `GET /reports` | Lista de reportes del ámbito | Dirección, secretaría, UGEL, DRE o MINEDU |
| `GET /reports/:id` | Reporte y estado de revisión | Los mismos roles, en su ámbito |
| `POST /reports/:id/submit` | `revision` actual | Dirección de la IE |
| `POST /reports/:id/review` | `revision`, `status: REVIEWED` u `OBSERVED`, `notes` | Especialista UGEL de la IE, diferente del remitente |

Tipos: `MONTHLY_FOLLOWUP`, `ATTENTION_GOAL`, `DROPOUT_JUSTIFICATION` requieren `month` y excluyen `periodId`; `BIMESTER_ATTENDANCE` requiere `periodId` de un bimestre de la misma IE/año y excluye `month`. El mes o bimestre debe haber empezado. El rango termina como máximo en la fecha actual de Lima. Los tipos comparten un payload agregado con los datos necesarios para presentar cada reporte; todavía no se exportan plantillas oficiales ni PDF.

Ejemplo de generación:

```json
{ "schoolId": "<UUID_IE>", "year": 2026, "type": "MONTHLY_FOLLOWUP", "month": 3 }
```

El servidor calcula `payload`: rango y zona horaria, instantáneas de SIAGIE y Alerta, y notas sobre cobertura. Incluye matrículas totales/vigentes, meta de atención, secciones, días de sección con reporte, asistencia diaria por estado, porcentaje entre registros recibidos, bajas con/sin justificación (solo conteos), distribución de notas, alertas, casos, contactos, acciones, estados de notificaciones y respuestas. El promedio de días hasta el primer contacto usa tiempo transcurrido; considera casos abiertos en el rango y contactados antes de su cierre temporal. No incluye nombres, DNI, teléfonos, motivos textuales de baja ni diagnósticos.

Límites de interpretación:

- Matrícula y estado de casos son fotografías actuales, con `snapshotAt`; no reconstruyen estados históricos. Se cuentan bajas cuyo último cambio de estado cayó en el rango.
- Asistencia usa únicamente filas diarias (`classSessionId = null`). Los registros por hora quedan excluidos. Días sin reporte no cuentan como ausencias; una tasa sin registros vale 0 y se distingue por `observedEnrollmentDays = 0`.
- Las notas pertenecen a periodos que se superponen al rango. El reporte bimestral restringe al periodo solicitado.
- Los límites de timestamps siguen el día completo de Lima (UTC−05), mientras las fechas escolares usan columnas DATE. Las dos fuentes se consultan por separado y cada una declara su hora de captura; no existe una transacción distribuida.
- Los cuatro tipos son reportes de gestión del prototipo, no una certificación del cálculo o formulario oficial del MINEDU.

Una misma IE/año/tipo/mes o periodo conserva su ID. Generar nuevamente un borrador u observado actualiza los datos, vuelve a `DRAFT` e incrementa `revision`. Enviar o revisar también incrementa la revisión. Un reporte `SUBMITTED` o `REVIEWED` no puede regenerarse. UGEL puede observar con nota obligatoria; dirección puede reenviar o regenerar el observado. Un número de revisión obsoleto o una transición inválida produce `409`. No se permite revisar el propio envío aunque la cuenta tenga ambos roles. Las transiciones se serializan con un bloqueo transaccional y se auditan. Si una fuente falla, no se guarda un reporte parcial.

### Planes de apoyo

| Método y ruta | Cuerpo o resultado |
| --- | --- |
| `POST /support-plans` | `schoolId`, `studentId`, `year`, `barriers`, `diagnosis?`, `strengths?` |
| `GET /support-plans` | Planes visibles, siempre sin diagnóstico |
| `GET /support-plans/:id` | Plan, versiones y diagnóstico solo si corresponde |
| `PATCH /support-plans/:id` | `barriers`, `diagnosis?`, `strengths?` |
| `PATCH /support-plans/:id/status` | `status: ACTIVE` o `ARCHIVED` |
| `POST /support-plans/:id/versions` | `periodId`, `goals`, `adjustments`, `strategies`, `progressNotes?` |
| `PATCH /support-plans/:id/versions/:versionId` | `goals`, `adjustments`, `strategies`, `progressNotes?` |
| `POST /support-plans/:id/versions/:versionId/approve` | `expectedUpdatedAt` obtenido al leer la versión |

Un plan por estudiante/año. La creación requiere matrícula `ENROLLED` en esa IE/año. El tutor se obtiene de la sección, nunca del cuerpo. La asignación se consulta de nuevo en cada operación; un tutor o docente de otra sección no hereda acceso por pertenecer al mismo colegio.

| Rol | Lectura del plan | Diagnóstico | Edición base/estado | Redactar versiones | Aprobar |
| --- | --- | --- | --- | --- | --- |
| Tutor asignado | Sí | Sí | Sí | Sí | Sí |
| Psicología y dirección de la IE | Sí | Sí | Sí | Sí | No |
| Docente asignado | Sí | Omitido | No | Sí | No |
| Secretaría de la IE | Sí | Omitido | No | No | No |
| Auxiliar, otros docentes y autoridades territoriales | No | No | No | No | No |

Diagnóstico AES-256-GCM, nonce aleatorio por escritura y contexto autenticado que vincula plan, IE, estudiante y año. El dato guardado es `v1.iv.tag.ciphertext`; nunca se devuelve `diagnosisEncrypted`. Crear/editar devuelve el plan sin diagnóstico; una lectura autorizada de detalle lo descifra y guarda `PLAN_DIAGNOSIS_READ` antes de responder. Una clave errónea o un ciphertext alterado produce `503` genérico. Las listas y reportes nunca descifran este campo. `diagnosis` omitido conserva el valor al editar; una cadena vacía permite quitar el contenido sin admitir `null` ni datos de aprobación del cliente.

Barreras, fortalezas y texto pedagógico de las versiones deben contener información necesaria para el acompañamiento. El diagnóstico reservado debe escribirse en su campo específico, pues los textos pedagógicos se comparten con los lectores autorizados del plan.

`goals` y `strategies` son listas no vacías de textos; `adjustments` puede ser una lista vacía. Máximo 30 entradas por lista y 2000 caracteres por entrada. Una versión por bimestre, con numeración consecutiva dentro del plan. Solo bimestres de la misma IE/año; siempre `generatedBy: HUMAN` y `aiModel: null`. La versión aprobada es inmutable. La aprobación verifica `expectedUpdatedAt` bajo el mismo bloqueo que la edición: si el contenido cambió, devuelve `409` para que el tutor lo revise. Activar exige al menos una versión aprobada. Archivar impide nuevas modificaciones, versiones y aprobaciones. No hay borrado físico.

La paginación de planes examina hasta `limit` registros del ámbito y luego verifica la asignación vigente. Puede devolver menos elementos; `offset` avanza por registros examinados, no por el número visible. Si SIAGIE no responde, la autorización falla sin devolver datos.

### Visitas

| Método y ruta | Cuerpo o resultado |
| --- | --- |
| `POST /monitoring-visits` | `schoolId`, `sectionId`, `observedTeacherUserId`, `visitedAt` ISO con zona, `protocolVersion` |
| `GET /monitoring-visits` | Visitas visibles; `year` usa el calendario de Lima |
| `GET /monitoring-visits/:id` | Detalle según ámbito y participante |
| `PATCH /monitoring-visits/:id` | `status` y contenido de la etapa |

Dirección, UGEL, DRE y MINEDU pueden agendar en su ámbito. Se valida sección de la IE, año de visita y docente/tutor asignado. El observador es la cuenta que agenda. Dirección y autoridades del ámbito pueden consultar; el docente observado puede leer su propia visita. Otros docentes y secretaría no leen la devolución. La lista filtra por participante después de paginar, con la misma semántica de registros examinados que planes.

Solo el observador original actualiza. `SCHEDULED → DONE` requiere `observations` y que la fecha haya ocurrido. `DONE → FEEDBACK_GIVEN` exige `feedback` e `improvementCommitment`; conserva las observaciones previas. No se pueden saltar etapas ni reescribir una devolución final. Cambios auditados dentro de la misma transacción.

## APIs internas de las fuentes

Requieren `x-internal-key`, sin JWT. No exponerlas directamente al cliente web.

- SIAGIE: `GET /internal/simon/students/:id?schoolId=&year=` devuelve matrícula, sección y asignaciones sin datos identificativos de la persona; `GET /internal/simon/sections/:id` y `GET /internal/simon/periods/:id` validan referencias.
- SIAGIE: `GET /internal/simon/reports?schoolId=&year=&from=&to=&periodId=` devuelve agregados escolares.
- Alerta: `GET /internal/simon/reports?schoolId=&from=&to=` devuelve agregados del seguimiento.

Las fuentes validan fechas reales, orden y pertenencia a un mismo año. Errores de referencia: `404`; consulta incompatible: `400`; autorización: `403`; duplicado, cambio de revisión o transición inválida: `409`; contexto no disponible: `503`. El cliente interno tiene un límite de cinco segundos por solicitud.
