# Amauti — frontend

React 19 + Vite + TypeScript, con TanStack Query para los datos, React Router (rutas con carga diferida) y Tailwind v4. Se conecta a los cinco microservicios por `/api/<servicio>`: en desarrollo lo enruta Vite y en producción nginx (`deploy/`).

```sh
npm ci && npm rebuild   # una vez
npm run dev             # http://localhost:5173 (con el backend corriendo: npm run demo:stack en la raíz)
npm test                # Vitest + Testing Library, incluidas las reglas de arquitectura
npm run build           # tsc + vite build → dist/
```

## Estructura

Organizada por funcionalidad: cada dominio tiene juntos sus datos, componentes y pantallas.

```
src/
├── app/                    Arranque y composición de la aplicación
│   ├── main.tsx            Punto de entrada (fuentes, estilos, render)
│   ├── providers.tsx       TanStack Query, sesión e ilustración de estados vacíos
│   ├── App.tsx             Puerta de sesión: restaurando → login → cambio de contraseña → app
│   ├── router.tsx          Rutas; cada página se carga al visitarla (lazy)
│   └── layout/Shell.tsx    Barra lateral, cabecera, barra inferior móvil, transiciones
├── features/               Un dominio por carpeta
│   ├── <dominio>/
│   │   ├── api.ts          Hooks de TanStack Query contra su microservicio
│   │   ├── types.ts        Formas de respuesta del dominio
│   │   ├── components/     Componentes propios (con sus *.test.tsx al lado)
│   │   ├── pages/          Pantallas, cargadas solo desde app/router.tsx
│   │   └── lib/            Utilidades del dominio (p. ej. documents/lib/officeFiles.ts)
│   ├── auth/               Sesión, roles y navegación por rol, login
│   ├── home/               "Hoy" del docente
│   ├── schools/            IEs, secciones, estudiantes (ms-siagie)
│   ├── attendance/         Pase de lista (ms-siagie)
│   ├── grades/             Notas por competencia (ms-siagie)
│   ├── alerts/             Alertas, casos y reglas (ms-alerta)
│   ├── reports/ plans/ visits/ documents/   SIMON
│   ├── indicators/         Panorama y fuentes oficiales (ms-escale)
│   ├── admin/              Cuentas, roles y celular del personal (ms-auth)
│   ├── mascot/             Amauti (motor SVG + GSAP)
│   └── onboarding/         Recorrido de bienvenida por rol
├── shared/                 Reutilizable y sin conocimiento de dominios
│   ├── api/                Cliente HTTP (token, renovación única), query string
│   ├── ui/                 Primitivas (kit), marca, íconos, movimiento, ilustración inyectable
│   ├── lib/                Formato de fechas, cifras y textos; fuentes
│   └── hooks/              useIsMobile
├── styles/                 Tokens de diseño y tipografía (Tailwind v4 @theme)
└── test/setup.ts
```

## Reglas

- **Dirección de dependencias:** `app → features → shared`. `shared/` no importa `features/` ni `app/`; `features/` no importa `app/`. Cuando `shared/` necesita algo de un dominio, se le inyecta (p. ej. la mascota de los estados vacíos llega por `EmptyIllustrationContext` desde `app/providers.tsx`).
- **Entre features:** se puede usar el `api.ts`, los `types.ts` o componentes de otro dominio, nunca sus `pages/`.
- **Imports absolutos** con `@/` (`@/features/alerts/api`, `@/shared/ui/kit`); nada de `../`.
- **Pruebas al lado del código** (`*.test.ts(x)`). `src/architecture.test.ts` falla si se rompe alguna de estas reglas.
- **Sin datos inventados:** toda cifra sale de una API. Ningún dato personal en `localStorage` (refresh token en `sessionStorage`, access token en memoria).
