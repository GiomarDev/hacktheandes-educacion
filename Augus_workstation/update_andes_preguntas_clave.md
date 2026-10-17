### Cambio de gears: Transición a implementación y respuestas clave del reto

#### 1. ¿Quién tiene el problema y cómo lo resuelve hoy?
- **Quién usa:** Tutor de aula (primaria) o auxiliar (secundaria), quien detecta las faltas en el día a día.
- **Quién responde:** El director de la IE, único con acceso a la plataforma oficial Alerta Escuela.
- **Quién financia/paga:** La UGEL/DRE y MINEDU, sujetos a Compromisos de Desempeño y metas de permanencia escolar.
- **Cómo lo resuelven hoy:** La asistencia se anota manualmente en papel o cuadernos y se consolida bimestralmente en SIAGIE. Alerta Escuela genera semáforos tardíos (semanas después del inicio del ausentismo) y no guía la acción docente. Los reportes mensuales son una carga burocrática sin impacto preventivo en el aula.

#### 2. ¿Cuál es la acción más importante que debe poder completar esa persona?
- **Acción crítica:** Que el docente o auxiliar contacte a la familia del estudiante en la **misma semana** en que inicia un patrón de inasistencias (ej. 3 faltas en 10 días), y que dicho contacto quede registrado automáticamente sin requerir digitación extra ni formularios burocráticos.

#### 3. ¿Qué evidencia tenemos de que la solución le ayuda?
- **Evidencia cuantitativa oficial (fuerte):** Deserción secundaria a nivel nacional de 2,54% (72.282 estudiantes) con focos críticos en la Amazonía (Ucayali 5,11%; distritos como Masisea 11,1% y Manantay 8,4%). Brecha rural en 3,7% frente a 2,4% urbano. Solo 12,7% alcanza nivel satisfactorio en matemática (UMC/ESCALE).
- **Evidencia cualitativa en campo:** Entrevistas en profundidad transcritas verbatim con docente en ejercicio (Marita) y especialista académico (Saúl), quienes confirman que los docentes rechazan plataformas web adicionales y que Alerta Escuela no moviliza intervenciones a tiempo.
- **Hipótesis de validación comercial inmediata:** Pruebas de tracción en vivo con docentes midiendo disposición a pagar (*willingness-to-pay*) y uso recurrente vía WhatsApp.

#### 4. ¿Qué nos bloquea ahora y qué ayuda concreta necesitamos?
- **Validación con docentes:** Requerimos conectar con 2-3 tutores/auxiliares y 1 directivo escolar (idealmente de Ucayali/Coronel Portillo) para una prueba rápida de 15-20 min del flujo por WhatsApp.
- **Formato del seguimiento Alerta Escuela:** Confirmar el formato de reporte mensual que la UGEL exige hoy a los directores para sincronizar el formato exportable.
- **Incentivos UGEL:** Confirmación de mentores sobre los mecanismos presupuestales vigentes de los Compromisos de Desempeño 2026 vinculados a deserción.

#### 5. ¿Qué dejamos fuera para demostrar una solución que funcione?
- **Fuera de la demo:** Modelo propio de ML (usamos reglas deterministas claras y explicables), integración directa con APIs oficiales de MINEDU/SIAGIE (inexistentes/cerradas), mensajería masiva con Meta Cloud API (se simula localmente) y módulos de contenido pedagógico.
- **Dentro de la demo:** Flujo móvil WhatsApp cero fricción (asistencia por foto/texto/voz) -> detección automática del patrón de riesgo -> borrador empático de mensaje para la familia -> registro del contacto -> generación automática del informe mensual de seguimiento para Alerta Escuela / UGEL.
