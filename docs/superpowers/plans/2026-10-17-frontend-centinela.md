# Frontend Centinela Escolar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aplicación web que convierte el bosquejo de Claude Design del equipo en pantallas conectadas a los cinco microservicios reales, por rol.

**Architecture:** `apps/web` es un paquete propio (Vite + React + TypeScript) con su `package.json`, separado del backend Nest. En desarrollo, Vite hace de proxy (`/api/auth` → 3000, `/api/siagie` → 3001, `/api/alerta` → 3002, `/api/simon` → 3003, `/api/escale` → 3004), así que el backend no necesita CORS. Los datos se piden con TanStack Query, las rutas van con React Router y los estilos con Tailwind v4 usando los tokens del diseño.

**Tech Stack:** React 19.3.0, Vite 8.3.2, TypeScript 6.0.3, React Router 7.18.4, TanStack Query 5.104.1, Tailwind CSS 4.3.3, lucide-react 1.51.0, Vitest 4.1.11 + Testing Library.

**Diseño fuente:** https://claude.ai/artifact/UT5n57ZJPMv7sX4mY3XqhB (5 pantallas: Docente, Panorama, Alertas, Detalle IE, Mobile). Es un bosquejo: los textos y métricas sin respaldo en el backend se reemplazan por datos reales.

## Global Constraints

- **Marca y tipografía:** "Centinela Escolar", con la etiqueta PILOTO. Tipografías Inter (texto) y JetBrains Mono (cifras y códigos).
- **Colores del diseño:**
  - Base: tinta `#1A2332`, fondo `#F5F7FA`, borde `#E1E5EB`, texto secundario `#5A6578`, texto tenue `#8A95A8`, barra lateral `#1A2332`/`#243043`.
  - Rojo Perú: `#D91023`. Azul institucional: `#003876`.
  - Riesgo: crítico `#C8102E`, alto `#F0633B`, medio `#E6A316`, bajo `#78B04B`, estable `#2B8A3E`.
- **Sin datos inventados.** Todo número en pantalla sale de una API. Lo que el diseño muestra sin fuente (score de ML, pesos SHAP, heladas, infraestructura, "217 840 alumnos en riesgo") no se muestra, o se sustituye por el dato real equivalente con su fuente visible.
- **Datos personales:** no guardar datos personales en `localStorage`. El refresh token vive en `sessionStorage` y el access token solo en memoria.
- **Responsive:** la barra lateral pasa a barra inferior por debajo de 768 px, como en la pantalla Mobile. Margen lateral de 16 px y sin scroll horizontal.
- **Backend:** no se tocan los schemas reales. La demo local corre sobre los schemas `_test`.

## Review Focus

1. **Access token vencido a mitad de sesión:** se renueva una sola vez con el refresh token aunque haya varias peticiones en paralelo. Si el refresh falla, se vuelve al login sin bucles.
2. **Usuario con varios roles** (por ejemplo, tutor y docente, o director y especialista): el selector de rol cambia la navegación y la pantalla de inicio.
3. **Pase de lista** con estudiantes sin marcar: no se envía. Si el envío falla, se conserva lo marcado.
4. **Listas vacías** (UGEL sin indicadores calculados, docente sin secciones): se muestra un estado vacío explicativo, no una pantalla rota.
5. **Respuesta 403 de un servicio:** el mensaje de error se muestra y la aplicación sigue funcionando.

---

### Task 1: Backend que necesita el frontend

**Files:**
- `apps/ms-siagie/src/sections/sections.controller.ts`
- `apps/ms-siagie/test/sections.e2e-spec.ts`
- `scripts/demo-stack.mjs`
- `package.json`

**Rutas y scripts:**
- `GET /sections?schoolId=&year=`: secciones a cargo del usuario. Dirección, secretaría y psicología ven todas las de su IE; tutor, auxiliar y docente solo las suyas. Cada sección trae `school { id, name, modularCode }` y `enrolledCount`.
- `GET /sections/:id/students`: ahora exige estar a cargo de la sección (corrige un hallazgo de seguridad).
- `npm run demo:stack`: aplica las migraciones y los seeds sintéticos sobre los schemas `_test` y arranca los cinco servicios. Nunca toca los schemas reales.

Tests e2e: un docente sin carga no ve la sección ajena y recibe 403 en sus estudiantes; un tutor ve la suya; dirección ve todas.

### Task 2: Esqueleto, sesión y login

**Files:** `apps/web/*` (Vite config con proxy, tokens CSS, `src/api/client.ts`, `src/auth/*`, `src/pages/Login.tsx`)

**Comportamiento:**
- `apiFetch(service, path, init)`:
  - Agrega el bearer.
  - Ante un 401, hace un único refresh compartido entre las peticiones en vuelo y reintenta una vez.
  - Lanza `ApiError { status, message }`.
- Login con DNI y contraseña. Si llega `mustChangePassword`, abre el formulario de cambio de contraseña.
- `homeFor(role)`:
  - Personal de aula → `/docente`.
  - Dirección, psicología y secretaría → `/escuela`.
  - Especialistas de UGEL o DRE y MINEDU → `/panorama`.

Tests: refresh único con dos 401 simultáneos, salida al login cuando falla el refresh, y `homeFor`.

### Task 3: Shell institucional

Barra lateral de 64 px con íconos, contador de alertas, barra superior (Gobierno del Perú · Rol activo · selector de rol · usuario) y barra inferior en móvil. La navegación cambia según el rol. Tests: navegación por rol y selector de rol.

### Task 4: Portal docente

- **Hoy:**
  - KPIs: alumnos a cargo, asistencia de la semana, alumnos con alerta abierta y pendientes.
  - "Alumnos que requieren tu atención": alertas abiertas de mis secciones, con nombres tomados de la nómina.
  - "Pendientes": secciones sin pase de lista hoy y casos propios con plazo.
- **Mi aula:** nómina y pase de lista diario (`POST /attendance/bulk`) con "todos presentes" y estados P/F/T/J.
- **Ficha del estudiante:** `GET /students/:id/summary`.

Tests: el pase de lista no se envía incompleto y conserva lo marcado si falla.

### Task 5: Alertas y casos

- **Centro de alertas:** KPIs por severidad, filtros por estado, lista con IE y sección, y acciones de reconocer, resolver o descartar.
- **Detalle de caso:** bitácora, registro de acción, contacto simulado con `requestId` y cambio de estado.

### Task 6: Panorama territorial y detalle de IE

- **Panorama:**
  - KPIs: deserción oficial (SIAGIE/ESCALE), alertas abiertas, IEs en el ámbito y casos contactados.
  - Mapa de mosaico de las 25 regiones coloreado por deserción oficial, con selector de secundaria o primaria y de periodo.
  - Indicadores mensuales por UGEL.
  - Tabla de IEs con sus alertas abiertas.
- **Detalle de IE:** datos de la IE, alertas por tipo, casos, reportes SIMON y asistencia.
- **Inicio de escuela (dirección):** el mismo detalle para su IE.

### Task 7: Reportes SIMON

Lista, generación (mensual o bimestral), envío y revisión por la UGEL, según `docs/ms-simon.md`.

### Task 8: Verificación

`npm --prefix apps/web run test`, `build` y `lint`. Además, recorrido visual con Playwright sobre `demo:stack`, a 1440 px y a 390 px, y documentación en README, AGENTS y continuidad.
