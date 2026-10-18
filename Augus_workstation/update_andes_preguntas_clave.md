### Cambio de gears: Transición a implementación y respuestas clave del reto

#### 1. ¿Quién tiene el problema y cómo lo resuelve hoy?
- **Quiénes usan la solución:**
  - **Profesores (docentes de aula, tutores y auxiliares):** Son el usuario operativo diario. Por un lado, automatizan mediante WhatsApp el registro de sus observaciones diarias, bitácoras y asistencias sin fricción burocrática; por otro lado, acceden a la plataforma para ver el reporte de documentos que requieren su revisión y el listado priorizado de alumnos que necesitan tutoría urgente o están a punto de desertar.
  - **Administrativos (Directores de escuela, UGEL y MINEDU):** Directores visualizan las métricas e indicadores de retención a nivel de su escuela; especialistas de UGEL a nivel distrital/provincial; y decisores de MINEDU a nivel macro departamental y nacional.
- **Cómo lo resuelven hoy:** Anotaciones manuales en papel o cuadernos y consolidación tardía bimestral en SIAGIE. Alerta Escuela solo está disponible para el director, emite alertas con semanas de rezago cuando el abandono ya ocurrió y genera reportes administrativos que no desencadenan acciones oportunas en el aula.

#### 2. ¿Cuál es la acción más importante que debe poder completar esa persona?
- **Acción crítica:** Que el docente **maneje WhatsApp de manera fluida y sea constante en el registro de sus bitácoras cotidianas** (ingresando observaciones de comportamiento, alertas pedagógicas y asistencia mediante notas de voz o texto breve). Esta constancia alimenta en tiempo real la detección temprana sin sumar carga burocrática al maestro.

#### 3. ¿Qué evidencia tenemos de que la solución le ayuda?
- **Evidencia cuantitativa oficial (fuerte):** Deserción nacional en secundaria de 2,54% (72.282 estudiantes), con brecha rural de 3,7% y foco crítico en la Amazonía (Ucayali 5,11%; Masisea 11,1%, Manantay 8,4%). Brecha de aprendizaje: solo 12,7% alcanza nivel satisfactorio en matemática (UMC/ESCALE).
- **Evidencia cualitativa en campo:** Entrevistas en profundidad transcritas verbatim con docente en ejercicio (Marita) y especialista de la academia (Saúl) (`docs/transcripcion_marita.md`, `docs/transcripcion_saul.md`). Confirman que las plataformas administrativas no se usan en el aula y que una bitácora ágil por WhatsApp resuelve la desconexión operativa entre el aula y la dirección.
- **Validación comercial inmediata:** Pruebas de usabilidad y disposición a pagar (*willingness-to-pay*) con docentes para certificar tracción y demanda real en campo.

#### 4. ¿Qué nos bloquea ahora y qué ayuda concreta necesitamos?
- **Validación del flujo de bitácora:** Conectar con 2-3 tutores/auxiliares y 1 director de escuela (idealmente de Ucayali/Coronel Portillo) para una prueba rápida de 15 minutos de la bitácora conversacional por WhatsApp.
- **Métricas administrativas por nivel:** Validar con especialistas o mentores de gestión pública cuáles son los 3 KPIs más determinantes para la vista del director (escuela) vs. UGEL/departamento (MINEDU).
- **Incentivos institucionales:** Confirmar cómo los Compromisos de Desempeño 2026 de MINEDU vinculan presupuesto a la retención efectiva y reducción de abandono.

#### 5. ¿Qué dejamos fuera para demostrar una solución que funcione?
- **Fuera de la demo:** Modelos opacos de ML pesado (usamos reglas deterministas claras y explicables), integración con APIs cerradas del MINEDU/SIAGIE, verificación comercial de Meta Cloud API (se simula mediante webhook local) y módulos de contenido pedagógico extenso.
- **Dentro de la demo:**
  1. Interacción ágil por WhatsApp para que el docente registre de forma constante su bitácora diaria y asistencia (voz/texto).
  2. Vista del docente en la plataforma con la lista de alumnos en riesgo crítico/tutoría y documentos pendientes de revisión.
  3. Torre de control administrativa multinivel con métricas agregadas por escuela (director) y por región/departamento (UGEL/MINEDU).
