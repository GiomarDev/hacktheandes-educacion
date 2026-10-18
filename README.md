# hacktheandes-educacion

Proyecto del equipo **Futuro Agéntico** (KeoIT) para el reto de **Educación Escolar** de [Hack the Andes](https://hacktheandes.com).

El proyecto aborda la problemática de la **deserción escolar y el bajo rendimiento académico** en el sistema educativo peruano, transformando diagnósticos reactivos y burocráticos en un sistema proactivo asistido por agentes de Inteligencia Artificial que conecta a docentes, directivos y decisores gubernamentales con intervenciones tempranas y oportunas.

## Backend

Implementados `ms-auth`, `ms-siagie`, `ms-alerta`, `ms-simon` y `ms-escale`: autenticación JWT RS256/JWKS, roles con alcance territorial, matrícula, asistencia, notas, carné QR, resumen auditado y seguimiento de riesgos con contacto familiar simulado, reportes, planes de apoyo cifrados y visitas, e indicadores de deserción oficiales y calculados por UGEL. Estado del relevo, verificación y próximas fases en [Continuidad del backend](docs/continuidad-backend.md). Contratos de [F2 — alertas](docs/ms-alerta.md), [F3 — reportes y planes](docs/ms-simon.md) y [F4 — indicadores](docs/ms-escale.md).

### Preparación

Se recomienda Node.js 26 (con nvm: `nvm install 26 && nvm use 26`). npm 11 no ejecuta los scripts de instalación de las dependencias sin un `allowScripts` en `package.json`; `npm rebuild` los ejecuta (Prisma, argon2, SWC, esbuild) sin modificar ese archivo. Haz lo mismo en `apps/web`.

```sh
npm ci && npm rebuild
cp .env.example .env
# Completar las variables del .env antes de continuar.
npm run auth:generate
npm run siagie:generate
npm run alerta:generate
npm run simon:generate
npm run escale:generate
```

Cada servicio usa su propio schema en la base PostgreSQL `school`. Las variables `AUTH_DATABASE_URL`, `SIAGIE_DATABASE_URL`, `ALERTA_DATABASE_URL`, `SIMON_DATABASE_URL` y `ESCALE_DATABASE_URL` apuntan a `auth`, `siagie`, `alerta`, `simon` y `escale`; sus equivalentes `*_TEST_DATABASE_URL`, exclusivamente a `auth_test`, `siagie_test`, `alerta_test`, `simon_test` y `escale_test` (si falta `ESCALE_TEST_DATABASE_URL`, las pruebas derivan `escale_test` de la URL de prueba de SIMON). Configurar `KEY_ENCRYPTION_SECRET` y `SIMON_DATA_ENCRYPTION_SECRET` (claves independientes de 32 bytes en base64), `INTERNAL_API_KEY` y `SEED_PASSWORD`. Las contraseñas de las URL deben codificarse para URL, por ejemplo `$` como `%24`.

La base `school` debe existir. `npm run db:create` crea ese recurso si falta; requiere autorización sobre el servidor compartido. Para aplicar migraciones existentes:

```sh
npx prisma migrate deploy --config apps/ms-auth/prisma.config.ts
npx prisma migrate deploy --config apps/ms-siagie/prisma.config.ts
npx prisma migrate deploy --config apps/ms-alerta/prisma.config.ts
npx prisma migrate deploy --config apps/ms-simon/prisma.config.ts
npx prisma migrate deploy --config apps/ms-escale/prisma.config.ts
```

Para crear una migración durante desarrollo: `npm run auth:migrate -- --name descripcion`, `npm run siagie:migrate -- --name descripcion`, `npm run alerta:migrate -- --name descripcion` `npm run simon:migrate -- --name descripcion` o `npm run escale:migrate -- --name descripcion`.

### Demo sintética

Los seeds crean 10 usuarios, una IE de demostración en Ucayali, dos secciones, cuatro bimestres de **2026**, 60 estudiantes y sus apoderados. Usan UUID compartidos y pueden repetirse sin duplicar filas; el seed de identidad conserva las contraseñas y el estado de cuentas existentes. No se envían mensajes reales a los contactos de demo.

**Ejecutar sobre los schemas reales solo con confirmación explícita del responsable:**

```sh
npm run auth:seed
npm run siagie:seed
```

Los DNI de demo están en `libs/fixtures/src/seed-ids.ts`; dirección usa `70000102`, secretaría `70000103` y auxiliar `70000108`. La contraseña inicial es el valor de `SEED_PASSWORD`. El seed representa el año 2026; al cambiar de año se deben preparar las matrículas del nuevo año para consultar resúmenes y usar el control de acceso.

### Desarrollo y ejecución compilada

En cuatro terminales:

```sh
npm run start:auth
npm run start:siagie
npm run start:alerta
npm run start:simon
npm run start:escale
```

Por defecto escuchan en 3000, 3001, 3002, 3003 y 3004. Configurar `AUTH_JWKS_URL=http://localhost:3000/.well-known/jwks.json`, `AUTH_URL=http://localhost:3000`, `SIAGIE_URL=http://localhost:3001` y `ALERTA_URL=http://localhost:3002`. `PORT` permite cambiar el puerto de cada proceso.

```sh
npm run build
# En terminales separadas:
npm run start:auth:prod
npm run start:siagie:prod
npm run start:alerta:prod
npm run start:simon:prod
npm run start:escale:prod
```

La compilación usa Rspack, el [builder de monorepos de Nest](https://docs.nestjs.com/recipes/swc), para incluir `libs/common` y los clientes Prisma generados. `/health` devuelve `{ "status": "ok", "service": "ms-auth" }` (o `ms-siagie`/`ms-alerta`/`ms-simon`/`ms-escale`).

### Verificación

```sh
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
npm run test:smoke
```

La suite e2e aplica migraciones y limpia únicamente los schemas de prueba. No ejecutar dos suites e2e simultáneamente, ya que comparten tablas. `npm run test:e2e:auth`, `npm run test:e2e:siagie`, `npm run test:e2e:cross`, `npm run test:e2e:alerta`, `npm run test:e2e:simon` y `npm run test:e2e:escale` permiten verificaciones parciales. La prueba entre servicios realiza un login real, comprueba el aislamiento entre IEs, el resumen auditado, la repetición de los seeds y el funcionamiento de JWT en caché cuando `ms-auth` se apaga. F2 comprueba tres faltas → caso → contacto simulado → respuesta familiar, además de escalamiento, consentimiento y reintentos. F3 verifica reportes contrastados con registros sintéticos, permisos y cifrado del diagnóstico, versiones aprobadas por tutor y transiciones de visitas. F4 importa los CSV de `docs/` y comprueba que los totales nacionales cuadren con el archivo de SIAGIE, y calcula agregados diarios e indicadores por UGEL con SIAGIE y Alerta reales. La prueba de arranque utiliza las cinco URL de prueba y detiene los procesos al terminar.

---

## Frontend: Amauti

`apps/web` (React 19, Vite, TanStack Query, React Router y Tailwind) implementa el [bosquejo de Claude Design del equipo](https://claude.ai/artifact/UT5n57ZJPMv7sX4mY3XqhB) conectado a los cinco microservicios. Los datos mostrados vienen de las APIs: el score de ML y otras cifras del bosquejo sin respaldo se reemplazaron por datos reales con su fuente.

Los accesos dependen del rol y del ámbito asignado; el servidor comprueba los permisos de cada operación. Las cuentas concretas de la demo y sus límites aparecen más abajo.

Demo local completa, con datos sintéticos en los schemas `_test`, sin tocar los reales:

```sh
npm run build
npm run demo:stack          # migra, siembra, genera asistencia y arranca los 5 servicios (Ctrl+C detiene)
npm --prefix apps/web ci    # una vez
npm run web:dev             # http://localhost:5173
```

Si el puerto 5173 está ocupado, Vite usa el siguiente libre (lo indica al arrancar). En desarrollo, Vite enruta `/api/<servicio>` a los puertos 3000–3004, así que el backend no necesita CORS. `npm run web:test` corre las pruebas del frontend y `npm run web:build` genera `apps/web/dist`.

### Cuentas y roles para probar

Demo publicada: **https://amauti.keoit.com** · local: **http://127.0.0.1:5173/**.

**Contraseña de todas las cuentas de demo: `Demo-Escuela-2026`** (es el `SEED_PASSWORD` de la demo; ingresa con el DNI de la tabla). Son cuentas y datos sintéticos: no reutilizar esta contraseña en otro sistema ni cargar datos reales en la demo. Los diez accesos y sus roles se comprobaron contra `/auth/login` y `/auth/me`; el [resultado de la verificación](docs/testing/2026-10-18-demo-data.json) no contiene contraseñas ni tokens.

| DNI sintético | Rol de la cuenta    | Ámbito y recorrido sugerido                                                                                                                                                       |
| ------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `70000100`    | `MINEDU_ADMIN`      | Nacional. Panorama, escuelas, indicadores oficiales/calculados, reportes, visitas, administración y **Fuentes** para importar CSV.                                                |
| `70000101`    | `UGEL_SPECIALIST`   | UGEL Coronel Portillo. Panorama y escuelas del ámbito, revisión de reportes enviados, visitas y administración del ámbito.                                                        |
| `70000102`    | `DIRECTOR`          | IE de demo. Escuela, aulas, lectura de notas, alertas/casos, generación y envío de reportes, planes con diagnóstico, visitas y administración de la IE.                           |
| `70000103`    | `SECRETARY`         | IE de demo. Escuela, aulas, lectura de notas, generación de reportes y planes sin diagnóstico. No tiene acceso a alertas, visitas ni administración.                              |
| `70000104`    | `TUTOR` + `TEACHER` | Tutor de 1.º A. Hoy, Mi aula, asistencia, notas y alertas de sus secciones, planes y visitas propias. Como tutor asignado puede leer el diagnóstico y aprobar versiones del plan. |
| `70000105`    | `TUTOR` + `TEACHER` | Tutor de 1.º B. Mismo recorrido del tutor anterior, en su sección.                                                                                                                |
| `70000106`    | `TEACHER`           | Matemática, 1.º A y B. Asistencia, alertas, edición de notas de su área, colaboración en versiones de planes y visitas propias. Sin acceso al diagnóstico ni aprobación del plan. |
| `70000107`    | `TEACHER`           | Comunicación, 1.º A y B. Mismos accesos del docente anterior, con edición de notas de Comunicación.                                                                               |
| `70000108`    | `AUXILIAR`          | 1.º A y B. Hoy, Mi aula, asistencia y alertas/casos de sus secciones. Sin notas, planes, reportes, visitas ni administración.                                                     |
| `70000109`    | `PSYCHOLOGIST`      | IE de demo. Escuela, alertas/casos y planes con diagnóstico. La aprobación de versiones corresponde al tutor asignado.                                                            |

En las cuentas de tutor se puede cambiar entre Tutoría y Docente desde el selector de rol. `DRE_SPECIALIST` está implementado, pero esta demo no siembra una cuenta DRE. Para probar aislamiento, comparar los tutores A y B; para probar restricciones, comparar secretaría, auxiliar y dirección. Los DNI y las asignaciones se definen en `libs/fixtures/src/seed-ids.ts` y en los seeds de identidad/SIAGIE.

### Datos oficiales y datos de demostración

La demo importa los siguientes CSV del repositorio en ESCALE. Se verificó su checksum y cada valor expuesto por la API, incluidos numerador y denominador cuando existen:

| Fuente documentada                                                                                                                  | Cobertura                                                                                 | Valores comprobados |
| ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------: |
| [Deserción SIAGIE por región](docs/desercion_por_region_siagie_2023_2024.md), [CSV](docs/desercion_por_region_siagie_2023_2024.csv) | 25 regiones y totales nacionales, primaria/secundaria, 2023–2024                          |                  52 |
| [Tasa de deserción ESCALE](docs/reporte_desercion_escale.md), [CSV](docs/tasa_desercion_secundaria_escale.csv)                      | Secundaria, 2013–2014 a 2024–2025; total nacional, regiones y desagregaciones disponibles |                 396 |

Son **448 valores oficiales contrastados con los archivos existentes**, no una actualización en línea ni datos escolares de 2026. El total SIAGIE de secundaria es 72 282 / 2 842 831 (2,5426 %) y el de primaria 64 463 / 3 721 852 (1,732 %). No confundir la serie ESCALE redondeada con la tasa calculada a partir de los conteos SIAGIE.

La IE, cuentas, estudiantes, apoderados, matrícula y asistencia son **sintéticos**. Los indicadores diarios/mensuales calculados desde esos registros también son de demostración. No se cargaron expedientes reales de estudiantes o familias. Las tablas de notas, planes, reportes y visitas se completan mediante los flujos de la demo; pueden comenzar vacías.

Con la demo ya en ejecución, comprobar servicios, diez cuentas y los dos datasets:

```sh
npm run demo:verify
```

Este comando no vacía tablas, no ejecuta seeds y no importa archivos faltantes. Crea sesiones temporales para verificar los accesos, las cierra al terminar y guarda evidencia sin secretos en `docs/testing/AAAA-MM-DD-demo-data.json`. Si falta un CSV, lo indica para importarlo desde **Fuentes** con la cuenta MINEDU. **No ejecutar las suites e2e ni `demo:stack` de nuevo mientras se está usando la demo**: limpian los mismos schemas `_test`.

### Estado de la validación responsive

La verificación de datos y cuentas está completada. La revisión visual del diseño actual sigue **pendiente**: el navegador de Codex bloqueó el origen local mediante un permiso guardado. El control de la propia app para cambiar sus permisos también está bloqueado por la herramienta. El responsable debe permitir `http://127.0.0.1:5173` en **Configuración → Navegador → Permisos del agente**. Los recorridos visuales históricos del proyecto no validan el rediseño tipográfico actual.

Una vez permitido el origen, revisar login y los recorridos de las cuentas anteriores a 320, 390, 768 y 1440 píxeles, además de zoom al 200 %. Comprobar navegación móvil y menú Más, filtros, formularios, lista de asistencia, tablas de notas y reportes, planes, visitas y administración. La página debe permitir leer y operar los controles sin desplazamiento horizontal global; las tablas extensas pueden tener desplazamiento dentro de su contenedor. Registrar capturas y resultados antes de dar la revisión por aprobada.

### Amauti y recorrido de bienvenida

Amauti, la mascota del proyecto (un lápiz animado con GSAP, en `apps/web/src/features/mascot/`), acompaña la aplicación: saluda en el login, duerme en los estados vacíos y celebra al guardar asistencia, generar un reporte, aprobar un plan o registrar la devolución de una visita. Se puede arrastrar, sigue el cursor con los ojos y se muestra u oculta desde la cabecera (la preferencia queda en el navegador; en el móvil arranca oculta). Respeta `prefers-reduced-motion`.

La primera vez que alguien entra con un rol, Amauti lo guía paso a paso por los accesos de ese rol, resaltando cada uno. ms-auth guarda qué roles ya vieron el recorrido (`GET`/`POST /auth/onboarding`, `DELETE /auth/onboarding/:role`), así que no se repite en otro dispositivo; el botón de brújula de la cabecera lo vuelve a abrir.

### Despliegue con Docker

`deploy/backend.Dockerfile` construye una imagen para los cinco servicios (la variable `SERVICE` elige cuál arranca) y `deploy/web.Dockerfile` sirve el build estático con nginx, que enruta `/api/<servicio>` como el proxy de Vite, bloquea las rutas `/internal` y `/webhooks` y pasa la IP del cliente a ms-auth para el límite de login por IP (`TRUST_PROXY`).

```sh
docker compose -f deploy/compose.yml up --build      # http://localhost:8080, con las bases y secretos del .env
docker compose -f deploy/compose.yml run --rm auth npx prisma migrate deploy --config apps/ms-auth/prisma.config.ts   # migraciones, una por servicio
```

### Integración continua

`.github/workflows/ci.yml` corre en cada push y pull request: lint, tipos, pruebas unitarias, build, e2e y arranque compilado contra un PostgreSQL propio del job (sin tocar el servidor compartido), pruebas y build del frontend, y el build de ambas imágenes. Los secretos de cifrado se generan en cada ejecución.

---

### Diseño y tipografía

Amauti usa Source Sans 3 y Source Serif 4 de Adobe, servidas localmente, con iconos Phosphor seleccionados mediante `better-icons`. El [prompt](docs/design/2026-10-18-prompt-amauti.md) y las [decisiones de diseño y fuentes](docs/design/2026-10-18-tipografia-amauti.md) documentan la investigación de servicios públicos, permisos y verificación. La conexión opcional a un proyecto web de Adobe Fonts se configura en `apps/web/.env.local` a partir de `apps/web/.env.example`; sin kit la aplicación funciona con las fuentes locales.

## 🎯 Problema, Diagnóstico y Oportunidad

A partir de un proceso exhaustivo de análisis cuantitativo oficial y validación cualitativa en campo, se identificaron los siguientes ejes críticos:

1. **Repunte y brecha territorial en la deserción escolar**:
   - Según las series oficiales del portal **ESCALE (MINEDU)**, la tasa de deserción interanual en secundaria se sitúa en **2.7%** (periodo 2024-2025) con un cierre proyectado al **2.8%** hacia 2026.
   - Existe una severa disparidad territorial: el ámbito rural alcanza el **3.7%** frente al **2.4%** urbano, y regiones de la Amazonía como **Loreto (5.9%)**, **Huánuco (5.0%)** y **Ucayali (4.9%)** duplican el promedio nacional.

2. **Desafíos estructurales en logros de aprendizaje**:
   - Las evaluaciones estandarizadas de la **UMC (MINEDU)** evidencian que una fracción significativa de estudiantes se concentra en los niveles *En Inicio* y *Previo al Inicio* en competencias fundamentales de Lectura y Matemáticas tanto en 2.°/4.° de primaria como en 2.° de secundaria.
   - El rendimiento académico y la permanencia escolar están estrechamente correlacionados: el bajo rendimiento y la extraedad son los predictores individuales de mayor peso para el abandono.

3. **Limitaciones operativas de la plataforma actual (Alerta Escuela)**:
   - **Alta latencia de datos**: Depende de reportes bimestrales en SIAGIE; cuando el semáforo alerta riesgo rojo, el estudiante a menudo ya acumula semanas de inasistencia.
   - **Acceso restringido y fatiga burocrática**: Solo los directores tienen acceso a la plataforma; los docentes deben llenar formularios manuales que no incentivan la acción.
   - **Brecha entre el diagnóstico y la acción**: El sistema cataloga el nivel de riesgo, pero carece de herramientas automatizadas para que el docente implemente planes de tutoría, adapte contenidos o active comunicación ágil con las familias.

---

## 📚 Investigaciones y Evidencia Técnica Consolidada

El repositorio integra investigaciones profundas originadas en el proceso de análisis agéntico:

### 1. [Tasa de Deserción Escolar en Secundaria (MINEDU / ESCALE)](conversation://4f3431b9-6593-44dc-a0ec-32f7eb960bde)
* **Documentación técnica:** [`docs/reporte_desercion_escale.md`](file:///d:/Augusto/personal_portfolio/hacktheandes-educacion/docs/reporte_desercion_escale.md)
* **Datos y tablero interactivo:**
  - Dataset CSV procesado: [`docs/tasa_desercion_secundaria_escale.csv`](file:///d:/Augusto/personal_portfolio/hacktheandes-educacion/docs/tasa_desercion_secundaria_escale.csv)
  - Visualizador interactivo local: [`docs/desercion_interactiva.html`](file:///d:/Augusto/personal_portfolio/hacktheandes-educacion/docs/desercion_interactiva.html)
* **Aspectos clave:** Decodificación del Cuadro 321 de ESCALE, análisis de la fórmula matemática oficial ($TD_t$) y algoritmo de procesamiento Stata de la Unidad de Estadística Educativa (UEE).

### 2. [Estadísticas Oficiales de Rendimiento Académico y Logros de Aprendizaje](conversation://e3f99f5d-89df-4926-bc82-816b7e876738)
* **Documentación técnica:** [`docs/reporte_rendimiento_academico_oficial_peru.md`](file:///d:/Augusto/personal_portfolio/hacktheandes-educacion/docs/reporte_rendimiento_academico_oficial_peru.md)
* **Datos y tablero interactivo:**
  - Base de datos consolidada (2016-2025): [`docs/rendimiento_academico_escale.json`](file:///d:/Augusto/personal_portfolio/hacktheandes-educacion/docs/rendimiento_academico_escale.json)
  - Tablero web interactivo: [`docs/rendimiento_interactivo.html`](file:///d:/Augusto/personal_portfolio/hacktheandes-educacion/docs/rendimiento_interactivo.html)
  - Microdatos por indicadores:
    - Cuadro 121: Aprobación primaria ([`docs/aprobacion_primaria_cuadro_121.csv`](file:///d:/Augusto/personal_portfolio/hacktheandes-educacion/docs/aprobacion_primaria_cuadro_121.csv))
    - Cuadro 135: Aprobación secundaria ([`docs/aprobacion_secundaria_cuadro_135.csv`](file:///d:/Augusto/personal_portfolio/hacktheandes-educacion/docs/aprobacion_secundaria_cuadro_135.csv))
    - Cuadro 247: Logros 2.° de primaria ([`docs/primaria_2do_grado_cuadro_247.csv`](file:///d:/Augusto/personal_portfolio/hacktheandes-educacion/docs/primaria_2do_grado_cuadro_247.csv))
    - Cuadro 367: Logros 4.° de primaria ([`docs/primaria_4to_grado_cuadro_367.csv`](file:///d:/Augusto/personal_portfolio/hacktheandes-educacion/docs/primaria_4to_grado_cuadro_367.csv))
    - Cuadro 249: Logros 2.° de secundaria ([`docs/secundaria_2do_grado_cuadro_249.csv`](file:///d:/Augusto/personal_portfolio/hacktheandes-educacion/docs/secundaria_2do_grado_cuadro_249.csv))
* **Aspectos clave:** Metodología UMC basada en Teoría de Respuesta al Ítem (TRI), categorización de logros (Satisfactorio, En Proceso, En Inicio, Previo al Inicio) y registro continuo de SIAGIE.

### 3. [Documentación y Auditoría Técnica de Alerta Escuela](conversation://efb5428a-7bc1-40f3-a304-90df385bfddf)
* **Documentación técnica:** [`docs/alerta_escuela_documentacion.md`](file:///d:/Augusto/personal_portfolio/hacktheandes-educacion/docs/alerta_escuela_documentacion.md)
* **Validación cualitativa:** [`notas_sesión_1.md`](file:///d:/Augusto/personal_portfolio/hacktheandes-educacion/notas_sesi%C3%B3n_1.md) (entrevista a docente de primaria y secundaria).
* **Aspectos clave:** Arquitectura del modelo predictivo de Machine Learning supervisado (Gradient Boosting / Random Forest), fuentes de integración (SIAGIE, Censo, RENIEC, SISFOH), flujos operativos de semaforización y análisis de puntos de quiebre para proponer una alternativa agéntica ágil y preventiva.

### 4. Deserción Escolar por Región y Distrito (SIAGIE 2023 → 2024)
* **Documentación técnica:** [`docs/desercion_por_region_siagie_2023_2024.md`](docs/desercion_por_region_siagie_2023_2024.md)
* **Datos:** ranking de las 25 regiones con estudiantes, desertores y tasa por nivel: [`docs/desercion_por_region_siagie_2023_2024.csv`](docs/desercion_por_region_siagie_2023_2024.csv)
* **Aspectos clave:** promedio nacional de 2,54 % en secundaria (72 282 estudiantes) y 1,73 % en primaria (64 463). El problema se concentra en la Amazonía y la costa norte: Ucayali duplica el promedio nacional y es candidato para el piloto (varios distritos críticos en Coronel Portillo), mientras Lima reúne cerca de 1 de cada 3 desertores de secundaria. Pendiente comprobar cuánto de la cifra en frontera y zonas migrantes corresponde a estudiantes que se fueron del país.

---

## 🎨 Diseños y Mockups de Interfaz (Google Stitch)

> Registro de prototipado previo: la carpeta `STICH_ITERATION_1/` mencionada a continuación se retiró del repositorio. El frontend implementado (Amauti) sigue el bosquejo de Claude Design descrito en la sección Frontend.

Como parte de la fase de prototipado y validación de la solución, se diseñó la primera versión interactiva de **AmautaIA — Sistema Nacional de Mentoría Quirúrgica y Burocracia Cero**. Los prototipos fueron generados e iterados a través de la integración agéntica con **Google Stitch MCP** en el proyecto `Hack The Andes Test` (`projects/1503192843636542264`), bajo el sistema de diseño semántico **AmautaIA Institucional Claro (MINEDU GovTech)** (`assets/764693782689717926`).

> 🚀 **Visor Interactivo Central:** Abre [`STICH_ITERATION_1/index.html`](file:///d:/Augusto/personal_portfolio/hacktheandes-educacion/STICH_ITERATION_1/index.html) en tu navegador para interactuar con las 4 pantallas completas en un solo panel navegable con pestañas.

| # | Vista / Rol | Formato | Screen ID en Stitch | Archivo HTML / Prototipo | Propuesta de Valor y Funcionalidad Clave |
| :-: | :--- | :---: | :--- | :--- | :--- |
| **01** | **Landing B2G Institucional** | `Desktop` | `72360752c9d04f0891b7b25dfa6512bf` | [`01_landing_b2g_institucional.html`](file:///d:/Augusto/personal_portfolio/hacktheandes-educacion/STICH_ITERATION_1/01_landing_b2g_institucional.html) | Presentación ejecutiva para MINEDU/DRE/UGEL: tesis de rescate escolar, pilares de mentoría quirúrgica y retorno de inversión en retención escolar. |
| **02** | **Espacio del Docente + Copiloto Anti-Burocracia** | `Desktop` | `38e7bd2903a4485bb9dc396029042af1` | [`02_vista_docente_copiloto.html`](file:///d:/Augusto/personal_portfolio/hacktheandes-educacion/STICH_ITERATION_1/02_vista_docente_copiloto.html) | Agrupación automática de alumnos por micro-paso fallado, guías de mentoría de 10 min y generación automática de sesiones CNEB y conclusiones SIAGIE. |
| **03** | **Interacción WhatsApp del Docente con el Agente** | `Mobile` | `73981077ba2c49c4a3c3d11b4c201c9b` | [`03_interaccion_whatsapp_agente.html`](file:///d:/Augusto/personal_portfolio/hacktheandes-educacion/STICH_ITERATION_1/03_interaccion_whatsapp_agente.html) | Interfaz móvil cero fricción: el docente envía una foto del registro o nota de voz y el agente actualiza asistencia, detecta riesgo y redacta los informes. |
| **04** | **Torre de Control Territorial UGEL / MINEDU** | `Desktop` | `271be7b380054fba8bfafc2747b9b73a` | [`04_torre_control_ugel_minedu.html`](file:///d:/Augusto/personal_portfolio/hacktheandes-educacion/STICH_ITERATION_1/04_torre_control_ugel_minedu.html) | Visor geoespacial en tiempo real sin pedir reportes manuales, auditoría SIAGIE vs. Aprendizaje Real y fiscalización del despliegue de psicólogos. |

Para más detalles sobre los componentes y sugerencias de iteración devueltas por Stitch, consulta el reporte en [`STICH_ITERATION_1/README.md`](file:///d:/Augusto/personal_portfolio/hacktheandes-educacion/STICH_ITERATION_1/README.md).

---

## 👥 Público Objetivo y Usuarios

1. **Usuario Primario (Impacto a Escala y Decisión):**
   - **Gobierno Central / MINEDU / DRE / UGEL:** Requieren visibilidad agregada y fidedigna de las instituciones en riesgo crítico para orientar presupuesto, plazas de psicología/tutoría y programas de apoyo.
2. **Usuarios Secundarios (Operación y Acción Diaria):**
   - **Docentes y Tutores de Aula:** Necesitan herramientas que automaticen el papeleo, detecten señales tempranas en tiempo real y sugieran acciones pedagógicas individualizadas.
   - **Equipos Directivos y Administrativos:** Requieren alertas automatizadas sin retrasos bimestrales y reportes ejecutivos consolidados por grado y sección.
3. **Beneficiarios Finales:**
   - **Estudiantes y Familias:** Reciben acompañamiento oportuno y soporte preventivo antes de que se interrumpa su trayectoria educativa.

---

## 🗂️ Estructura del Proyecto

```text
.
├── .agents/                                # Agentes y skills compartidos
│   ├── code-reviewer.md                    # Subagente de revisión de código
│   ├── planner.md                          # Subagente de planificación
│   └── skills/                             # Skills agénticas (Stitch, CLI andes, frontend)
│       ├── chofex-hackathon/               # Skill oficial Hack the Andes (CLI andes)
│       └── stitch-*/                       # Skills especializadas para Google Stitch
├── .claude/                                # Configuración de Claude Code
├── .commands/                              # Comandos reutilizables (/commit, /review)
├── apps/                                   # ms-auth (3000), ms-siagie (3001), ms-alerta (3002), ms-simon (3003), ms-escale (3004) y web (Amauti)
├── libs/                                   # Autorización, contratos de eventos y fixtures sintéticos
├── test/                                   # Entornos y protección de schemas de prueba
├── scripts/                                # Creación de base y verificación del arranque compilado
├── docs/                                   # Documentación técnica, datasets y tableros
│   ├── alerta_escuela_documentacion.md     # Auditoría integral del sistema Alerta Escuela
│   ├── reporte_desercion_escale.md         # Informe técnico y réplica de deserción ESCALE
│   ├── desercion_por_region_siagie_2023_2024.md # Deserción por región y distrito (SIAGIE)
│   ├── reporte_rendimiento_academico_oficial_peru.md # Informe técnico de rendimiento y UMC
│   ├── desercion_interactiva.html          # Tablero interactivo de deserción secundaria
│   ├── rendimiento_interactivo.html        # Tablero interactivo de rendimiento escolar
│   ├── rendimiento_academico_escale.json   # Datasets agregados MINEDU/ESCALE
│   └── *.csv                               # Datasets limpios por cuadros estadísticos
├── STICH_ITERATION_1/                      # Mockups y prototipos interactivos generados en Google Stitch
│   ├── index.html                          # Visor interactivo centralizado con pestañas de las 4 pantallas
│   ├── 01_landing_b2g_institucional.html   # Landing B2G MINEDU/UGEL
│   ├── 02_vista_docente_copiloto.html      # Copiloto docente anti-burocracia
│   ├── 03_interaccion_whatsapp_agente.html # Flujo conversacional WhatsApp
│   ├── 04_torre_control_ugel_minedu.html   # Torre de control territorial UGEL/MINEDU
│   └── README.md                           # Detalle de pantallas y sugerencias de iteración Stitch
├── notas_sesión_1.md                       # Notas de ideación y user research a docente
├── AGENTS.md                               # Guía para agentes de IA (convenciones y workflow)
├── CLAUDE.md                               # Instrucciones específicas para Claude Code
└── README.md                               # Documentación general del proyecto
```

---

## 🤖 Desarrollo con Agentes de IA

Este repositorio implementa flujos de trabajo colaborativos agénticos:

- [`AGENTS.md`](file:///d:/Augusto/personal_portfolio/hacktheandes-educacion/AGENTS.md): Normas de desarrollo, estilo y convenciones para agentes (Antigravity, Cursor, Claude Code, Codex).
- [`.agents/skills/chofex-hackathon`](file:///d:/Augusto/personal_portfolio/hacktheandes-educacion/.agents/skills/chofex-hackathon): Integración con el CLI `andes` para enviar actualizaciones de avance a los mentores y coordinar la entrega oficial.
- Comandos rápidos disponibles en [`.commands/`](file:///d:/Augusto/personal_portfolio/hacktheandes-educacion/.commands) para commits estandarizados y revisiones de código.

---

## 👥 Equipo

**Futuro Agéntico** (KeoIT) — Track Educación:
- Augusto Huerta
- Giomar Limo
- Alexander Delgado
- Ronaldinho Villanueva
