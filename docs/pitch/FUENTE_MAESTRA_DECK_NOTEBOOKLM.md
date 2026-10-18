# FUENTE MAESTRA Y BLUEPRINT DE DIAPOSITIVAS PARA NOTEBOOKLM
## Amauti — Continuidad Educativa, Alerta Temprana y Reporting sin Fricción
**Equipo:** Futuro Agéntico (KeoIT) · **Integrantes:** Augusto Huerta, Alexander (Xander) Delgado, Giomar Limo, Ronaldinho Villanueva  
**Track:** Educación Escolar · **Evento:** Hack the Andes 2026 (Lima, Perú)  
**URL en Producción (Demo en Vivo):** `https://amauti.keoit.com`

---

## 📌 DIRECTIVA DE SISTEMA PARA GOOGLE NOTEBOOKLM (LEER PRIMERO)

Este documento es la **Fuente Rectora Única (Single Source of Truth)** para generar el **Deck de Diapositivas (Slide Deck)** del proyecto **Amauti**. Al sintetizar o construir diapositivas a partir de este documento, aplica obligatoriamente las siguientes reglas:

1. **Alineación Estricta con el Guion Oficial de 3 Minutos + 2 Minutos de Q&A:**
   - **Parte 1 (0:00 a 1:08 — 70 segundos — Orador: Augusto):** Cubre las **Slides 1, 2 y 3** (El Hook de los 375 alumnos, el Punto Ciego de los 60 días / WhatsApp y la Diferencia Amauti con sus 3 pilares).
   - **Parte 2 (1:08 a 3:00 — 110 segundos — Orador: Xander):** Inicia con **62 segundos de Demo en Vivo** sobre `https://amauti.keoit.com` (`1:08 - 2:10`, representada en el deck por la **Slide Puente de Demo**), continúa con la **Slide 4** (`2:10 - 2:35`, Arquitectura de 5 Microservicios en NestJS + AES-256 + SHA-256) y cierra con la **Slide 5** (`2:35 - 3:00`, Tradeoffs conscientes y Siguiente Paso de Planes de Nivelación).
   - **Parte 3 (+2:00 minutos de Defensa Q&A — Oradores: Augusto y Xander):** Respaldada por las **5 Diapositivas de Apéndice (Slides A1 a A5)** diseñadas para responder con evidencia visual e ingeniería real a las preguntas del jurado fuera del guion.

2. **Regla de los 3 Segundos (Separación entre Pantalla y Voz):**
   - **Lo que va en el lienzo visual de la diapositiva (`CAPA 1`):** Debe poder escanearse en menos de 3 segundos. Usa cifras gigantes, titulares de máximo 10–12 palabras y tarjetas cortas de 15–25 palabras. **Prohibido colocar párrafos densos en la diapositiva.**
   - **Lo que va en las Notas del Orador (`CAPA 2` y `CAPA 3`):** El guion hablado exacto palabra por palabra, los tiempos por segundo, las capturas de pantalla asociadas y las métricas técnicas profundas.

---

## 1. ESTRATEGIA DE PUNTUACIÓN: ALINEACIÓN CON LA RÚBRICA DE HACK THE ANDES (5.5 PUNTOS MÁX.)

La evaluación oficial de Hack the Andes pondera **75% Ingeniería/Técnica (3.75 pts)**, **25% Producto (1.25 pts)** y **+0.50 pts de Bonus por Tracción Real**. En caso de empate, **el Desempate #1 es Complejidad Técnica (30%)** y **el Desempate #2 es Funciona en Vivo (25%)**.

| Criterio Oficial | Peso / Pts | Qué exige el jurado para otorgar 5/5 | En qué Slide y Bloque se demuestra | Evidencia Concreta de Amauti |
| :--- | :---: | :--- | :--- | :--- |
| **1. Complejidad Técnica** *(Desempate #1)* | **30%** *(1.50 pts)* | Datos reales, modelos o servicios orquestados, arquitectura no trivial (no un CRUD o wrapper simple). | **Slide 4** (`2:10 - 2:35`) + **Slides A1, A2, A4** | Monorepo con **5 microservicios independientes en NestJS** (`ms-auth`, `ms-siagie`, `ms-alerta`, `ms-simon`, `ms-escale`), 5 schemas aislados en PostgreSQL, RBAC con JWKS RS256, cifrado **AES-256** y verificación **SHA-256** de 448 indicadores oficiales. |
| **2. Funciona en Vivo** *(Desempate #2)* | **25%** *(1.25 pts)* | Corre en vivo desde la URL pública con datos reales y **aguanta preguntas fuera del guion**. | **Demo en Vivo / Slide Puente** (`1:08 - 2:10`) + **Q&A** | Despliegue en producción en `https://amauti.keoit.com` operando con datos oficiales de SIAGIE/ESCALE (foco en Ucayali) y flujo completo Docente ➔ Alerta 48h ➔ Bitácora ➔ Plan de apoyo cifrado ➔ Panorama MINEDU/UGEL. |
| **3. Calidad Técnica** | **20%** *(1.00 pt)* | Código sólido en GitHub, manejo de errores, casos borde y **cero secretos/credenciales expuestos**. | **Slide 4** (`2:10 - 2:35`) + **Slide A2** | Hashing **Argon2id**, rotación de llaves RS256, variables de entorno estrictas (`SIMON_DATA_ENCRYPTION_SECRET`), aislamiento por ámbito verificado con **Suite E2E y Smoke Tests** entre servicios. |
| **4. Problema e Impacto** | **15%** *(0.75 pts)* | Usuario específico del track Educación Escolar y evidencia concreta del problema. | **Slide 1** (`0:00 - 0:13`) + **Slide 2** (`0:13 - 0:44`) + **Slide A5** | **375 alumnos abandonan cada 24h** (136,745/año en SIAGIE). Punto ciego de **60 días** en sistemas bimestrales (Alerta Escuela/SIAGIE). Validación en campo con docente **Marita Carrión** y especialista **Saúl**. |
| **5. Claridad y Tradeoffs** | **10%** *(0.50 pts)* | Queda claro qué hicieron, **por qué lo hicieron y qué dejaron fuera conscientemente**. | **Slide 3** (`0:44 - 1:08`) + **Slide 5** (`2:35 - 3:00`) + **Slide A4** | Decisión consciente de usar **reglas deterministas auditables** en lugar de cajas negras de ML bimestral, y priorizar hoy la liberación de tiempo docente vía WhatsApp antes de la generación automática de planes de nivelación (siguiente paso). |
| **Bonus: Tracción Real** | **+0.50 pts** | Usuarios fuera del equipo probaron la solución y **se evidencia desde el producto**. | **Demo en Vivo** (`1:08 - 2:10`) + **Slide A5** | Conector real de WhatsApp + plataforma en vivo validando reducción del registro de observaciones y alertas de **25 minutos manuales a menos de 15 segundos**. |

---

## 2. SISTEMA DE DISEÑO VISUAL E IDENTIDAD GOVTECH (`palette.md`)

Todas las diapositivas mantienen coherencia visual con la interfaz institucional de **Amauti** (inspirada en el estándar GovTech de `gob.pe` / MINEDU, de alto contraste para proyector de auditorio):

### 2.1 Paleta de Colores Oficial
- **Fondo Principal de Diapositiva (`--bg`):** `#F5F7FA` (Gris azulado institucional ultra claro; evita el deslumbramiento del blanco puro en proyectores).
- **Superficie de Tarjetas (`--surface`):** `#FFFFFF` con borde sutil `#E1E5EB` (`--line`).
- **Superficie Oscura de Contraste / Arquitectura (`--nav-bg`):** `#1A2332` (Navy profundo institucional para bloques técnicos y franja de tensión).
- **Texto Primario (`--ink`):** `#1A2332` · **Texto Secundario (`--ink-mid`):** `#5A6578` · **Metadata (`--ink-mute`):** `#8A95A8`.
- **Rojo Bandera / Crítico (`--gob-rojo` / `--critico`):** `#D91023` / `#C8102E` (Usado para la cifra `375`, alertas críticas y acentos de urgencia; fondo suave `#FFEEF0`).
- **Azul Institucional (`--gob-azul`):** `#003876` (Acciones primarias, pilares de solución y bordes destacados; fondo suave `#E6EEF5`).
- **Verde Estable / WhatsApp (`--estable`):** `#2B8A3E` (Píldoras de solución, estado activo y canal WhatsApp; fondo suave `#E8F3EC`).
- **Amarillo Identidad Amauti (`--amauti`):** `#FFD21F` (Color distintivo de la mascota oficial **Amauti**, el lapicito con bombilla de idea).

### 2.2 Sistema Tipográfico
- **Títulos y Cifras de Impacto (`--font-display`):** `Source Serif 4` (Weights 700/800, tracking `-0.025em`). Transmite autoridad editorial y seriedad institucional.
- **Cuerpo e Interfaz (`--font-sans`):** `Source Sans 3` (Weights 400/600/700). Máxima legibilidad a distancia.
- **Etiquetas Superiores (Kickers), Tiempos y Puertos Técnicos (`--font-mono`):** `JetBrains Mono` (Weight 700, uppercase).

---

## 3. MAPA CRONOLÓGICO OFICIAL DEL PITCH (3 MINUTOS = 180 SEGUNDOS)

| Tiempo | Duración | Orador | Unidad Visual en el Deck | Criterio Principal |
| :---: | :---: | :---: | :--- | :--- |
| **`0:00 - 0:13`** | `13 seg` *(31 pal.)* | **Augusto** | **SLIDE 1:** Acto I — El Hook (`375` alumnos / 24h + Pregunta de Curiosidad) | Problema e Impacto (15%) |
| **`0:13 - 0:44`** | `31 seg` *(71 pal.)* | **Augusto** | **SLIDE 2:** Acto II — El Punto Ciego de los 60 Días (Autopsias vs. WhatsApp) | Problema e Impacto (15%) |
| **`0:44 - 1:08`** | `24 seg` *(62 pal.)* | **Augusto** | **SLIDE 3:** Acto III — La Diferencia Amauti (Audio 10s ➔ 3 Pilares ➔ En vivo) | Claridad (10%) |
| **`1:08 - 2:10`** | `62 seg` *(~135 pal.)* | **Xander** | **SLIDE PUENTE (DEMO EN VIVO):** Recorrido en vivo en `https://amauti.keoit.com` | **Funciona (25%) + Tracción (+0.5)** |
| **`2:10 - 2:35`** | `25 seg` *(~58 pal.)* | **Xander** | **SLIDE 4:** Arquitectura y Complejidad (5 Microservicios NestJS + AES-256 + SHA-256) | **Complejidad (30%) + Calidad (20%)** |
| **`2:35 - 3:00`** | `25 seg` *(~55 pal.)* | **Xander** | **SLIDE 5:** Tradeoffs, Siguiente Paso (Planes de Nivelación) y Cierre | Claridad / Tradeoffs (10%) |
| **`+2:00 min`** | `120 seg` | **Ambos** | **SLIDES A1 a A5:** Anexo de Defensa Q&A (5 Preguntas Críticas del Jurado) | **5/5 en Funciona y Complejidad** |

---

## 4. BLUEPRINT DETALLADO DE LAS DIAPOSITIVAS PRINCIPALES (PITCH DE 3 MINUTOS)

---

# SLIDE 1: Acto I — El Hook y la Pregunta de Curiosidad (`0:00 - 0:13`)

### CAPA 1 — DISEÑO Y TEXTO EN PANTALLA (Regla de los 3 Segundos)
- **Layout Visual:** Grilla asimétrica de 2 columnas (`70%` izquierda para cifra gigante e interrogante / `30%` derecha para la mascota institucional **Amauti** limpia sobre fondo claro).
- **Kicker Superior (Monospace, Rojo `#D91023`):** `EN EL PERÚ · CADA 24 HORAS`
- **Elemento Central Gigante:** **`375`** *(en tipografía Serif tamaño gigante, color `#D91023`)*
- **Subtítulo Directo:** `alumnos escolares habrán abandonado para siempre el colegio.`
- **Banner de Pregunta (Borde izquierdo azul `#003876`):**
  > **¿En qué minuto exacto perdimos la oportunidad de retenerlos?**  
  > **¿Fue el día que dejaron de ir, o mucho antes?**
- **Captura / Activo Visual de Referencia:** Mascota vectorial **Amauti** + respaldo en [`docs/pitch/screenshots/01_panorama_nacional_secundaria.png`](file:///d:/Augusto/personal_portfolio/hacktheandes-educacion/docs/pitch/screenshots/01_panorama_nacional_secundaria.png).

### CAPA 2 — GUION EXACTO Y SINCRONIZACIÓN (Voz en Off)
- **Orador:** **Augusto**
- **Ventana de Tiempo:** `0:00 - 0:13` *(13 segundos · 31 palabras)*
- **Criterio de Rúbrica:** Problema e Impacto (15%)
- **Texto Hablado Exacto:**
  > *"Cada 24 horas, 375 alumnos escolares habrán abandonado para siempre el colegio. ¿En qué minuto exacto perdimos la oportunidad de retenerlos? ¿Fue el día que dejaron de ir, o mucho antes?"*

### CAPA 3 — EVIDENCIA TÉCNICA Y RESPALDO DE DEFENSA (Contexto Profundo)
- **De dónde sale el número `375` (Dato Oficial SIAGIE 2023→2024):**
  - En secundaria abandonaron **72,282 estudiantes** (tasa nacional de **2.54%** sobre 2,846,144 matriculados).
  - En primaria abandonaron **64,463 estudiantes** (tasa nacional de **1.73%** sobre 3,726,185 matriculados).
  - **Total anual:** $72,282 + 64,463 = 136,745\text{ estudiantes que abandonan al año}$. Dividido entre 365 días = **$374.64 \approx 375\text{ estudiantes cada 24 horas}$** (más de 15 alumnos por hora).
- **Foco de Desigualdad Territorial:**
  - Según ESCALE (Cuadro 321), la deserción rural en secundaria alcanza el **3.7%** frente al **2.4%** urbano.
  - La Amazonía duplica el promedio nacional: **Loreto (5.9%)**, **Huánuco (5.0%)** y **Ucayali (4.9% en ESCALE / 5.11% en SIAGIE)**.
- **Tesis Psicológica del Hook:** El abandono escolar no es un evento súbito; es el desenlace de un proceso silencioso de desconexión pedagógica y ausentismo intermitente que ocurre semanas antes de que el alumno deje de asistir definitivamente.

---

# SLIDE 2: Acto II — El Punto Ciego de los 60 Días y el Docente en el Aula (`0:13 - 0:44`)

### CAPA 1 — DISEÑO Y TEXTO EN PANTALLA (Regla de los 3 Segundos)
- **Layout Visual:** Línea de tiempo horizontal en 3 tarjetas superiores (progresión Semana 1 ➔ Semana 2 ➔ Día 60) + Franja inferior oscura (`#1A2332`) destacando al docente y una píldora verde brillante para **WhatsApp**.
- **Kicker Superior:** `EL PUNTO CIEGO DE LOS 60 DÍAS`
- **Titular Principal:** **`Sistemas que hacen autopsias, no rescates.`** *(con la palabra "autopsias" en rojo `#D91023`)*
- **Línea de Tiempo (3 Tarjetas Visuales):**
  1. **Tarjeta 1 (`SEMANA 1 · LUNES`):** `Falla en matemáticas` — Badge verde engañoso: `Herramientas oficiales: "Normal"`.
  2. **Tarjeta 2 (`SEMANA 2 · JUEVES`):** `Empieza a faltar y se apaga` — Badge verde engañoso: `Herramientas oficiales: "Normal"`.
  3. **Tarjeta 3 Crítica (`DÍA 60 · REPORTE OFICIAL`, fondo rojo `#FFEEF0`, borde `#C8102E`):** `El pupitre ya está vacío` — Badge rojo: `Recién salta la alerta`.
- **Franja Inferior del Usuario (Fondo `#1A2332`):**
  - Izquierda: **«El profesor —nuestro principal agente de cambio— queda ahogado en trámites, solo, sin tiempo para intervenir y sin tecnología en el aula…»**
  - Derecha (Píldora Verde `#2B8A3E`): **`Salvo una: WhatsApp`**

### CAPA 2 — GUION EXACTO Y SINCRONIZACIÓN (Voz en Off)
- **Orador:** **Augusto**
- **Ventana de Tiempo:** `0:13 - 0:44` *(31 segundos · 71 palabras)*
- **Criterio de Rúbrica:** Problema e Impacto (15%) — Definición de usuario específico y dolor validado.
- **Texto Hablado Exacto:**
  > *"Lo perdimos semanas atrás, en un punto ciego de 60 días: cuando falló en matemáticas, empezó a faltar y se apagó al fondo del salón, mientras para las herramientas oficiales todo seguía 'normal'.*  
  > *Los pocos sistemas del Estado hacen autopsias, no rescates: ahogan a nuestro principal agente de cambio —el profesor— en trámites institucionales, dejándolo solo, sin tiempo para intervenir y sin tecnología en el aula… salvo una que ya tiene en su bolsillo: WhatsApp."*

### CAPA 3 — EVIDENCIA TÉCNICA Y RESPALDO DE DEFENSA (Contexto Profundo)
- **Auditoría Técnica de "Alerta Escuela" y SIAGIE (`docs/alerta_escuela_documentacion.md`):**
  - El sistema estatal actual corre modelos supervisados (Gradient Boosting / Random Forest) alimentados por cortes **bimestrales** de SIAGIE (~60 días de latencia). Cuando el semáforo se pone en rojo, el estudiante ya abandonó.
  - **Acceso restringido:** Solo el director tiene credenciales de Alerta Escuela; los docentes y auxiliares (quienes ven al alumno todos los días) están ciegos al sistema y solo reciben exigencias de llenado de informes mensuales en papel o Excel.
- **Evidencia Cualitativa de Campo (`docs/transcripcion_marita.md` y `docs/transcripcion_saul.md`):**
  - La profesora **Marita Carrión** confirmó que el **80% de su fricción operativa** está en llenar reportes, planes de apoyo bimestrales (hasta 25 de 32 alumnos requieren ajustes) y actas para protegerse ante auditorías de la UGEL.
  - En secundaria pública, el auxiliar toma asistencia a mano y cada docente pasa lista en su hora pedagógica porque el alumno puede salirse a mitad de jornada. Pedirles abrir un portal web pesado en el aula es inviable por falta de conectividad y tiempo; en cambio, todos usan **WhatsApp** a diario.

---

# SLIDE 3: Acto III — Por Qué Amauti Hace la Diferencia (`0:44 - 1:08`)

### CAPA 1 — DISEÑO Y TEXTO EN PANTALLA (Regla de los 3 Segundos)
- **Layout Visual:** Flujo de 3 columnas conectadas de izquierda a derecha (`01 · En el Aula` ➔ `02 · Lo que hace Amauti` [Destacada con borde azul `#003876`] ➔ `03 · En Tiempo Real`).
- **Kicker Superior:** `POR QUÉ AMAUTI HACE LA DIFERENCIA REAL`
- **Titular Principal:** **`Cierra el ciclo completo entre la señal y el rescate.`**
- **Columna 1 (`01 · EN EL AULA`):**
  - Título: **Audio de 10s en WhatsApp**
  - Burbuja estilo WhatsApp (`#DCF8C6`): `🎙️ «Hoy Kevin destacó en fracciones, pero Nayeli faltó por tercera vez y bajó en matemáticas.»`
  - Pie: `Cero portales nuevos. Desde el celular del docente.`
- **Columna 2 (`02 · LO QUE HACE AMAUTI` — Tarjeta Central Destacada):**
  - Título: **Le devuelve tiempo para intervenir**
  - Lista de 3 Pilares:
    1. **`1. Agiliza sus trámites`**
    2. **`2. Bitacoriza sus observaciones`**
    3. **`3. Alerta alumnos en riesgo`**
  - Pie: `Menos burocracia = Más mentoría humana.`
- **Columna 3 (`03 · EN TIEMPO REAL`):**
  - Título: **Sincronización Institucional**
  - Cadena de nodos:
    - `👩‍🏫 Docente / Auxiliar — En vivo`
    - `🏫 Director Escolar — En vivo`
    - `🏛️ UGEL y Ministerio — En vivo`
  - Botón CTA Rojo (`#D91023`): **`Demostración en Vivo (Xander) ↗`** (`https://amauti.keoit.com`)
- **Captura / Activo Visual de Referencia:** [`docs/presentacion/mockup_phone_full.png`](file:///d:/Augusto/personal_portfolio/hacktheandes-educacion/docs/presentacion/mockup_phone_full.png) y [`docs/pitch/screenshots/19_documentos_papeleo_whatsapp_copiloto.png`](file:///d:/Augusto/personal_portfolio/hacktheandes-educacion/docs/pitch/screenshots/19_documentos_papeleo_whatsapp_copiloto.png).

### CAPA 2 — GUION EXACTO Y SINCRONIZACIÓN (Voz en Off)
- **Orador:** **Augusto** (con pase directo a **Xander**)
- **Ventana de Tiempo:** `0:44 - 1:08` *(24 segundos · 62 palabras)*
- **Criterio de Rúbrica:** Claridad de Propuesta de Valor (10%)
- **Texto Hablado Exacto:**
  > *"¿Por qué Amauti hace la diferencia real? **Porque cierra el ciclo completo entre la señal y el rescate.** Con un audio de 10 segundos en WhatsApp, el docente registra lo que pasa en clase y Amauti agiliza sus trámites, bitacoriza sus observaciones y le alerta qué alumnos están en riesgo, devolviéndole el tiempo para intervenir y manteniendo al director, a la UGEL y al Ministerio sincronizados en tiempo real. Ahora **Xander** se los demostrará en vivo."*

### CAPA 3 — EVIDENCIA TÉCNICA Y RESPALDO DE DEFENSA (Contexto Profundo)
- **Principio Arquitectónico ("WhatsApp es la CLI del Docente"):**
  - En lugar de añadir un formulario más, Amauti captura la señal donde nace (un audio o mensaje corto en WhatsApp del docente o auxiliar) y transforma esa única entrada en tres salidas simultáneas: (a) actualización de asistencia/notas en `ms-siagie`, (b) evaluación inmediata de reglas y apertura de bitácora en `ms-alerta`, y (c) generación automática de informes para el director y la UGEL en `ms-simon` y `ms-escale`.
- **Separación inteligente entre "Quién Usa" y "Quién Gestiona/Paga":**
  - **Quien opera en el aula (Tutor / Docente / Auxiliar):** Usa WhatsApp y su Cabina Diaria de 1 clic.
  - **Quien supervisa y asigna presupuesto (Director / UGEL / DRE / MINEDU):** Recibe la Torre de Control Web alimentada automáticamente sin pedirle un solo Excel extra al profesor.

---

# SLIDE PUENTE (INTERLUDIO): Demo en Vivo en `https://amauti.keoit.com` (`1:08 - 2:10`)

> **Nota para NotebookLM:** Durante el pitch en escenario, en el minuto `1:08` Xander cambia a la pestaña en vivo de `https://amauti.keoit.com`. Esta diapositiva sirve dentro del Deck para documentar visualmente las **3 estaciones exactas de la demostración en vivo** para los jueces que revisan la presentación de forma asíncrona.

### CAPA 1 — DISEÑO Y TEXTO EN PANTALLA (Regla de los 3 Segundos)
- **Layout Visual:** Mosaico de 3 estaciones numeradas con las capturas reales en Ultra-HD de `https://amauti.keoit.com`.
- **Kicker Superior:** `DEMOSTRACIÓN EN VIVO · HTTPS://AMAUTI.KEOIT.COM`
- **Titular Principal:** **`Del audio en el aula a la intervención y el panorama nacional en segundos.`**
- **Las 3 Estaciones Visuales en Pantalla:**
  1. **Estación 1 (`VISTA DOCENTE · HOY Y ALERTAS`):** Cabina diaria actualizada al instante desde WhatsApp: **5 alumnos que requieren atención hoy** con **SLA de 48 horas**.
     - *Capturas:* [`17_docente_hoy_tablero_diario_limpio.png`](file:///d:/Augusto/personal_portfolio/hacktheandes-educacion/docs/pitch/screenshots/17_docente_hoy_tablero_diario_limpio.png) y [`05_centro_alertas_tempranas.png`](file:///d:/Augusto/personal_portfolio/hacktheandes-educacion/docs/pitch/screenshots/05_centro_alertas_tempranas.png).
  2. **Estación 2 (`CASO NAYELI · BITÁCORA Y PLANES CIFRADOS`):** Patrón de inasistencia detectado, mensaje de acompañamiento a la familia en 1 clic, bitácora de llamadas/visitas y **Planes de Apoyo con diagnóstico confidencial cifrado (AES-256)**.
     - *Capturas:* [`07_caso_seguimiento_bitacora.png`](file:///d:/Augusto/personal_portfolio/hacktheandes-educacion/docs/pitch/screenshots/07_caso_seguimiento_bitacora.png) y [`21_planes_apoyo_diagnostico_direccion.png`](file:///d:/Augusto/personal_portfolio/hacktheandes-educacion/docs/pitch/screenshots/21_planes_apoyo_diagnostico_direccion.png).
  3. **Estación 3 (`VISTA MACRO MINEDU / UGEL · PANORAMA Y REPORTES`):** Cero Excels manuales. Consolidación en tiempo real cruzada con datos reales de deserción en regiones críticas como **Ucayali (5.11%)**.
     - *Capturas:* [`03_panorama_region_ucayali_detalle.png`](file:///d:/Augusto/personal_portfolio/hacktheandes-educacion/docs/pitch/screenshots/03_panorama_region_ucayali_detalle.png) y [`10_reportes_simon_listado.png`](file:///d:/Augusto/personal_portfolio/hacktheandes-educacion/docs/pitch/screenshots/10_reportes_simon_listado.png).

### CAPA 2 — GUION EXACTO Y SINCRONIZACIÓN (Voz en Off)
- **Orador:** **Xander**
- **Ventana de Tiempo:** `1:08 - 2:10` *(62 segundos · ~135 palabras)*
- **Criterio de Rúbrica:** **Funciona en Vivo (25% — Desempate #2) + Bonus por Tracción Real (+0.50 pts)**
- **Texto Hablado Exacto:**
  > *"Gracias, Augusto. Aquí estamos en vivo en `amauti.keoit.com`.*  
  > *(1. Vista Docente/Auxiliar — `Hoy` y `Alertas`):* *Lo que el profesor reporta por WhatsApp —asistencias, observaciones o pedidos de informes— actualiza al instante su cabina diaria. En lugar de perder horas en papeleo, aquí ve exactamente los 5 alumnos que requieren su atención hoy, con plazos de 48 horas.*  
  > *(2. Clic en `Atender caso` — `Caso de seguimiento y Bitácora`):* *Al abrir el caso de Nayeli, todo está bitacorizado: el patrón de inasistencia que detonó la alerta, el botón para enviar un mensaje de acompañamiento a la familia y el registro de cada llamada o visita. Además, en `Planes de apoyo` guardamos diagnósticos confidenciales cifrados.*  
  > *(3. Vista Macro MINEDU / UGEL — `Panorama` y `Reportes`):* *Y sin pedirle un solo Excel extra al docente, el director, la UGEL y el Ministerio reciben el reporting consolidado en tiempo real, cruzado con los datos reales de deserción en regiones críticas como Ucayali."*

### CAPA 3 — EVIDENCIA TÉCNICA Y RESPALDO DE DEFENSA (Contexto Profundo)
- **Por qué esta Demo asegura el 5/5 en "Funciona":**
  - No utiliza mocks estáticos: consulta y muta en tiempo real los 5 esquemas de PostgreSQL a través de los microservicios desplegados.
  - Muestra el flujo de extremo a extremo (End-to-End) cambiando de rol entre el ámbito de Aula/Colegio (`TEACHER`/`DIRECTOR` en Coronel Portillo, Ucayali) y el ámbito Nacional/Regional (`MINEDU_ADMIN`/`UGEL_SPECIALIST`).
  - Incluye vistas operativas adicionales listas por si el jurado pide explorarlas en el Q&A: Pase de lista diario de 30 alumnos ([`18_pase_lista_diario_aula_alumnos.png`](file:///d:/Augusto/personal_portfolio/hacktheandes-educacion/docs/pitch/screenshots/18_pase_lista_diario_aula_alumnos.png)), Registro de calificaciones CNEB (`AD`, `A`, `B`, `C`) ([`20_registro_calificaciones_competencias_aula.png`](file:///d:/Augusto/personal_portfolio/hacktheandes-educacion/docs/pitch/screenshots/20_registro_calificaciones_competencias_aula.png)), Ficha integral del estudiante ([`22_ficha_integral_estudiante_cneb.png`](file:///d:/Augusto/personal_portfolio/hacktheandes-educacion/docs/pitch/screenshots/22_ficha_integral_estudiante_cneb.png)) y Auditoría de CSVs abiertos con SHA-256 ([`14_fuentes_datos_abiertos_csv.png`](file:///d:/Augusto/personal_portfolio/hacktheandes-educacion/docs/pitch/screenshots/14_fuentes_datos_abiertos_csv.png)).

---

# SLIDE 4: Arquitectura y Complejidad Técnica (`2:10 - 2:35`)

### CAPA 1 — DISEÑO Y TEXTO EN PANTALLA (Regla de los 3 Segundos)
- **Layout Visual:** Grilla superior de **5 tarjetas verticales oscuras (`#1A2332`)** representando los 5 microservicios en NestJS (cada una con barra superior de color semántico, puerto, schema y responsabilidad) + **3 píldoras inferiores de robustez técnica**.
- **Kicker Superior:** `INGENIERÍA Y COMPLEJIDAD TÉCNICA`
- **Titular Principal:** **`5 Microservicios Desacoplados en NestJS`**
- **Grilla de 5 Microservicios (Tarjetas en Pantalla):**
  1. **`ms-auth`** (`:3000 · schema auth` · Borde Azul `#003876`): `RBAC multinivel, JWKS en caché y Argon2.`
  2. **`ms-siagie`** (`:3001 · schema siagie` · Borde Verde `#2B8A3E`): `Asistencia diaria, notas CNEB y matrícula.`
  3. **`ms-alerta`** (`:3002 · schema alerta` · Borde Rojo `#D91023`): `Motor determinista, SLA 48h y bitácora.`
  4. **`ms-simon`** (`:3003 · schema simon` · Borde Ámbar `#E6A316`): `Reportes UGEL y planes con cifrado AES-256.`
  5. **`ms-escale`** (`:3004 · schema escale` · Borde Amarillo `#FFD21F`): `Ingesta oficial CSV verificada con SHA-256.`
- **3 Pilares Inferiores de Calidad y Seguridad:**
  - `🔒 Diagnósticos de menores cifrados con AES-256`
  - `📊 448 indicadores oficiales ESCALE / SIAGIE`
  - `✅ Suite E2E y Smoke Tests entre servicios`
- **Captura / Activo Visual de Referencia:** [`docs/pitch/screenshots/14_fuentes_datos_abiertos_csv.png`](file:///d:/Augusto/personal_portfolio/hacktheandes-educacion/docs/pitch/screenshots/14_fuentes_datos_abiertos_csv.png) y diagrama de arquitectura de [`docs/superpowers/specs/2026-10-17-backend-microservicios-design.md`](file:///d:/Augusto/personal_portfolio/hacktheandes-educacion/docs/superpowers/specs/2026-10-17-backend-microservicios-design.md).

### CAPA 2 — GUION EXACTO Y SINCRONIZACIÓN (Voz en Off)
- **Orador:** **Xander**
- **Ventana de Tiempo:** `2:10 - 2:35` *(25 segundos · ~58 palabras)*
- **Criterio de Rúbrica:** **Complejidad Técnica (30% — Desempate #1) + Calidad Técnica (20%)**
- **Texto Hablado Exacto:**
  > *"Detrás de esto construimos una arquitectura real de **cinco microservicios independientes en NestJS** con esquemas aislados en PostgreSQL: autenticación RBAC con JWKS, gestión académica, motor de alertas deterministas, reportes de monitoreo con cifrado AES-256 y un motor estadístico que ingesta y verifica con hashes SHA-256 los datasets abiertos oficiales."*

### CAPA 3 — EVIDENCIA TÉCNICA Y RESPALDO DE DEFENSA (Contexto Profundo)
- **Detalle de Ingeniería por Microservicio:**
  - **Aislamiento de Datos en PostgreSQL (`base school`):** Cada microservicio posee su propio `schema.prisma`, su propio cliente generado y su propia tabla `_prisma_migrations` apuntando a su schema (`?schema=auth`, `siagie`, `alerta`, `simon`, `escale`). Dentro de cada schema existen llaves foráneas (FK) estrictas; entre servicios se referencian por **UUID v7** sin acoplamiento de tablas, comunicándose por API interna (`x-internal-key`).
  - **Seguridad Criptográfica y Identidad (`ms-auth` + `ms-simon`):**
    - Contraseñas hasheadas con **Argon2id**.
    - Tokens JWT firmados con **RS256** (llave privada cifrada en BD y llave pública servida en `/.well-known/jwks.json`, cacheada en memoria por los otros 4 microservicios para verificación sin latencia de red).
    - En `ms-simon`, los diagnósticos psicopedagógicos y médicos de menores dentro de los Planes de Apoyo se cifran en reposo con **AES-256** (`SIMON_DATA_ENCRYPTION_SECRET`).
  - **Integridad de Datos Abiertos (`ms-escale`):** Importa los CSV oficiales procesados de MINEDU/ESCALE y SIAGIE (448 registros agregados regionales y series históricas 2016–2025), calculando y verificando el **checksum SHA-256** de cada archivo para garantizar trazabilidad estadística auditable.

---

# SLIDE 5: Tradeoffs de Producto, Siguiente Paso Clave y Cierre (`2:35 - 3:00`)

### CAPA 1 — DISEÑO Y TEXTO EN PANTALLA (Regla de los 3 Segundos)
- **Layout Visual:** 2 Grandes Tarjetas Comparativas lado a lado (`Hoy en Producción` con borde superior azul `#003876` vs. `Siguiente Paso Clave` con borde superior rojo `#D91023`).
- **Kicker Superior:** `DECISIONES DE PRODUCTO Y VISIÓN`
- **Titular Principal:** **`Con Amauti, cada día en el aula cuenta.`** *(con "cada día en el aula cuenta" en rojo `#D91023`)*
- **Tarjeta Izquierda (`HOY EN PRODUCCIÓN` — Badge Verde `#E8F3EC`):**
  - Subtítulo: **`Reglas Explicables + Tiempo para el Docente`**
  - Texto corto: `Priorizamos un motor determinista auditable sobre cajas negras de IA, automatizando trámites, bitácoras y alertas desde WhatsApp para que el profesor tenga tiempo de intervenir.`
- **Tarjeta Derecha (`SIGUIENTE PASO CLAVE` — Badge Rojo `#FFEEF0`):**
  - Subtítulo: **`Planes Concretos de Nivelación y Tutoría`**
  - Texto corto: `A partir de la bitácora diaria capturada por WhatsApp, Amauti autogenerará planes pedagógicos personalizados de nivelación académica y tutoría para cada alumno en riesgo.`
- **Captura / Activo Visual de Referencia:** [`docs/pitch/screenshots/16_admin_reglas_alerta_umbrales.png`](file:///d:/Augusto/personal_portfolio/hacktheandes-educacion/docs/pitch/screenshots/16_admin_reglas_alerta_umbrales.png) y [`docs/pitch/screenshots/21_planes_apoyo_diagnostico.png`](file:///d:/Augusto/personal_portfolio/hacktheandes-educacion/docs/pitch/screenshots/21_planes_apoyo_diagnostico.png).

### CAPA 2 — GUION EXACTO Y SINCRONIZACIÓN (Voz en Off)
- **Orador:** **Xander**
- **Ventana de Tiempo:** `2:35 - 3:00` *(25 segundos · ~55 palabras)*
- **Criterio de Rúbrica:** Claridad, Honestidad Técnica y Tradeoffs (10%)
- **Texto Hablado Exacto:**
  > *"Tomamos dos decisiones clave de producto: usamos reglas deterministas configurables en vez de cajas negras de IA para que cada alerta sea auditable; y hoy nos enfocamos en liberar el tiempo del profesor automatizando su reporting y bitácora. ¿Nuestro siguiente paso clave? Que a partir de esta bitácora, Amauti genere automáticamente **planes concretos de nivelación y tutoría** para cada alumno.*  
  > *Con Amauti, cada día en el aula cuenta. Muchas gracias."*

### CAPA 3 — EVIDENCIA TÉCNICA Y RESPALDO DE DEFENSA (Contexto Profundo)
- **Por qué explicitar estos 2 Tradeoffs otorga 5/5 en Claridad:**
  - Las condiciones de entrega de Hack the Andes exigen distinguir con total honestidad **qué funciona hoy en producción** de **qué queda como siguiente paso**.
  - **Tradeoff #1 (Reglas deterministas hoy vs. ML predictivo):** Resuelve el problema real del MINEDU (la falta de explicabilidad y la latencia bimestral de Alerta Escuela). Un director necesita saber *hoy* que la alerta saltó porque *"Nayeli acumuló 3 faltas en una ventana de 7 días y cayó a C en matemáticas"*, con umbrales que él mismo o el MINEDU pueden calibrar en vivo ([`16_admin_reglas_alerta_umbrales.png`](file:///d:/Augusto/personal_portfolio/hacktheandes-educacion/docs/pitch/screenshots/16_admin_reglas_alerta_umbrales.png)).
  - **Tradeoff #2 (Desburocratización y Bitácora hoy vs. Generación Pedagógica de Nivelación mañana):** Primero había que construir la tubería de captura sin fricción (WhatsApp ➔ Bitácora estructurada) y devolverle horas de vida al docente. Con esa bitácora viva ya funcionando en producción, el siguiente paso natural es conectar la generación automática de sesiones de nivelación CNEB y planes de tutoría quirúrgica por competencia fallada.

---

## 5. BLUEPRINT DEL APÉNDICE DE DEFENSA Q&A (SLIDES A1 A A5 — LOS 2 MINUTOS DEL JURADO)

> **Propósito de esta sección en NotebookLM:** Estas 5 diapositivas de respaldo convierten cada pregunta difícil del jurado en una demostración visual de dominio técnico y de campo, asegurando los **5/5 puntos en "Funciona"** (*"aguanta preguntas fuera del guion"*) y **5/5 en "Complejidad Técnica"**.

---

# SLIDE A1 (Defensa Q&A #1): ¿Por qué 5 Microservicios y no un Monolito?

### CAPA 1 — DISEÑO Y TEXTO EN PANTALLA
- **Kicker Superior:** `DEFENSA DE ARQUITECTURA · PREGUNTA #1`
- **Pregunta del Jurado (Titular):** **`"¿Por qué 5 microservicios para un hackathon? ¿No es sobreingeniería?"`**
- **3 Bloques Visuales de Respuesta:**
  1. **Silos Reales del Estado:** `SIAGIE (matrícula), Alerta Escuela (riesgo), SIMON (monitoreo) y ESCALE (estadística) pertenecen a oficinas distintas con ciclos y esquemas incompatibles.`
  2. **Integración Gradual sin Monolito:** `Un monolito obligaría al Estado a reemplazar todo de golpe. Nuestros 5 servicios permiten adopción modular por oficina.`
  3. **Aislamiento en PostgreSQL:** `5 schemas independientes (auth, siagie, alerta, simon, escale) con migraciones Prisma aisladas y eventos internos desacoplados.`
- **Activo Visual:** Diagrama de equivalencia `Sistemas MINEDU Actuales ➔ 5 Microservicios Amauti`.

### CAPA 2 — RESPUESTA OFICIAL DE DEFENSA (Voz en Off)
> *"Al auditar los sistemas educativos del Estado descubrimos que la gestión académica (SIAGIE), las alertas tempranas (Alerta Escuela), el monitoreo docente (SIMON) y la estadística nacional (ESCALE) pertenecen a oficinas distintas con ciclos de vida y esquemas incompatibles. Si hacíamos un monolito, sería imposible integrarlo gradualmente. Diseñamos 5 servicios desacoplados (`ms-auth`, `ms-siagie`, `ms-alerta`, `ms-simon`, `ms-escale`) con sus propios schemas en PostgreSQL para que cada uno escale y se integre de forma independiente sin tumbar la operación."*

### CAPA 3 — EVIDENCIA TÉCNICA ADICIONAL
- En la realidad del MINEDU, incluso el login de Alerta Escuela está acoplado operativamente a SIAGIE. Al separar `ms-auth` (`:3000`) con **JWKS (`/.well-known/jwks.json`)**, si un servicio de reportería como `ms-simon` recibe un pico de carga al cierre de bimestre, el registro diario de asistencia en `ms-siagie` y las alertas en `ms-alerta` siguen operando con latencia cero.

---

# SLIDE A2 (Defensa Q&A #2): Privacidad y Protección de Datos de Menores (Ley N.° 29733)

### CAPA 1 — DISEÑO Y TEXTO EN PANTALLA
- **Kicker Superior:** `SEGURIDAD POR DISEÑO · PREGUNTA #2`
- **Pregunta del Jurado (Titular):** **`"¿Cómo protegen la privacidad y los datos sensibles de menores de edad?"`**
- **3 Capas de Seguridad en Pantalla:**
  1. **Capa 1 · Minimización en WhatsApp:** `El docente solo menciona nombres de pila o códigos de sección; el backend cruza la identidad internamente sin exponer DNIs en el chat.`
  2. **Capa 2 · Cifrado AES-256 en BD:** `En ms-simon, el diagnóstico reservado de los Planes de Apoyo se cifra con AES-256 (SIMON_DATA_ENCRYPTION_SECRET). Ni secretaría ni roles no autorizados pueden leerlo.`
  3. **Capa 3 · Aislamiento RBAC + E2E:** `JWT con claims de alcance (schoolId, ugelId, dreId). Suite E2E verifica que ningún docente o director acceda a otra IE.`
- **Captura de Referencia:** [`docs/pitch/screenshots/21_planes_apoyo_diagnostico_direccion.png`](file:///d:/Augusto/personal_portfolio/hacktheandes-educacion/docs/pitch/screenshots/21_planes_apoyo_diagnostico_direccion.png) y [`docs/pitch/screenshots/15_admin_usuarios_roles_celulares.png`](file:///d:/Augusto/personal_portfolio/hacktheandes-educacion/docs/pitch/screenshots/15_admin_usuarios_roles_celulares.png).

### CAPA 2 — RESPUESTA OFICIAL DE DEFENSA (Voz en Off)
> *"Aplicamos seguridad por diseño en tres capas:*  
> *1) **Minimización en WhatsApp:** el docente solo menciona nombres de pila o códigos de sección; el backend cruza la identidad internamente.*  
> *2) **Cifrado en base de datos:** en `ms-simon`, el campo de diagnóstico reservado dentro de los Planes de Apoyo se cifra con **AES-256** (`SIMON_DATA_ENCRYPTION_SECRET`) y ni secretaría ni roles no autorizados pueden desencriptarlo.*  
> *3) **Aislamiento por ámbito (RBAC):** nuestra suite E2E verifica que un director o docente jamás pueda consultar alumnos de otra institución educativa."*

### CAPA 3 — EVIDENCIA TÉCNICA ADICIONAL
- Además, los datos nominales de los estudiantes viven **únicamente** en el schema `siagie` (`ms-siagie`). Ni `ms-alerta` ni `ms-simon` duplican nombres o teléfonos en sus tablas: guardan únicamente el `student_id` (UUID v7) y resuelven la identidad en tiempo de ejecución vía API interna autenticada, registrando cada acceso en tablas `audit_logs` por servicio.

---

# SLIDE A3 (Defensa Q&A #3): Operación en Zonas Rurales sin Internet Estable (Caso Ucayali)

### CAPA 1 — DISEÑO Y TEXTO EN PANTALLA
- **Kicker Superior:** `RESILIENCIA RURAL Y AMAZONÍA · PREGUNTA #3`
- **Pregunta del Jurado (Titular):** **`"¿Qué pasa en zonas rurales como Ucayali donde no hay internet estable en el colegio?"`**
- **Comparativa Visual (Por qué ganamos en la Amazonía):**
  - **❌ Portal Web Tradicional (SIAGIE / Alerta Escuela):** `Requiere conexión síncrona en el aula y PC. Si se corta la señal en Masisea o Manantay, el registro se pierde y el docente desiste.`
  - **✅ Arquitectura Asíncrona WhatsApp + Amauti:** `Store-and-Forward nativo en el celular del docente. Graba el audio o texto sin señal en el aula; al salir del colegio y captar red 3G/datos, WhatsApp despacha el paquete, actualiza la bitácora y dispara alertas sin perder un solo registro.`
- **Captura de Referencia:** [`docs/pitch/screenshots/03_panorama_region_ucayali_detalle.png`](file:///d:/Augusto/personal_portfolio/hacktheandes-educacion/docs/pitch/screenshots/03_panorama_region_ucayali_detalle.png).

### CAPA 2 — RESPUESTA OFICIAL DE DEFENSA (Voz en Off)
> *"Esa es exactamente la razón por la que descartamos que el profesor use un portal web pesado en el aula. WhatsApp almacena los audios y mensajes de texto localmente de forma asíncrona; en cuanto el docente sale del colegio o llega a una zona con señal, el mensaje se despacha automáticamente, actualiza la bitácora y dispara las alertas sin que se pierda un solo registro."*

### CAPA 3 — EVIDENCIA TÉCNICA ADICIONAL
- **Contexto Territorial de Ucayali (`docs/desercion_por_region_siagie_2023_2024.md`):** Ucayali tiene **5.11%** de deserción en secundaria (más del doble del promedio nacional de 2.54%), con distritos amazónicos en Coronel Portillo como **Masisea (11.1%)** y **Manantay (8.4%)**. Además, las operadoras móviles en Perú incluyen **WhatsApp ilimitado (Zero-Rating)** incluso en planes prepago de S/. 5 soles, por lo que no consume el saldo de datos del docente.

---

# SLIDE A4 (Defensa Q&A #4): Reglas Deterministas vs. Modelos Predictivos de Machine Learning

### CAPA 1 — DISEÑO Y TEXTO EN PANTALLA
- **Kicker Superior:** `DECISIÓN ALGORÍTMICA Y EXPLICABILIDAD · PREGUNTA #4`
- **Pregunta del Jurado (Titular):** **`"¿Por qué usar reglas deterministas en lugar de un modelo predictivo de Machine Learning?"`**
- **Duelo Técnico en 2 Columnas:**
  - **❌ Caja Negra ML Estatal (Gradient Boosting Bimestral):**
    - `Corre cada 60 días (llega cuando el alumno ya desertó).`
    - `Inexplicable en el colegio: el director ve un semáforo rojo pero no sabe qué acción concreta tomar hoy.`
  - **✅ Motor Determinista Configurable de Amauti (`ms-alerta`):**
    - `Latencia Cero: se evalúa en el segundo exacto en que entra el audio/asistencia.`
    - `100% Explicable y Auditable: "3 faltas en ventana de 7 días" o "caída a nota C sin justificación", con umbrales editables por Dirección/MINEDU.`
- **Captura de Referencia:** [`docs/pitch/screenshots/16_admin_reglas_alerta_umbrales.png`](file:///d:/Augusto/personal_portfolio/hacktheandes-educacion/docs/pitch/screenshots/16_admin_reglas_alerta_umbrales.png).

### CAPA 2 — RESPUESTA OFICIAL DE DEFENSA (Voz en Off)
> *"El Estado ya probó modelos de Gradient Boosting que corrían cada bimestre: su problema no era el algoritmo, sino que el dato llegaba 60 días tarde y nadie en el colegio entendía por qué un alumno salía en rojo. Con reglas deterministas configurables (como 3 faltas en una ventana de 7 días o caída de calificación sin justificación), cada alerta es 100% explicable, auditable por el director y se dispara en el día exacto en que ocurre."*

### CAPA 3 — EVIDENCIA TÉCNICA ADICIONAL
- También implementamos reglas nacidas directamente del dolor docente levantado en la entrevista con Marita: por ejemplo, la alerta de **"Nota sin asistencia"** (cuando un alumno tiene calificaciones registradas pero acumula inasistencias críticas, protegiendo al docente y al colegio ante auditorías de UGEL) y el control de **SLA de 48 horas** para contacto familiar antes de escalar el caso.

---

# SLIDE A5 (Defensa Q&A #5): Evidencia de Campo y Tracción Real con Usuarios

### CAPA 1 — DISEÑO Y TEXTO EN PANTALLA
- **Kicker Superior:** `VALIDACIÓN DE CAMPO Y TRACCIÓN · PREGUNTA #5`
- **Pregunta del Jurado (Titular):** **`"¿Qué evidencia y tracción real tienen con usuarios fuera del equipo?"`**
- **3 Bloques de Evidencia Verificable:**
  1. **User Research Transcrito en el Repo:** `Entrevistas en profundidad con docentes en ejercicio (Prof. Marita Carrión) y especialistas pedagógicos (Saúl), transcritas verbatim en docs/.`
  2. **Hallazgo Clave (Ley del 80%):** `El 80% del dolor docente no es pedagógico, es la fricción de llenar reportes bimestrales, planes de apoyo (25 de 32 alumnos) y seguimiento.`
  3. **Métrica de Impacto en Vivo:** `Conector real de WhatsApp + amauti.keoit.com reducen el registro de observaciones y disparo de alertas de 25 minutos manuales a menos de 15 segundos.`
- **Captura de Referencia:** [`docs/pitch/screenshots/19_documentos_papeleo_whatsapp_copiloto.png`](file:///d:/Augusto/personal_portfolio/hacktheandes-educacion/docs/pitch/screenshots/19_documentos_papeleo_whatsapp_copiloto.png) y [`docs/pitch/screenshots/19b_documentos_aprobados.png`](file:///d:/Augusto/personal_portfolio/hacktheandes-educacion/docs/pitch/screenshots/19b_documentos_aprobados.png).

### CAPA 2 — RESPUESTA OFICIAL DE DEFENSA (Voz en Off)
> *"Realizamos investigación cualitativa a profundidad —transcrita íntegramente en nuestro repositorio— con docentes de aula en ejercicio (profesora Marita) y especialistas pedagógicos (Saúl), quienes confirmaron que el 80% de la fricción está en el llenado de reportes e informes. Desplegamos el conector real de WhatsApp junto con `amauti.keoit.com` y validamos el flujo de registro de observaciones y alertas en menos de 15 segundos frente a los 25 minutos del proceso manual."*

### CAPA 3 — EVIDENCIA TÉCNICA ADICIONAL
- **Archivos de Evidencia en el Repositorio:**
  - [`docs/transcripcion_marita.md`](file:///d:/Augusto/personal_portfolio/hacktheandes-educacion/docs/transcripcion_marita.md): Reveló cómo se pasa lista realmente (auxiliar + docente por hora pedagógica), el miedo a las auditorías de metas de atención (cierre de plazas si matriculados $\neq$ asistentes) y la carga de actualizar planes psicopedagógicos cada bimestre.
  - [`docs/transcripcion_saul.md`](file:///d:/Augusto/personal_portfolio/hacktheandes-educacion/docs/transcripcion_saul.md): Confirmó la desconexión entre la medición estandarizada y la intervención áulica oportuna.

---

## 6. COMPENDIO DE DATOS DUROS Y ARQUITECTURA (TABLAS DE CONSULTA RÁPIDA PARA NOTEBOOKLM)

### 6.1 Cifras Oficiales de Deserción y Rendimiento en el Perú (MINEDU / ESCALE / SIAGIE / UMC)
| Indicador Oficial | Valor Verificado | Fuente en el Repositorio | Uso en el Pitch / Defensa |
| :--- | :--- | :--- | :--- |
| **Desertores cada 24 horas (Nacional)** | **375 alumnos / día** *(136,745 al año)* | SIAGIE 2023→2024 (`docs/desercion_por_region_siagie_2023_2024.md`) | **Slide 1 (Hook de Augusto `0:00 - 0:13`)** |
| **Deserción Anual Secundaria (SIAGIE)** | **2.54%** *(72,282 estudiantes)* | SIAGIE 2023→2024 | Slide 1 y Vista Panorama Nacional en Demo |
| **Deserción Anual Primaria (SIAGIE)** | **1.73%** *(64,463 estudiantes)* | SIAGIE 2023→2024 | Slide 1 y Filtro Primaria en Demo |
| **Serie Interanual Secundaria (ESCALE)** | **2.7%** *(2024–2025)* · **3.7% Rural vs. 2.4% Urbano** | ESCALE Cuadro 321 (`docs/reporte_desercion_escale.md`) | Evidencia de brecha territorial rural |
| **Región Crítica Piloto: Ucayali** | **5.11% en SIAGIE** *(4.9% en ESCALE)* — Duplica media nacional | SIAGIE / ESCALE (`03_panorama_region_ucayali_detalle.png`) | **Demo en Vivo de Xander (`1:08 - 2:10`) y Slide A3** |
| **Distritos Críticos (Coronel Portillo, Ucayali)** | **Masisea (11.1%)** y **Manantay (8.4%)** | SIAGIE 2023→2024 | Respaldo territorial en Q&A |
| **Brecha "Aprobar no es Aprender" (2.° Sec.)** | **93.9% aprueba**, pero solo **18.5%** logra lectura satisfactoria y **12.7%** matemática (en Ucayali: **7.1%** y **3.4%**) | UMC / ESCALE (`docs/reporte_rendimiento_academico_oficial_peru.md`) | Justificación del **Siguiente Paso (Slide 5)**: Planes de nivelación y tutoría |
| **Latencia de Alerta Escuela (MINEDU)** | **60 días (Bimestral)** | Auditoría técnica (`docs/alerta_escuela_documentacion.md`) | **Slide 2 (Acto II `0:13 - 0:44`) y Slide A4** |
| **SLA de Intervención en Amauti** | **48 horas** desde la señal en WhatsApp | Motor `ms-alerta` (`05_centro_alertas_tempranas.png`) | **Demo en Vivo (`1:08 - 2:10`) y Slide 4** |
| **Reducción de Tiempo Operativo Docente** | De **25 minutos** (manual) a **< 15 segundos** (audio de 10s en WhatsApp) | Validación en vivo + Entrevista Marita | **Slide 3 (`0:44 - 1:08`) y Slide A5** |

### 6.2 Resumen Técnico de los 5 Microservicios de Amauti (`NestJS + Prisma + PostgreSQL`)
| Microservicio | Puerto | Schema PostgreSQL | Responsabilidad Nuclear | Mecanismo de Seguridad / Integridad |
| :--- | :---: | :---: | :--- | :--- |
| **`ms-auth`** | `:3000` | `auth` | Identidad única, 9 roles RBAC con alcance (`schoolId`, `ugelId`, `dreId`), refresh tokens rotativos con detección de reúso (`family_id`). | Hashing **Argon2id** + Firma asimétrica **RS256** publicada en `/.well-known/jwks.json` (cacheada por los demás servicios). |
| **`ms-siagie`** | `:3001` | `siagie` | Estructura territorial (DRE, UGEL, IE con `modular_code` y `attention_goal`), matrícula, asistencia diaria y por hora pedagógica, QR ingreso/salida y notas CNEB (`AD`, `A`, `B`, `C`). | Única bóveda donde residen datos nominales de menores; tabla `audit_logs` por cada lectura o mutación. |
| **`ms-alerta`** | `:3002` | `alerta` | Evaluación en tiempo real de reglas deterministas configurables, apertura de alertas por severidad (`SLA 48h`), bitácora de casos y contacto familiar por WhatsApp. | Reglas 100% explicables y auditables por el director; comunicación interna vía `x-internal-key`. |
| **`ms-simon`** | `:3003` | `simon` | Generación automática de reportes mensuales para UGEL/SIMON, visitas de monitoreo áulico y **Planes de Apoyo personalizados** por estudiante. | Campo de diagnóstico reservado de menores cifrado en reposo con **AES-256** (`SIMON_DATA_ENCRYPTION_SECRET`). |
| **`ms-escale`** | `:3004` | `escale` | Agregación de indicadores territoriales en vivo e ingesta de datasets abiertos oficiales de MINEDU/ESCALE y SIAGIE (448 valores oficiales). | Verificación criptográfica de integridad de cada dataset CSV mediante **hashes SHA-256**. |
