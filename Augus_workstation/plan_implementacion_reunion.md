# Minuta Ejecutiva: Plan de Implementación y Arquitectura del Producto
> **Evidencia de Cambio de Gears (Fase de Investigación ➔ Fase de Implementación)**  
> **Fuente / Grabación de Referencia:** `WhatsApp Audio 2026-10-17 at 4.59.33 PM.mp4` (Mini-reunión de definición de plan de equipo)  
> **Fecha y Hora:** 17 de Octubre de 2026 (17:00 - 17:05 PET)  
> **Participantes:** Augusto Huerta y equipo de ingeniería / desarrollo  
> **Ubicación:** `Augus_workstation/plan_implementacion_reunion.md`  

---

## 1. Contexto Estratégico y Cambio de Gears ("Shift to Implementation")

El equipo da por cerrada la fase de investigación tras completar:
1. El diagnóstico cuantitativo oficial de deserción y rendimiento (MINEDU, ESCALE, SIAGIE, UMC).
2. La validación cualitativa en campo mediante entrevistas en profundidad a un usuario real del sistema (la docente de aula **Marita**) y a un especialista de la academia (**Saúl**).
3. La persistencia en curso del aprendizaje verbatim de dichas entrevistas (véase sesión agéntica [`Dividir Y Transcribir Video`](conversation://d9a5f650-9c31-4820-a10e-d7d9ddca77b9)).

Con esta base fáctica consolidada, el equipo realiza formalmente su **cambio de gears hacia la implementación técnica y validación comercial en vivo**.

* **Ventana de tiempo crítica:** ~2 horas de desarrollo continuo (17:00 a 19:00 PET).
* **Hito de entrega / Demo:** Máximo entre las **19:00 y 20:00 PET** (límite recomendado 19:00 - 19:30 PET para contar con la docente activa antes de su hora de descanso).
* **Tesis de Validación y Tracción Real ("Willingness to Pay"):**
  * Diferenciador competitivo ante el jurado: no presentar solo un mockup, sino un producto utilizado por un usuario real que valide la propuesta de valor con disposición a pagar.
  * Meta: Conseguir que Marita adquiera / pague simbólicamente por el servicio (ej. S/. 9 soles o modelo de suscripción freemium), logrando la **primera venta validada** del proyecto en el hackathon.

---

## 2. Arquitectura de Solución y División de Responsabilidades

### A. Backend & Canales de Entrada (WhatsApp First)
* **Arquitectura de Servicios:** Implementación modular organizada en 4 módulos o microservicios funcionales para garantizar agilidad, desacoplamiento y escalabilidad.
* **Integración Crítica con Evolution API (WhatsApp):**
  * Infraestructura desplegada en servidor / equipo propio del equipo.
  * **Principio de diseño:** *"WhatsApp es la CLI del Docente"*. Los docentes de aula experimentan alta fricción y rechazo ante sistemas web lentos o burocráticos (como Alerta Escuela o SIAGIE). El canal operativo diario por excelencia es WhatsApp mediante interacción por texto y notas de voz.
* **4 Casos de Uso / Módulos Esenciales del Asistente:**
  1. **Control de Asistencia y Tardanzas:** Registro rápido por texto o nota de voz (`"anótame la asistencia de hoy..."`).
  2. **Bitácora de Observaciones y Deficiencias:** Registro rápido del avance de estudiantes y detección temprana de alertas pedagógicas.
  3. **Generación Curricular y Desburocratización:** Asistencia ágil en redacción de planes curriculares, sesiones y trámites administrativos.
  4. **Consolidación y Exportación de Datos:** Enlace de la data conversacional hacia la base central para reportería.

### B. Frontend & Plataforma Web Institucional
* **Propósito:** El entorno web funcionará como la **Torre de Control Macro** para directivos, UGEL y decisores cuando se requiera una vista general agregada, dejando la interacción operativa diaria en WhatsApp.
* **Tareas Inmediatas del Frontend:**
  * Configuración del sistema de diseño base: paleta de colores (primarios y secundarios), tipografía institucional y mascota/identidad gráfica.
  * Definición de componentes visuales de pasos (*steps*) para el flujo de pruebas y evaluaciones.
  * Mantener el frontend desacoplado a nivel de UI general mientras se estabilizan los contratos e *inputs* de la API de backend.
* **Componente Educativo:**
  * Integrar material o video explicativo de buenas prácticas pedagógicas para docentes (requerimiento levantado en la entrevista con Marita).

---

## 3. Próximos Pasos y Coordinación

1. **Persistencia de Aprendizajes de Entrevistas:**
   * Finalizar la transcripción verbatim y consolidación de las entrevistas a Marita y Saúl para alimentar los *prompts* y casos límite del sistema ([`Dividir Y Transcribir Video`](conversation://d9a5f650-9c31-4820-a10e-d7d9ddca77b9)).
2. **Despliegue del Webhook de WhatsApp:**
   * Configuración de la instancia de Evolution API y parsing de mensajes/audios.
3. **Sincronización Pre-Demo:**
   * Ensamblaje integral backend-frontend a las 19:00 PET para pruebas de aceptación y contacto con el usuario para validación.
