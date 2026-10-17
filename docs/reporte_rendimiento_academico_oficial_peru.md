# Informe Técnico: Estadísticas Oficiales del Rendimiento Académico y Logros de Aprendizaje Escolar en el Perú (MINEDU / ESCALE / UMC)

Este informe presenta la investigación oficial sobre el **rendimiento académico y los resultados de aprendizaje de las escuelas en el Perú**, siguiendo la metodología de extracción, validación y análisis cuantitativo implementada en la investigación de deserción escolar. Los datos provienen de los servidores oficiales de **ESCALE** (Estadística de la Calidad Educativa) y la **UMC** (Oficina de Medición de la Calidad de los Aprendizajes) del Ministerio de Educación del Perú.

---

## 1. Visualizaciones y Tablero Interactivo

> [!TIP] Tablero Interactivo
> Puedes abrir directamente en el navegador el archivo interactivo [`rendimiento_interactivo.html`](file:///d:/Augusto/personal_portfolio/hacktheandes-educacion/docs/rendimiento_interactivo.html) para explorar en vivo los datos por regiones, materias (Lectura, Matemática, Ciencias), ámbitos geográficos y años.

---

## 2. Ficha Técnica y Cuadros Oficiales de ESCALE

El portal de **Tendencias de la Calidad Educativa** de ESCALE (`https://escale.minedu.gob.pe/ueetendencias2016`) organiza las estadísticas oficiales del rendimiento académico escolar en dos grandes áreas:

| Cuadro | Nombre Oficial en la Base de Datos ESCALE | Categoría | Fuente Oficial | Años Disponibles |
| :---: | :--- | :--- | :--- | :---: |
| **Cuadro 247** | *Alumnos que logran los aprendizajes del segundo grado de primaria (% del total)* | A. Producto e Impacto | UMC (ECE / EM / ENLA) | 2016 - 2023 |
| **Cuadro 367** | *Alumnos que logran los aprendizajes del cuarto grado de primaria (% del total)* | A. Producto e Impacto | UMC (ECE / EM / ENLA) | 2016 - **2025** |
| **Cuadro 249** | *Alumnos que logran los aprendizajes del segundo grado de secundaria (% del total)* | A. Producto e Impacto | UMC (ECE / EM / ENLA) | 2016 - **2025** |
| **Cuadro 121** | *Porcentaje de aprobados, primaria, total (% de matrícula final)* | D. Permanencia y Progreso | Censo Escolar / SIAGIE | 2016 - **2025** |
| **Cuadro 135** | *Porcentaje de aprobados, secundaria, total (% de matrícula final)* | D. Permanencia y Progreso | Censo Escolar / SIAGIE | 2016 - **2025** |

### Endpoint de acceso directo
Los datos y metadatos oficiales se consultan directamente en el servlet de tendencias:
- **Vista HTML**: `https://escale.minedu.gob.pe/tendencias-2016-portlet/servlet/tendencias/archivo?idCuadro={ID}&tipo=cuadro`
- **Libro Excel**: `https://escale.minedu.gob.pe/tendencias-2016-portlet/servlet/tendencias/archivo?idCuadro={ID}&tipo=excel`
- **Ficha Metadatos PDF**: `https://escale.minedu.gob.pe/tendencias-2016-portlet/servlet/tendencias/archivo?idCuadro={ID}&tipo=meta`

---

## 3. Metodología Oficial de Evaluación (UMC / MINEDU)

El rendimiento académico en el Perú se evalúa a través de dos mecanismos complementarios con metodologías muy diferenciadas:

### 3.1 Pruebas Estandarizadas de Aprendizaje (UMC - MINEDU)
La **Oficina de Medición de la Calidad de los Aprendizajes (UMC)** evalúa censal y muestralmente las competencias fundacionales según el Currículo Nacional de la Educación Básica (CNEB) aplicando la Teoría de Respuesta al Ítem (TRI).

#### Fórmula Oficial del Indicador ($LAP_{ng}^c$)
$$LAP_{ng}^c = \frac{A_{ng}^{sc}}{A_{ng}^{ec}} \times 100$$

Donde:
* $LAP_{ng}^c$: Porcentaje de alumnos del nivel $n$ y grado $g$ que logran los aprendizajes previstos en el área o competencia $c$.
* $A_{ng}^{sc}$: Número de alumnos del nivel $n$ y grado $g$ que alcanzan el nivel **Satisfactorio** en el área $c$.
* $A_{ng}^{ec}$: Número total de alumnos del nivel $n$ y grado $g$ efectivamente evaluados en dicha competencia.

#### Escala Oficial de Niveles de Logro
1. **Satisfactorio**: El estudiante domina plenamente los aprendizajes esperados para el ciclo/grado evaluado y es capaz de resolver situaciones de complejidad esperada.
2. **En Proceso**: El estudiante logra solo parcialmente los aprendizajes y presenta dificultades evidentes.
3. **En Inicio**: El estudiante evidencia aprendizajes elementales muy por debajo de lo previsto para el grado.
4. **Previo al Inicio**: El estudiante ni siquiera responde con éxito las tareas más básicas del grado.

### 3.2 Evaluación Administrativa Continua (SIAGIE)
El sistema interno de las escuelas donde los docentes reportan bimestral o trimestralmente notas cualitativas (AD, A, B, C).
* **Fórmula de Aprobación ($PA_t$)**:
  $$PA_t = \frac{\text{Aprobados}_t}{\text{Matrícula Final}_t} \times 100$$
* **Nota histórica relevante**: En los años **2020 a 2022**, a causa de la pandemia de COVID-19, rigió la normativa de «promoción guiada» (**RVM N° 193-2020-MINEDU** y **RVM N° 334-2021-MINEDU**), lo que congeló el cómputo oficial de desaprobados en ESCALE (representado como valor `a` = No Aplica).

---

## 4. Evolución Histórica de Cifras Oficiales (2016 - 2025)

### 4.1 Educación Primaria: 4.° Grado (Cuadro 367)
*(% de estudiantes con nivel Satisfactorio)*

| Año | Tipo de Prueba | Comprensión Lectora (%) | Matemática (%) |
| :---: | :---: | :---: | :---: |
| **2016** | Censal (ECE) | 31.4% | 25.2% |
| **2018** | Censal (ECE) | 34.8% | 30.7% |
| **2019** | Censal (ECE) | 34.5% | 34.0% |
| **2022** | Muestral (EM) | 30.0% | 23.3% |
| **2023** | Nacional (ENLA) | 33.0% | 22.5% |
| **2024** | Nacional (ENLA) | 32.8% | 29.5% |
| **2025** | Nacional (ENLA) | **32.7%** | **30.0%** |

### 4.2 Educación Secundaria: 2.° Grado (Cuadro 249)
*(% de estudiantes con nivel Satisfactorio)*

| Año | Tipo de Prueba | Lectura (%) | Matemática (%) | Ciencias Sociales (%) | Ciencia y Tecnología (%) |
| :---: | :---: | :---: | :---: | :---: | :---: |
| **2016** | Censal (ECE) | 14.3% | 11.5% | 15.0% | — |
| **2018** | Censal (ECE) | 16.2% | 14.1% | 11.6% | 8.5% |
| **2019** | Censal (ECE) | 14.5% | 17.7% | — | 9.7% |
| **2022** | Muestral (EM) | 19.1% | 12.7% | — | 12.0% |
| **2023** | Nacional (ENLA) | 18.4% | 11.3% | 16.9% | — |
| **2025** | Nacional (ENLA) | **18.5%** | **12.7%** | — | **13.5%** |

---

## 5. Los 4 Hallazgos Críticos para Hack The Andes

### Hallazgo 1: La Paradoja de la Aprobación Formal vs. el Aprendizaje Real
Existe una brecha colosal y sistémica entre lo que reflejan las actas escolares y lo que los estudiantes realmente saben:
* En **Primaria**: aprueba el **97.9%**, pero solo el **32.7%** comprende lectura y **30.0%** resuelve problemas matemáticos de su grado (**brecha de ~65%**).
* En **Secundaria**: aprueba el **93.9%**, pero solo el **18.5%** comprende lectura y un mínimo **12.7%** domina matemática (**brecha de ~81%**).
* **Impacto**: Los colegios reportan éxito administrativo porque el sistema castiga la repitencia, pero los alumnos pasan de grado arrastrando vacíos cognitivos que luego detonan la deserción en 2.° y 3.° de secundaria.

### Hallazgo 2: La Catástrofe Silenciosa de la Secundaria Rural
En las escuelas rurales de secundaria, el rendimiento académico está en niveles de emergencia humanitaria educativa:
* **Lectura Satisfactoria Rural (2.° Sec):** **6.2%** (frente a 21.0% urbano).
* **Matemática Satisfactoria Rural (2.° Sec):** **6.3%** (frente a 14.0% urbano).
* **Ciencia y Tecnología Rural (2.° Sec):** **5.7%** (frente a 15.2% urbano).
* **Conclusión**: En el Perú rural, **94 de cada 100 estudiantes** terminan el segundo año de secundaria sin comprender textos elementales ni resolver cálculos esperados.

### Hallazgo 3: La Brecha de Gestión Pública vs. Privada
El tipo de administración escolar produce una segregación del aprendizaje:
* En 2.° de secundaria, los colegios privados superan en **2.6 veces** a los públicos en Lectura (**33.3% vs. 12.9%**) y en **2.4 veces** en Matemática (**21.9% vs. 9.2%**).
* Dado que el **75% de los escolares del Perú asiste a la escuela pública**, el déficit nacional está fuertemente anclado en las limitaciones de infraestructura, acompañamiento docente y conectividad del sector estatal.

### Hallazgo 4: Fractura Territorial de Aprendizajes (Top vs. Bottom)
El ranking de las 26 regiones educativas de 2025 evidencia dos realidades incompatibles:
* **Líderes consolidados:** **Moquegua** (31.1% lectura, 24.6% matemática) y **Tacna** (30.8% lectura, 27.7% matemática), que implementan planes pedagógicos locales estables y priorización presupuestal.
* **Fondo crítico:** **Loreto** (4.2% lectura, 2.1% matemática), **Ucayali** (7.1% lectura, 3.4% matemática) y **Huánuco** (7.3% lectura, 4.8% matemática). En estas regiones, menos de 3 de cada 100 alumnos logran nivel satisfactorio en ciencias y matemáticas.

---

## 6. Vinculación Estratégica con el Reto y Plataforma Alerta Escuela

1. **Usuario Primario (Gobierno Central / MINEDU / DRE):**
   - El Estado gasta recursos significativos en las evaluaciones estandarizadas anuales (ENLA) y en Alerta Escuela, pero **carece de un brazo operativo en aula** para revertir los resultados.
   - La solución debe proveer tableros de control de impacto que conecten las alertas tempranas con las micro-intervenciones pedagógicas.
2. **Usuario Secundario (Docentes y Directores de Escuela):**
   - El docente de aula hoy pierde horas llenando reportes de notas en SIAGIE y diagnósticos repetitivos.
   - Requiere herramientas de automatización e inteligencia pedagógica que le sugieran planes de recuperación curricular específicos por nivel de logro (Inicio, Proceso, Satisfactorio) sin sobrecarga burocrática.

---

## 7. Repositorio de Recursos Generados en el Proyecto

| Recurso | Tipo | Ubicación en `docs/` |
| :--- | :---: | :--- |
| **Tablero Interactivo** | HTML / Chart.js | [`docs/rendimiento_interactivo.html`](file:///d:/Augusto/personal_portfolio/hacktheandes-educacion/docs/rendimiento_interactivo.html) |
| **Dataset Completo** | JSON | [`docs/rendimiento_academico_escale.json`](file:///d:/Augusto/personal_portfolio/hacktheandes-educacion/docs/rendimiento_academico_escale.json) |
| **4.° Primaria Logros** | CSV | [`docs/primaria_4to_grado_cuadro_367.csv`](file:///d:/Augusto/personal_portfolio/hacktheandes-educacion/docs/primaria_4to_grado_cuadro_367.csv) |
| **2.° Secundaria Logros** | CSV | [`docs/secundaria_2do_grado_cuadro_249.csv`](file:///d:/Augusto/personal_portfolio/hacktheandes-educacion/docs/secundaria_2do_grado_cuadro_249.csv) |
| **2.° Primaria Logros** | CSV | [`docs/primaria_2do_grado_cuadro_247.csv`](file:///d:/Augusto/personal_portfolio/hacktheandes-educacion/docs/primaria_2do_grado_cuadro_247.csv) |
| **Aprobación Primaria** | CSV | [`docs/aprobacion_primaria_cuadro_121.csv`](file:///d:/Augusto/personal_portfolio/hacktheandes-educacion/docs/aprobacion_primaria_cuadro_121.csv) |
| **Aprobación Secundaria** | CSV | [`docs/aprobacion_secundaria_cuadro_135.csv`](file:///d:/Augusto/personal_portfolio/hacktheandes-educacion/docs/aprobacion_secundaria_cuadro_135.csv) |
