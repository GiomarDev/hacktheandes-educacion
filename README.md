# hacktheandes-educacion

Proyecto del equipo **Futuro Agéntico** (KeoIT) para el reto de **Educación Escolar** de [Hack the Andes](https://hacktheandes.com).

El proyecto aborda la problemática de la **deserción escolar y el bajo rendimiento académico** en el sistema educativo peruano, transformando diagnósticos reactivos y burocráticos en un sistema proactivo asistido por agentes de Inteligencia Artificial que conecta a docentes, directivos y decisores gubernamentales con intervenciones tempranas y oportunas.

---

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
│   └── skills/chofex-hackathon/            # Skill oficial Hack the Andes (CLI andes)
│       ├── SKILL.md
│       └── references/
├── .claude/                                # Configuración de Claude Code
├── .commands/                              # Comandos reutilizables (/commit, /review)
├── docs/                                   # Documentación técnica, datasets y tableros
│   ├── alerta_escuela_documentacion.md     # Auditoría integral del sistema Alerta Escuela
│   ├── reporte_desercion_escale.md         # Informe técnico y réplica de deserción ESCALE
│   ├── desercion_por_region_siagie_2023_2024.md # Deserción por región y distrito (SIAGIE)
│   ├── reporte_rendimiento_academico_oficial_peru.md # Informe técnico de rendimiento y UMC
│   ├── desercion_interactiva.html          # Tablero interactivo de deserción secundaria
│   ├── rendimiento_interactivo.html        # Tablero interactivo de rendimiento escolar
│   ├── rendimiento_academico_escale.json   # Datasets agregados MINEDU/ESCALE
│   └── *.csv                               # Datasets limpios por cuadros estadísticos
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
