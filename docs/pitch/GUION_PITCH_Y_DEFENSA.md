# Guion Oficial de Pitch (3 Minutos) y Defensa Q&A (2 Minutos)
## Amauti — Continuidad Educativa, Alerta Temprana y Reporting sin Fricción
**Equipo:** Futuro Agéntico (KeoIT) · **Track:** Educación Escolar · **Hack the Andes 2026**

---

## ⏱️ Estructura Exacta: 70s Apertura (Augusto) + 110s Demo & Ingeniería (Xander)

| Tiempo | Orador | Bloque | Pantalla visible en el auditorio | Criterio Rúbrica |
| :---: | :---: | :--- | :--- | :--- |
| **`0:00 - 0:13`** | **Augusto** | **Acto I: Hook y Curiosidad** | Slide 1: **375** alumnos / 24h + Pregunta de Curiosidad | Problema e Impacto (15%) |
| **`0:13 - 0:44`** | **Augusto** | **Acto II: Tensión Visceral** | Slide 2: Punto ciego 60 días (Autopsias) + Docente solo con WhatsApp | Problema e Impacto (15%) |
| **`0:44 - 1:08`** | **Augusto** | **Acto III: La Diferencia Amauti** | Slide 3: 2 Capturas Reales WhatsApp (1. Bitácora Huamán/Lucero · 2. Alerta 4 faltas Nayeli) ➔ Plataforma Amauti en Vivo | Claridad (10%) |
| **`1:08 - 2:10`** | **Xander** | **DEMO EN VIVO (62 seg)** | **Web en vivo: `https://amauti.keoit.com`** | **Funciona (25%) + Tracción (+0.5)** |
| **`2:10 - 2:35`** | **Xander** | **Arquitectura y Complejidad** | Slide 4: 5 Microservicios NestJS + Cifrado AES-256 + SHA-256 | **Complejidad (30%) + Calidad (20%)** |
| **`2:35 - 3:00`** | **Xander** | **Tradeoffs, Siguiente Paso y Cierre** | Slide 5: Reglas deterministas + Planes de Nivelación (Roadmap) | Claridad / Tradeoffs (10%) |

---

## 🎙️ PARTE 1: Los Primeros 70 Segundos (Augusto — 167 Palabras)

### Acto I — El Hook y la Pregunta de Curiosidad (`0:00 - 0:13` · 31 palabras)
> *"Cada 24 horas, 375 alumnos escolares habrán abandonado para siempre el colegio. ¿En qué minuto exacto perdimos la oportunidad de retenerlos? ¿Fue el día que dejaron de ir, o mucho antes?"*

### Acto II — Tensión y Conflicto Visceral (`0:13 - 0:44` · 71 palabras)
> *"Lo perdimos semanas atrás, en un punto ciego de 60 días: cuando falló en matemáticas, empezó a faltar y se apagó al fondo del salón, mientras para las herramientas oficiales todo seguía 'normal'.*  
> *Los pocos sistemas del Estado hacen autopsias, no rescates: ahogan a nuestro principal agente de cambio —el profesor— en trámites institucionales, dejándolo solo, sin tiempo para intervenir y sin tecnología en el aula… salvo una que ya tiene en su bolsillo: WhatsApp."*

### Acto III — Por qué Amauti hace la diferencia + Pase a Xander (`0:44 - 1:08` · 65 palabras)
> *"¿Por qué Amauti hace la diferencia? **Porque cierra el ciclo entre la señal y el rescate.** Miren la pantalla: con un WhatsApp de 10 segundos el docente bitacoriza avances de Huamán y Lucero, y al avisar que **Nayeli Cachique** faltó 4 veces, Amauti valida la lista oficial y activa su alerta de riesgo alto al instante, sincronizando a la escuela y la UGEL sin tocar un solo papel. **Xander** se los mostrará en vivo."*

---

## 🖥️ PARTE 2: Los Siguientes 110 Segundos (Xander: Demo + Arquitectura + Tradeoffs)

### Bloque Demo en Vivo en `https://amauti.keoit.com` (`1:08 - 2:10` · 62 seg · ~135 palabras)
*(Xander toma la palabra con la plataforma ya abierta en vivo)*

> *"Gracias, Augusto. Aquí estamos en vivo en `amauti.keoit.com`.*  
> *(1. Vista Docente/Auxiliar — `Hoy` y `Alertas`):* *Lo que el profesor reporta por WhatsApp —asistencias, observaciones o pedidos de informes— actualiza al instante su cabina diaria. En lugar de perder horas en papeleo, aquí ve exactamente los 5 alumnos que requieren su atención hoy, con plazos de 48 horas.*  
> *(2. Clic en `Atender caso` — `Caso de seguimiento y Bitácora`):* *Al abrir el caso de Nayeli, todo está bitacorizado: el patrón de inasistencia que detonó la alerta, el botón para enviar un mensaje de acompañamiento a la familia y el registro de cada llamada o visita. Además, en `Planes de apoyo` guardamos diagnósticos confidenciales cifrados.*  
> *(3. Vista Macro MINEDU / UGEL — `Panorama` y `Reportes`):* *Y sin pedirle un solo Excel extra al docente, el director, la UGEL y el Ministerio reciben el reporting consolidado en tiempo real, cruzado con los datos reales de deserción en regiones críticas como Ucayali."*

### Bloque Arquitectura y Complejidad Técnica (`2:10 - 2:35` · 25 seg · ~58 palabras)
*(Xander pasa a la Slide 4: Arquitectura)*

> *"Detrás de esto construimos una arquitectura real de **cinco microservicios independientes en NestJS** con esquemas aislados en PostgreSQL: autenticación RBAC con JWKS, gestión académica, motor de alertas deterministas, reportes de monitoreo con cifrado AES-256 y un motor estadístico que ingesta y verifica con hashes SHA-256 los datasets abiertos oficiales."*

### Bloque Tradeoffs, Siguiente Paso Clave y Cierre (`2:35 - 3:00` · 25 seg · ~55 palabras)
*(Xander pasa a la Slide 5: Decisiones y Visión)*

> *"Tomamos dos decisiones clave de producto: usamos reglas deterministas configurables en vez de cajas negras de IA para que cada alerta sea auditable; y hoy nos enfocamos en liberar el tiempo del profesor automatizando su reporting y bitácora. ¿Nuestro siguiente paso clave? Que a partir de esta bitácora, Amauti genere automáticamente **planes concretos de nivelación y tutoría** para cada alumno.*  
> *Con Amauti, cada día en el aula cuenta. Muchas gracias."*

---

## 🛡️ PARTE 3: Matriz de Defensa para los 2 Minutos de Q&A (Fuera del Guion)

La rúbrica otorga **5/5 en "Funciona"** y **5/5 en "Complejidad Técnica"** cuando el equipo responde con precisión técnica y muestra evidencia en vivo ante preguntas fuera del guion:

### 1. *"¿Por qué 5 microservicios para un hackathon? ¿No es sobreingeniería?"*
> **Respuesta:** *"Al auditar los sistemas educativos del Estado descubrimos que la gestión académica (SIAGIE), las alertas tempranas (Alerta Escuela), el monitoreo docente (SIMON) y la estadística nacional (ESCALE) pertenecen a oficinas distintas con ciclos de vida y esquemas incompatibles. Si hacíamos un monolito, sería imposible integrarlo gradualmente. Diseñamos 5 servicios desacoplados (`ms-auth`, `ms-siagie`, `ms-alerta`, `ms-simon`, `ms-escale`) con sus propios schemas en PostgreSQL para que cada uno escale y se integre de forma independiente sin tumbar la operación."*

### 2. *"¿Cómo protegen la privacidad y los datos sensibles de menores de edad?"*
> **Respuesta:** *"Aplicamos seguridad por diseño en tres capas:*  
> *1) **Minimización en WhatsApp:** el docente solo menciona nombres de pila o códigos de sección; el backend cruza la identidad internamente.*  
> *2) **Cifrado en base de datos:** en `ms-simon`, el campo de diagnóstico reservado dentro de los Planes de Apoyo se cifra con **AES-256** (`SIMON_DATA_ENCRYPTION_SECRET`) y ni secretaría ni roles no autorizados pueden desencriptarlo.*  
> *3) **Aislamiento por ámbito (RBAC):** nuestra suite E2E verifica que un director o docente jamás pueda consultar alumnos de otra institución educativa."*

### 3. *"¿Qué pasa en zonas rurales como Ucayali donde no hay internet estable en el colegio?"*
> **Respuesta:** *"Esa es exactamente la razón por la que descartamos que el profesor use un portal web pesado en el aula. WhatsApp almacena los audios y mensajes de texto localmente de forma asíncrona; en cuanto el docente sale del colegio o llega a una zona con señal, el mensaje se despacha automáticamente, actualiza la bitácora y dispara las alertas sin que se pierda un solo registro."*

### 4. *"¿Por qué usar reglas deterministas en lugar de un modelo predictivo de Machine Learning?"*
> **Respuesta:** *"El Estado ya probó modelos de Gradient Boosting que corrían cada bimestre: su problema no era el algoritmo, sino que el dato llegaba 60 días tarde y nadie en el colegio entendía por qué un alumno salía en rojo. Con reglas deterministas configurables (como 3 faltas en una ventana de 7 días o caída de calificación sin justificación), cada alerta es 100% explicable, auditable por el director y se dispara en el día exacto en que ocurre."*

### 5. *"¿Qué evidencia y tracción real tienen con usuarios fuera del equipo?"*
> **Respuesta:** *"Realizamos investigación cualitativa a profundidad —transcrita íntegramente en nuestro repositorio— con docentes de aula en ejercicio (profesora Marita) y especialistas pedagógicos (Saúl), quienes confirmaron que el 80% de la fricción está en el llenado de reportes e informes. Desplegamos el conector real de WhatsApp junto con `amauti.keoit.com` y validamos el flujo de registro de observaciones y alertas en menos de 15 segundos frente a los 25 minutos del proceso manual."*
