# Cómo se evalúa a los equipos

> **Evento:** Hack the Andes · Lima · 17 y 18 de octubre de 2026  
> **Organizan:** Perú Tech Week · Chofex · Crafter Station  
> **Referencia:** Software, APIs y datos abiertos · 30 horas · 3 tracks · 5 jurados · [hacktheandes.com](https://hacktheandes.com)

---

## PASO 0: Requisitos para entrar a la evaluación

> [!IMPORTANT]
> **Hora límite: Domingo 18, 09:00**  
> *Si falta uno de estos requisitos, el equipo no se puntúa.*

1. **URL pública:** Desplegado en internet. `localhost` **no** cuenta.
2. **Demo en vivo:** La demostración debe correr en vivo. Slides o video grabado **no** cuentan.
3. **Código en GitHub:** El repositorio debe entregarse con su respectiva URL.

---

## PASO 1: El puntaje global

$$\text{Puntaje Técnico (hasta 3,75)} + \text{Puntaje de Producto (hasta 1,25)} + \text{Bonus por Tracción (hasta 0,5)} = \mathbf{5,5\text{ máx.}}$$

| Bloque | Ponderación | Puntaje Máximo | Descripción |
| :--- | :---: | :---: | :--- |
| **Puntaje Técnico** | 75% de la nota | **hasta 3,75 pts** | Qué tan difícil y qué tan bien está construido. |
| **Puntaje de Producto** | 25% de la nota | **hasta 1,25 pts** | Para quién es y cómo lo explican. |
| **Bonus por Tracción** | Opcional | **hasta 0,5 pts** | Usuarios reales conseguidos durante el hackathon. |
| **TOTAL MÁXIMO** | | **5,5 puntos** | |

> **Metodología de cálculo:**  
> Cada uno de los **5 jurados** puntúa cada criterio en escala de **1 a 5**. Se multiplica por su respectivo peso y se suma; el total final es el **promedio de los 5 jurados**.

---

## PASO 2: Qué se puntúa en detalle

### 🛠️ Bloque Técnico (75% / hasta 3,75 pts)
*Qué tan difícil y qué tan bien está construido.*

#### 1. Complejidad Técnica (30%)
*Qué tan difícil es lo que construyeron y si lo resolvieron ellos.*
- **1 pt:** Wrapper de una API o CRUD simple.
- **3 pts:** Integra APIs, datos o un modelo con lógica propia.
- **5 pts:** Datos reales, modelos o servicios orquestados, arquitectura no trivial.

#### 2. Funciona (25%)
*El flujo completo corre en vivo desde la URL pública.*
- **1 pt:** Falla en vivo.
- **3 pts:** Corre con datos de juguete / mock data.
- **5 pts:** Corre con datos reales y aguanta preguntas fuera del guion.

#### 3. Calidad Técnica (20%)
*El código en GitHub es sólido.*
- **1 pt:** Frágil o con secretos (tokens, keys) en el repo.
- **3 pts:** Ordenado, con atajos.
- **5 pts:** Maneja errores, casos borde y credenciales adecuadamente.

---

### 🎯 Bloque de Producto (25% / hasta 1,25 pts)
*Para quién es y cómo lo explican.*

#### 1. Problema e Impacto (15%)
*Un problema del track para un usuario real.*
- **1 pt:** Tema genérico.
- **5 pts:** Usuario específico y evidencia concreta del problema.

#### 2. Claridad (10%)
*Explican decisiones y tradeoffs.*
- **1 pt:** No se entiende qué hicieron.
- **5 pts:** Queda claro qué hicieron, por qué lo hicieron y qué quedó fuera.

---

### 🚀 Bonus: Tracción (+0,5 pts)
*Premia a quien consigue usuarios reales durante el hackathon. No reemplaza lo técnico: se suma encima.*

- **0 pts:** Sin usuarios fuera del equipo, o sin evidencia.
- **+0,25 pts:** Personas fuera del equipo lo usaron, y se ve en registros o datos.
- **+0,5 pts:** Uso repetido, volumen visible, lista de espera real o un pago.

> [!WARNING]
> **Validez de la evidencia:**  
> La evidencia debe mostrarse **desde el producto**. Capturas de pantalla solas, cuentas de los propios integrantes del equipo o tráfico automatizado **no cuentan**.

---

## Ejemplo de cálculo (Un equipo, un jurado)

| Criterio | Nota (1-5) | Peso | Puntos obtenidos |
| :--- | :---: | :---: | :---: |
| **Complejidad técnica** | 4 | $\times\,0,30$ | 1,20 |
| **Funciona** | 5 | $\times\,0,25$ | 1,25 |
| **Calidad técnica** | 3 | $\times\,0,20$ | 0,60 |
| **Subtotal Técnico** | | | **3,05 / 3,75** |
| **Problema e impacto** | 4 | $\times\,0,15$ | 0,60 |
| **Claridad** | 3 | $\times\,0,10$ | 0,30 |
| **Subtotal de Producto** | | | **0,90 / 1,25** |
| **Bonus por tracción** | | | **+0,25** |
| **TOTAL** | | | **4,20 / 5,5** |

---

## Criterio de desempate

En caso de empate en la puntuación final:
1. 🥇 **Gana el mayor puntaje en *Complejidad técnica*.**
2. 🥈 **Si sigue empatado, gana el mayor puntaje en *Funciona*.**
