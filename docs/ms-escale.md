# ms-escale — indicadores y datos abiertos

Servicio NestJS en el puerto 3004 con su propio schema `escale`. Hace dos cosas:

- Importa los CSV oficiales de deserción que están en `docs/`.
- Calcula agregados diarios por IE e indicadores mensuales por UGEL.

Los datos de SIAGIE y Alerta los pide por HTTP interno (`x-internal-key`) y no lee tablas de otros servicios. No guarda datos personales: solo conteos por IE y por territorio.

## Preparación y verificación

**Variables de entorno:**
- `ESCALE_DATABASE_URL` con `schema=escale`.
- `SIAGIE_URL`, `ALERTA_URL`, `AUTH_JWKS_URL` e `INTERNAL_API_KEY`.

`ESCALE_TEST_DATABASE_URL` es opcional. Si falta, las pruebas usan la URL de `SIMON_TEST_DATABASE_URL` con `schema=escale_test`, para no repetir la contraseña en el `.env`. La protección de `test/test-databases.ts` aborta si la URL resultante no apunta a `escale_test`.

**Comandos:**
- `npm run escale:generate`: genera el cliente de Prisma. Correrlo antes de compilar.
- `npm run start:escale`: arranca en modo desarrollo.
- `npm run start:escale:prod`: ejecuta el build.
- `npm run test:e2e:escale`: ejecuta las pruebas e2e con auth, SIAGIE y Alerta reales sobre los schemas de prueba.

`/health` es público y devuelve `{ "status": "ok", "service": "ms-escale" }`.

La migración `apps/ms-escale/prisma/migrations/20261018020000_init` crea las tablas y el catálogo de indicadores. **Solo está aplicada en `escale_test`.** Para el schema real hay que correr `npx prisma migrate deploy --config apps/ms-escale/prisma.config.ts` cuando se autorice. ms-escale no tiene seed: los indicadores oficiales se cargan con `POST /imports`.

## Indicadores

| Código | Fuente | Ámbito | Periodo |
| --- | --- | --- | --- |
| `DROPOUT_RATE_SEC_SIAGIE` | Oficial: `desercion_por_region_siagie_2023_2024.csv` | Nacional y 25 regiones | El del archivo, por ejemplo `2023-2024` |
| `DROPOUT_RATE_PRI_SIAGIE` | Oficial: el mismo archivo | Nacional y 25 regiones | El del archivo |
| `DROPOUT_RATE_SEC_ESCALE` | Oficial: `tasa_desercion_secundaria_escale.csv` | Nacional por sexo, área y gestión, y 26 regiones | `2013-2014` a `2024-2025` |
| `ATTENDANCE_RATE` | Calculado | UGEL | `YYYY-MM` |
| `SILENT_SECTIONS_RATE` | Calculado | UGEL | `YYYY-MM` |
| `CASES_CONTACTED_RATE` | Calculado | UGEL | `YYYY-MM` |

**Códigos de territorio (`geoCode`):**
- Regiones: el código de departamento del ubigeo, por ejemplo `25` para Ucayali.
- Lima en ESCALE se divide en `15LM` (Lima Metropolitana) y `15LP` (Lima Provincias).
- Total nacional: `00`.
- UGEL: el código de UGEL que registra SIAGIE.

Los CSV de ESCALE perdieron las letras con tilde (por ejemplo, "Apurmac" o "Pblica"). El importador reconoce esos nombres comparando tanto sin tildes como sin caracteres no ASCII.

**Totales nacionales.** El total nacional del archivo SIAGIE se calcula como la suma de las regiones y conserva numerador y denominador. Por eso el archivo debe traer todas las regiones; Lima va entera o como Lima Metropolitana más Lima Provincias, nunca de las dos formas. Si no se cumple, la importación responde 400. Los totales de `docs/` son:

| Nivel | Desertores | Estudiantes | Tasa |
| --- | --- | --- | --- |
| Secundaria | 72 282 | 2 842 831 | 2.5426 % |
| Primaria | 64 463 | 3 721 852 | 1.7320 % |

Esto cumple la verificación de F4: los totales importados cuadran con el CSV. La prueba e2e lo comprueba contra las cifras de arriba y contra la suma recalculada del archivo.

**Cómo se calculan los indicadores por UGEL.** Se usan los agregados del mes:
- `ATTENDANCE_RATE` = (presentes + tardanzas) / registros diarios. "Presentes" incluye las salidas anticipadas y el denominador incluye las faltas justificadas, igual que la tasa de SIAGIE.
- `SILENT_SECTIONS_RATE` = secciones-día sin pase de lista / secciones-día esperadas. Son las "aulas en silencio".
- `CASES_CONTACTED_RATE` = casos abiertos con primer contacto familiar / casos abiertos, tomados del último día calculado del mes.

Si el denominador es 0, no se publica valor.

## Contrato HTTP

Todas las rutas requieren `Authorization: Bearer <accessToken>`, salvo `/health`. Los cuerpos rechazan campos no declarados.

| Método y ruta | Cuerpo o consulta | Acceso |
| --- | --- | --- |
| `POST /imports` | `dataset` (`DROPOUT_BY_REGION_SIAGIE` o `DROPOUT_RATE_SECONDARY_ESCALE`), `fileName` (`*.csv`), `content` (texto del CSV, hasta 2 MB), `period?` (`2023-2024`), `name?`, `sourceUrl?` | MINEDU_ADMIN |
| `GET /imports` | Historial de importaciones con checksum | MINEDU_ADMIN |
| `GET /indicator-definitions` | Catálogo con fórmula, unidad y fuente | Cualquier usuario autenticado |
| `GET /indicators` | Filtros `code`, `geo_level`, `geo_code`, `period`, `dimension` (`none` = solo totales) | Oficiales: cualquier usuario autenticado. Calculados: MINEDU, o un especialista de UGEL o DRE dentro de su ámbito |
| `POST /stats/compute` | `{ "date": "YYYY-MM-DD" }`, un día ya terminado → `{ date, skipped, schools, computed, failed, outOfSession }` | MINEDU_ADMIN |

**Respuestas de `POST /imports`:**
- `201 { id, dataset, fileName, rowCount, values }`.
- El CSV de SIAGIE no trae columna de periodo: se toma de `period` o del nombre del archivo (`…_2023_2024.csv`). Sin ninguno de los dos responde 400, para no guardar un año nuevo con la etiqueta de otro.
- `400` si el CSV está mal formado, faltan regiones, la región es desconocida, hay filas repetidas o un porcentaje no cuadra con desertores/estudiantes (tolerancia de 0.01). En ese caso no se guarda nada.
- `409` si el archivo ya se importó (mismo sha256).

Una importación nueva reemplaza, dentro de una transacción, los valores de sus indicadores en los periodos que trae. Así se publica un archivo corregido.

`GET /indicators` devuelve los números como `number`, con `numerator` y `denominator` para auditar el cálculo, y `computedAt`. Los valores de ESCALE no traen conteos (`null`); los de SIAGIE y los calculados sí.

## Agregados diarios

`school_daily_stats` guarda una fila por IE y día con matrícula activa, asistencia, secciones esperadas y reportadas, y casos abiertos y contactados. Las fuentes son:
- SIAGIE: `GET /internal/escale/schools?date=` (incluye `inSession`: si la fecha cae dentro de un periodo académico de la IE) y `GET /internal/simon/reports`.
- Alerta: `GET /internal/simon/reports`, que ahora también devuelve `currentlyContactedOpenCases`.

**Job diario:**
- Revisa cada hora y calcula una vez por día el día anterior (hora de Lima).
- Volver a calcular un día es idempotente: actualiza las filas existentes.
- Solo se calculan días ya terminados: hoy o una fecha futura responden 400.
- Las IEs fuera de sus periodos académicos (vacaciones, o IE sin periodos configurados) se cuentan en `outOfSession` y no generan filas: no son aulas en silencio.
- Los casos abiertos y contactados son el estado actual de Alerta. Por eso solo se guardan al crear la fila o al calcular el día de ayer; recalcular un día anterior conserva los que se guardaron entonces.
- Si una fuente falla, la IE se cuenta como `failed` y no se borra lo ya calculado. El job vuelve a intentar cada hora mientras ese día siga siendo "ayer"; pasada la medianoche ese día ya no se reintenta solo y hay que usar `POST /stats/compute`.
- `BACKGROUND_JOBS_ENABLED=false` lo desactiva.

**Límites conocidos:**
- Se omiten sábados, domingos y días fuera de los periodos académicos. Los feriados nacionales dentro de un bimestre todavía no se descuentan.
- `sectionsTotal` cuenta todas las secciones del año, incluso las que no tienen matrícula activa.
- Faltan indicadores de IE, distrito y DRE, y el tablero del director.
