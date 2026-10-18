### Cambio de gears: Transición a implementación y respuestas clave del reto

#### 1. ¿Quién tiene el problema y cómo lo resuelve hoy?
- **Quiénes usan la solución:**
  - **Profesores (docentes de aula, tutores y auxiliares):** Son el usuario operativo diario. Por un lado, automatizan mediante WhatsApp el registro constante de sus observaciones diarias, bitácoras y asistencias sin fricción burocrática; por otro lado, acceden a la plataforma web para ver el reporte de documentos que requieren su revisión y el listado de alumnos que requieren tutoría urgente o están a punto de desertar.
  - **Administrativos (Directores de escuela, UGEL y MINEDU):** Directores visualizan las métricas de retención y alertas a nivel de su escuela; especialistas de UGEL a nivel distrital/provincial; y decisores de MINEDU a nivel nacional por departamento/región.
- **Cómo lo resuelven hoy:** Anotaciones manuales en papel o cuadernos y consolidación tardía bimestral en SIAGIE. Alerta Escuela solo está disponible para el director, emite alertas con semanas de rezago cuando el abandono ya ocurrió y genera reportes administrativos que no desencadenan acciones oportunas en el aula.

#### 2. ¿Cuál es la acción más importante que debe poder completar esa persona?
- **Acción crítica:** Que el docente **inicie un plan específico con el estudiante para evitar que deserte o para que mejore su rendimiento académico**. La **mentoría es la acción crítica**, la cual se hace posible y sostenible gracias a que el docente **sea constante en el registro de sus bitácoras cotidianas** por WhatsApp (ingresando observaciones y asistencia por notas de voz o texto con fricción cero).

#### 3. ¿Qué evidencia tenemos de que la solución le ayuda?
- **Evidencia cuantitativa oficial (fuerte):** Deserción nacional en secundaria de 2,54% (72.282 estudiantes), con brecha rural de 3,7% y foco crítico en la Amazonía (Ucayali 5,11%; Masisea 11,1%, Manantay 8,4%). Brecha de aprendizaje: solo 12,7% alcanza nivel satisfactorio en matemática (UMC/ESCALE).
- **Evidencia cualitativa en campo:** Entrevistas en profundidad transcritas verbatim con docente en ejercicio (Marita) y especialista de la academia (Saúl) (`docs/transcripcion_marita.md`, `docs/transcripcion_saul.md`). Confirman que las plataformas administrativas no se usan en el aula y que una bitácora ágil por WhatsApp resuelve la desconexión operativa entre el aula y la dirección.
- **Validación comercial inmediata:** Pruebas de usabilidad y disposición a pagar (*willingness-to-pay*) con docentes para certificar tracción y demanda real en campo.

#### 4. ¿Qué nos bloquea ahora y qué ayuda concreta necesitamos?
- **Validación con docentes:** Encontrar profesores de nivel primaria y secundaria que les interese probar la plataforma y la interacción conversacional por WhatsApp.
- **Integración con sistemas oficiales:** Verificar cómo funcionan o entregan datos **Alerta Escuela, SIMON y ESCALE** para integrar sus datos a la plataforma (formatos de exportación, periodicidad y estructura de datos).
- **Incentivos institucionales:** Confirmar con mentores o especialistas cómo los Compromisos de Desempeño 2026 de MINEDU/UGEL vinculan incentivos presupuestales a la retención efectiva y permanencia escolar.

#### 5. ¿Qué dejamos fuera para demostrar una solución que funcione?
- **Fuera de la demo:** Modelos opacos de ML pesado (usamos reglas deterministas claras y explicables), integración en vivo con APIs cerradas del MINEDU/SIAGIE y verificación comercial de Meta Cloud API (se simula localmente).
- **Dentro de la demo:**
  1. Interacción ágil por WhatsApp para que el docente sea constante con su bitácora diaria y asistencia (voz/texto).
  2. **Generador de plan de intervención/mentoría:** Herramienta que genera automáticamente un plan para que el docente intervenga y realice una sesión personalizada con el alumno a fin de que no se desvíe ni abandone, mejorando su rendimiento.
  3. Vista del docente en plataforma con los alumnos priorizados para tutoría y documentos que requieren su revisión.
  4. Torre de control administrativa multinivel con métricas agregadas por escuela (director) y por región/departamento (UGEL/MINEDU).
