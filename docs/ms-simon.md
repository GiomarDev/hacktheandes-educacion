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

## Documentos generados desde WhatsApp

La plataforma prepara documentos (sesiones, informes, actas, registros) a partir de los mensajes de WhatsApp del docente. El docente los revisa en el módulo **Documentos** y los marca como aprobados o no aprobados. **Por ahora solo se guarda el registro**: nombre, categoría, formato, estado y los datos del archivo corregido (nombre, tipo, tamaño y fecha). El contenido de los archivos todavía no se almacena.

| Método y ruta | Cuerpo o resultado | Acceso |
| --- | --- | --- |
| `POST /internal/documents` | `schoolId`, `ownerUserId`, `title` (1–200), `category?` (≤80), `format` (`WORD` o `EXCEL`) → documento en `PENDING` | Agente de WhatsApp, con `x-internal-key`; nginx no la expone |
| `GET /documents?status=` | Documentos propios; dirección ve los de su IE | Autenticado |
| `POST /documents/:id/review` | `{ "status": "APPROVED" \| "REJECTED" }`; se puede cambiar la decisión | Solo el docente dueño |
| `POST /documents/:id/correction` | `fileName` (.docx, .doc, .xlsx, .xls o .pdf), `mimeType`, `sizeBytes` (≤ 20 MB) | Solo el dueño y solo si el documento está `REJECTED` (si no, 409) |

En el frontend, un documento no aprobado ofrece la descarga en Word (`.docx` y `.doc`) o en Excel (`.xlsx`) y una casilla para arrastrar y soltar el documento corregido. Mientras no se almacenen los originales, la descarga es una plantilla generada en el navegador con los datos del registro.

Migración `20261018060000_generated_documents`. `npm run simon:seed` crea 10 documentos de demo para los docentes sintéticos (los incluye `demo:stack`).

### Recordatorios de revisión (Atomic Memory, opcional)

Cuando el docente no aprueba un documento, puede guardar un recordatorio breve para revisar los próximos documentos del mismo tipo (por ejemplo, «verificar que las competencias del CNEB estén al inicio»). El recordatorio se guarda en [Atomic Memory](https://docs.atomicstrata.ai) y se usa en el flujo existente de **Documentos**:

- aparece en las tarjetas de los documentos de ese tipo que están por revisar;
- se agrega, rotulado como ayuda de revisión, a la plantilla de corrección que se descarga en Word (`.docx`, `.doc`) o Excel (`.xlsx`);
- la lista «Tus recordatorios de revisión» permite verlos, corregirlos (volviendo a guardar en un documento del mismo tipo) u olvidarlos.

**No cambia el contenido de los documentos que prepara Amauti.** El agente de WhatsApp no vive en este repositorio y todavía no consume los recordatorios; para eso queda una ruta interna opcional que un agente externo tendría que integrar.

| Método y ruta | Cuerpo o resultado | Acceso |
| --- | --- | --- |
| `GET /documents/preferences` | `{ status: "disabled" }`, `{ status: "unavailable" }` o `{ status: "available", preferences: [{ id, category, instruction, savedAt }] }` | Autenticado; solo los del usuario del token |
| `POST /documents/:id/preference` | `{ "instruction": "…" }` (3–280 caracteres) → recordatorio guardado para la categoría del documento | Solo el docente dueño del documento |
| `DELETE /documents/preferences/:preferenceId` | `204` | Solo si el recordatorio está en la memoria del propio usuario |
| `GET /internal/documents/preferences?ownerUserId=&category=&title=` | Igual que el `GET` anterior, por búsqueda semántica en la memoria del docente | Gancho opcional para un agente externo, con `x-internal-key`; sin consumidor en este repositorio |

- **Apagado por defecto.** Solo se activa con `ATOMICMEMORY_ENABLED=true`, `ATOMICMEMORY_API_URL` (Cloud: `https://api.atomicstrata.ai`) y `ATOMICMEMORY_API_KEY` (llave de proyecto `amc_…`, solo en el servidor; nunca en `apps/web`). `ATOMICMEMORY_TIMEOUT_MS` es opcional (2500 por defecto). Sin ellas no se hace ninguna llamada y la interfaz no muestra nada nuevo.
- **Aislamiento.** El sujeto de memoria es `amauti-docente:<id del usuario>`, tomado del JWT (o del `ownerUserId` de la ruta interna con llave); nunca de un campo del cliente web. No se envía `session_id` (en Cloud reemplaza al sujeto) ni `namespace` (solo filtra búsquedas). Todas las llamadas usan `source_site=amauti-documentos`, y las respuestas se vuelven a filtrar por sujeto, fuente y formato aunque el proveedor ignore algún filtro.
- **Un recordatorio por tipo de documento.** Se guarda en modo literal (`/v1/memories/ingest/quick`, `skip_extraction`, `content_class: summary`) con `metadata.externalId`; volver a guardarlo para la misma categoría lo reemplaza.
- **Confirmaciones.** Solo se informa «guardado» si el recibo trae el ID creado o actualizado; un 2xx vacío o que no es JSON responde `503`. El borrado acepta `200` o `204` sin cuerpo y rechaza un `success: false` explícito.
- **Datos personales.** Los recordatorios son del docente, no de los estudiantes: se rechaza el texto con secuencias de 8 o más dígitos (DNI, teléfonos) y la interfaz pide no escribir nombres. Los logs solo registran método, ruta y estado, nunca el texto ni la llave.
- **Fallos.** Si Atomic Memory falla o supera el tiempo límite, guardar o borrar responde `503` indicando que no se guardó/borró; las consultas responden `status: "unavailable"`. La revisión, las descargas y las correcciones no dependen de Atomic Memory.
- **Pruebas.** `apps/ms-simon/test/document-preferences.e2e-spec.ts` usa un **fixture HTTP local** (`apps/ms-simon/test/atomic-memory-fixture.ts`) que imita las rutas documentadas; no es el servicio real.
