### Cierre de ciclo: Presentación interactiva desplegada, guion de pitch de 3 min y validación end-to-end con capturas reales

Hemos completado una fase crítica de cara a la evaluación final: la articulación de la historia de impacto, la preparación de los entregables del pitch y la consolidación de la evidencia operativa con capturas reales del flujo de WhatsApp sincronizado con la plataforma en producción.

#### 🚀 1. ¿Qué cambió y qué desplegamos?
- **Presentación interactiva desplegada en GitHub Pages:** Publicamos la presentación web oficial con navegación por diapositivas, notas de orador y diseño responsive en:  
  👉 [https://giomardev.github.io/hacktheandes-educacion/](https://giomardev.github.io/hacktheandes-educacion/)
- **Deck nativo `.pptx` y assets generados:** Construcción automatizada de `docs/pitch/Amauti_Pitch.pptx` con tipografía institucional, métricas oficiales y esquemas de arquitectura.
- **Capturas reales de WhatsApp integradas:** Demostración con evidencia real del bot conversacional:
  1. *Bitácora de observaciones:* Registro inmediato de notas de aula sin fricción burocrática.
  2. *Detección de riesgo alto:* Reporte de 4 inasistencias que detona al instante la alerta en el backend, la apertura del caso de seguimiento y la plantilla empática para contactar a la familia.
- **Guion de pitch milimétrico (3 minutos) + Matriz de defensa Q&A (2 minutos):**
  - **70s Apertura (Augusto):** El hook con la cifra crítica (375 alumnos abandonan cada 24h), el punto ciego de 60 días de los sistemas actuales y la solución en el bolsillo del profesor (WhatsApp).
  - **110s Demo & Ingeniería (Xander):** Recorrido en vivo por `https://amauti.keoit.com/` (cabina docente, bitácora del caso Nayeli, vista macro UGEL/MINEDU), arquitectura de 5 microservicios NestJS, cifrado AES-256 en diagnósticos y tradeoffs explicables.
  - **Matriz de defensa para Q&A:** Respuestas técnicas listas sobre modularidad de microservicios, seguridad y privacidad de menores, conectividad intermitente en zonas rurales y reglas deterministas vs. ML opaco.

#### ⚡ 2. ¿Qué funciona hoy de punta a punta?
- **Flujo móvil cero fricción:** El docente registra notas o asistencia por voz/texto en WhatsApp; el bot procesa y persiste en `ms-siagie` en tiempo real.
- **Motor de alertas deterministas (`ms-alerta`):** Detección inmediata ante reglas configurables de inasistencia o rezago, eliminando los 60 días de retraso de las plataformas oficiales.
- **Torre de control multinivel:** Vistas diferenciadas para Docente/Auxiliar (acciones diarias en 48h), Director (resumen escolar) y UGEL/DRE (indicadores agregados cruzados con datasets abiertos de ESCALE).
- **Protección de datos sensibles (`ms-simon`):** Diagnósticos confidenciales de apoyo socioemocional cifrados con AES-256 y control de acceso estricto por institución educativa (RBAC).

#### 🔗 3. Enlaces clave de la entrega
- **Plataforma web en vivo:** [https://amauti.keoit.com/](https://amauti.keoit.com/)
- **Presentación interactiva (Pitch Deck):** [https://giomardev.github.io/hacktheandes-educacion/](https://giomardev.github.io/hacktheandes-educacion/)
- **Repositorio de código:** [https://github.com/GiomarDev/hacktheandes-educacion](https://github.com/GiomarDev/hacktheandes-educacion)

#### 🎯 4. Siguientes pasos
- Ensayos cronometrados de oratoria y sincronización de la demo en vivo (3:00 min exactos).
- Incorporar retroalimentación de mentores sobre la calibración de la propuesta de valor.
- Formalizar el submission final del proyecto en la plataforma del hackathon vía `andes project submit`.
