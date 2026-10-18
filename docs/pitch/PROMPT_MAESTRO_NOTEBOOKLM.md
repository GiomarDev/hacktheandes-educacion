# Prompt Maestro para Generar la Fuente Documental y el Deck en NotebookLM — Amauti

Este documento contiene **dos prompts estratégicos**:
1. **Prompt 1 (Prompt Maestro de Compilación Documental):** Diseñado para que un LLM o agente de IA construya o actualice el archivo `.md` fuente ([`docs/pitch/FUENTE_MAESTRA_DECK_NOTEBOOKLM.md`](file:///d:/Augusto/personal_portfolio/hacktheandes-educacion/docs/pitch/FUENTE_MAESTRA_DECK_NOTEBOOKLM.md)) a partir de la arquitectura, investigación y guion oficial del proyecto.
2. **Prompt 2 (Instrucción Directa para pegar dentro de NotebookLM):** El prompt exacto que debes pegar en el cuadro de instrucciones de **NotebookLM** una vez subido el archivo [`FUENTE_MAESTRA_DECK_NOTEBOOKLM.md`](file:///d:/Augusto/personal_portfolio/hacktheandes-educacion/docs/pitch/FUENTE_MAESTRA_DECK_NOTEBOOKLM.md) para que genere la presentación de diapositivas alineada al segundo con la sustentación y defensa del equipo.

---

## 1. Prompt Maestro para Generar/Iterar el Archivo `.md` Fuente

> **Instrucciones de uso:** Copia el siguiente bloque si deseas que un agente con acceso al repositorio (o un LLM de contexto largo) regenere o expanda el archivo [`docs/pitch/FUENTE_MAESTRA_DECK_NOTEBOOKLM.md`](file:///d:/Augusto/personal_portfolio/hacktheandes-educacion/docs/pitch/FUENTE_MAESTRA_DECK_NOTEBOOKLM.md).

```markdown
# ROL Y OBJETIVO PRINCIPAL
Actúa como un Arquitecto Principal de Soluciones GovTech, Estratega de Pitch de Hackathons y Especialista en Ingeniería de Contexto para Google NotebookLM.

Tu objetivo es analizar íntegramente el repositorio del proyecto **Amauti** (Equipo: **Futuro Agéntico - KeoIT**, Track: **Educación Escolar**, **Hack the Andes 2026**) y redactar un único archivo Markdown exhaustivo, estructurado y libre de ambigüedades (`FUENTE_MAESTRA_DECK_NOTEBOOKLM.md`).

El propósito final de ese archivo `.md` es ser subido como **Fuente Maestra Única** a **Google NotebookLM** para que NotebookLM genere una presentación de diapositivas (Slide Deck) que respalde milimétricamente:
1. **El Pitch Oficial de 3 Minutos (180 segundos):** Dividido entre **Augusto** (`0:00 - 1:08`, Actos I, II y III) y **Xander** (`1:08 - 3:00`, Demo en vivo en `https://amauti.keoit.com`, Arquitectura de 5 microservicios y Tradeoffs/Visión), siguiendo sin desviaciones [`docs/pitch/GUION_PITCH_Y_DEFENSA.md`](docs/pitch/GUION_PITCH_Y_DEFENSA.md).
2. **La Defensa Q&A de 2 Minutos (120 segundos):** Respaldando visual y técnicamente las 5 preguntas críticas fuera del guion definidas en la Parte 3 de [`docs/pitch/GUION_PITCH_Y_DEFENSA.md`](docs/pitch/GUION_PITCH_Y_DEFENSA.md).

---

# REGLAS DE INGENIERÍA DOCUMENTAL PARA NOTEBOOKLM
Para que NotebookLM no alucine datos, no mezcle roles ni genere diapositivas saturadas de texto ("wall of text"), el archivo `.md` que redactes DEBE cumplir estas 5 reglas estructurales:

1. **Jerarquía explícita por Diapositiva (`# SLIDE X: ...`):**
   NotebookLM indexa los encabezados H1/H2 para segmentar unidades temáticas al crear presentaciones. Debes estructurar el documento en **11 unidades visuales**:
   - **5 Diapositivas Principales del Pitch (Slides 1 a 5)**
   - **1 Diapositiva Puente para la Demo en Vivo (Interludio entre Slide 3 y Slide 4)**
   - **5 Diapositivas de Apéndice para la Defensa Q&A (Slides A1 a A5)**

2. **Arquitectura de 3 Capas Semánticas en cada Diapositiva:**
   Dentro de cada slide debes separar explícitamente:
   - **CAPA 1 — DISEÑO Y TEXTO EN PANTALLA (Regla de los 3 Segundos):** Qué se proyecta visualmente. Incluye `Kicker` superior, `Titular de impacto` (máx. 12 palabras), `Bloques visuales / Tarjetas` (máx. 15–25 palabras por bloque), `Layout sugerido` y `Activo visual / Captura recomendada` del catálogo [`docs/pitch/CATALOGO_SCREENSHOTS.md`](docs/pitch/CATALOGO_SCREENSHOTS.md).
   - **CAPA 2 — GUION EXACTO Y SINCRONIZACIÓN (Voz en Off):** Orador asignado (**Augusto** o **Xander**), marca de tiempo exacta, conteo de palabras, transcripción verbatim del guion oficial y criterio de la rúbrica que maximiza.
   - **CAPA 3 — EVIDENCIA TÉCNICA Y RESPALDO DE DEFENSA (Contexto Profundo):** Los datos cuantitativos verificados (ESCALE, SIAGIE, UMC), los hallazgos cualitativos de las entrevistas reales (docente Marita Carrión y especialista Saúl), los detalles de implementación en código y la conexión directa con las preguntas de Q&A.

3. **Alineación Estricta con la Rúbrica de Evaluación (`docs/como_se_evalua_a_los_equipos.md`):**
   El documento debe dejar explícito cómo cada slide construye el puntaje máximo de **5.5 puntos**:
   - **75% Bloque Técnico (3.75 pts):** Complejidad Técnica (30% — Desempate #1), Funciona en vivo (25% — Desempate #2), Calidad Técnica en GitHub (20%).
   - **25% Bloque Producto (1.25 pts):** Problema e Impacto con usuario específico (15%), Claridad y Tradeoffs conscientes (10%).
   - **Bonus Tracción (+0.50 pts):** Evidencia real de uso y validación mostrada desde el producto.

4. **Consistencia Absoluta de Datos y Cifras Oficiales:**
   - **Hook de 375 alumnos cada 24 horas:** Proviene de la suma oficial SIAGIE 2023→2024 de desertores anuales en secundaria (72,282 estudiantes; 2.54%) + primaria (64,463 estudiantes; 1.73%) = **136,745 estudiantes al año** $\div 365\text{ días} \approx \mathbf{375\text{ alumnos cada 24 horas}}$.
   - **Foco territorial:** Ucayali duplica el promedio nacional con **5.11%** en secundaria SIAGIE 2023–2024 (4.9% en serie ESCALE 2024–2025), con distritos críticos en Coronel Portillo como Masisea (11.1%) y Manantay (8.4%). Brecha rural nacional: 3.7% rural vs. 2.4% urbano.
   - **Fricción validada en campo:** Entrevistas con la profesora Marita Carrión y el especialista Saúl demuestran que el 80% de la carga operativa recae en reportes e informes manuales, que solo el director accede a Alerta Escuela, que el semáforo oficial tiene un punto ciego de **60 días** (corte bimestral) y que el único canal universal y asíncrono en el bolsillo del docente es **WhatsApp**.

5. **Fidelidad Técnica de la Arquitectura Construida:**
   Documenta con exactitud los **5 microservicios independientes en NestJS** + **PostgreSQL (base `school` con 5 schemas aislados)** + **Prisma**:
   - `ms-auth` (`:3000`, schema `auth`): RBAC multinivel (9 roles desde `MINEDU_ADMIN` hasta `TEACHER`/`AUXILIAR`/`PSYCHOLOGIST`), JWT RS256, rotación de llaves con endpoint público `/.well-known/jwks.json` cacheado por los demás servicios, y hashing de contraseñas con **Argon2id**.
   - `ms-siagie` (`:3001`, schema `siagie`): Fuente única de verdad para DRE, UGEL, colegios (`modular_code`, `attention_goal`), matrícula, asistencia diaria y por hora pedagógica, control QR de ingreso/salida y calificaciones por competencias CNEB (`AD`, `A`, `B`, `C`).
   - `ms-alerta` (`:3002`, schema `alerta`): Motor de reglas deterministas configurables (ej. 3 faltas en ventana de 7 días o caída de nota sin asistencia), generación de alertas por severidad con **SLA de 48 horas**, bitácora de seguimiento y despacho de mensajes de acompañamiento a la familia vía WhatsApp.
   - `ms-simon` (`:3003`, schema `simon`): Automatización de reportes de monitoreo para UGEL/SIMON, visitas áulicas y **Planes de Apoyo personalizados** cuyo campo de diagnóstico reservado de menores se protege mediante **cifrado simétrico AES-256** (`SIMON_DATA_ENCRYPTION_SECRET`).
   - `ms-escale` (`:3004`, schema `escale`): Motor estadístico territorial e importador de microdatos abiertos oficiales (448 valores oficiales ESCALE/SIAGIE contrastados) con validación de integridad mediante **hashes criptográficos SHA-256**.

---

# ESTRUCTURA OBLIGATORIA DEL ARCHIVO `.md` RESULTANTE
1. **Encabezado Rector e Instrucciones de Sistema para NotebookLM:** Reglas para que el generador de presentaciones de NotebookLM respete el orden, la concisión visual y la fidelidad técnica.
2. **Resumen Ejecutivo del Proyecto y Mapa Estratégico de la Rúbrica (5.5 Pts).**
3. **Sistema de Diseño Visual GovTech (`palette.md`) e Identidad Gráfica de Amauti.**
4. **Secuencia Cronológica Oficial del Pitch (Tabla Maestra 0:00 a 3:00 + 2:00 Q&A).**
5. **Blueprint Detallado de lasDiapositivas Principales (Slides 1 a 5 + Slide Puente de Demo en Vivo):** Desarrolladas con las 3 capas semánticas.
6. **Blueprint Detallado del Apéndice de Defensa Q&A (Slides A1 a A5):** Una diapositiva de respaldo visual y técnico por cada una de las 5 preguntas de la Matriz de Defensa.
7. **Base de Conocimiento Consolidada (Anexo de Datos Duros, Arquitectura y Citas de Campo):** Tablas de referencia rápida para alimentar respuestas del chat de NotebookLM.
```

---

## 2. Prompt Corto para Pegar DENTRO de NotebookLM (Al Generar el Deck)

> **Instrucciones de uso:**
> 1. Sube el archivo [`docs/pitch/FUENTE_MAESTRA_DECK_NOTEBOOKLM.md`](file:///d:/Augusto/personal_portfolio/hacktheandes-educacion/docs/pitch/FUENTE_MAESTRA_DECK_NOTEBOOKLM.md) como fuente a tu cuaderno de **NotebookLM**.
> 2. Si vas a usar el botón de generar presentación/guía o el chat de NotebookLM para construir las diapositivas, pega el siguiente prompt:

```text
   Genera una presentación de diapositivas (Slide Deck) de alto impacto para el Pitch de 3 minutos y la Defensa Q&A de 2 minutos de "Amauti" en Hack the Andes 2026, basándote ESTRICTAMENTE en la estructura de la fuente "FUENTE_MAESTRA_DECK_NOTEBOOKLM.md" y si requieres imagenes de la plataforma checar los .png

   Sigue estas reglas obligatorias:
   1. ESTRUCTURA EXACTA (11 DIAPOSITIVAS EN DOS BLOQUES):
      - Bloque 1 (Pitch de 3 Minutos): Slide 1 (Hook: 375 alumnos cada 24h), Slide 2 (El punto ciego de 60 días: sistemas que hacen autopsias vs. WhatsApp), Slide 3 (La diferencia Amauti: audio de 10s en WhatsApp, 3 pilares y sincronización en vivo), Slide Puente (Recorrido de Demo en Vivo en amauti.keoit.com: Vista Docente Hoy/Alertas, Caso Nayeli con bitácora y planes AES-256, y Panorama Macro MINEDU/UGEL en Ucayali), Slide 4 (Arquitectura de 5 microservicios en NestJS: ms-auth, ms-siagie, ms-alerta, ms-simon, ms-escale con PostgreSQL, JWKS, AES-256 y SHA-256) y Slide 5 (Tradeoffs conscientes: reglas deterministas hoy vs. planes automáticos de nivelación y tutoría como siguiente paso).

   2. DENSIDAD VISUAL (REGLA DE LOS 3 SEGUNDOS):
      - En el cuerpo visual de cada diapositiva (Texto en Pantalla), usa únicamente titulares contundentes, cifras gigantes y máximo 3 bloques o tarjetas con 15 a 25 palabras por tarjeta, tal como especifica la "CAPA 1" de cada slide en el documento fuente.
      - NO pongas párrafos largos dentro de la diapositiva.

   3. NOTAS DE ORADOR Y DEFENSA:
      - En las notas de orador de cada diapositiva, incluye el guion exacto palabra por palabra ("CAPA 2"), el tiempo asignado (Augusto 0:00-1:08 / Xander 1:08-3:00), la captura oficial recomendada de la plataforma y los datos duros de respaldo ("CAPA 3").
```
