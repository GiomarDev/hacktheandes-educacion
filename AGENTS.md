# AGENTS.md

Guía para agentes de IA (Claude Code, Codex, Cursor, etc.) que trabajan en este repositorio.

## Proyecto

**hacktheandes-educacion** — proyecto de KeoIT para el reto de educación de Hack the Andes.

Backend de AmautaIA para prevenir deserción y bajo rendimiento escolar en Perú. Docentes, tutores y directivos registran matrícula, asistencia y notas; `ms-alerta` detecta riesgos, abre casos y simula el contacto familiar. Los especialistas de UGEL/DRE acceden según su ámbito. `ms-simon` genera reportes, protege los diagnósticos de los planes, registra visitas y lleva el registro de los documentos que prepara el agente de WhatsApp. `ms-escale` importa los CSV oficiales de deserción y calcula agregados diarios e indicadores mensuales por UGEL.

## Stack

Monorepo ESM: NestJS 12, TypeScript 6, Prisma 7.10.1 y PostgreSQL. `ms-auth` sirve identidad y JWT RS256/JWKS (puerto 3000); `ms-siagie` sirve los datos escolares (3001); `ms-alerta` sirve reglas, alertas y casos (3002); `ms-simon` sirve reportes, planes y visitas (3003); `ms-escale` sirve indicadores (3004). Vitest + Supertest para pruebas, oxlint para lint y Rspack para compilar incluyendo las librerías compartidas. El frontend `apps/web` (Amauti: React 19 + Vite + TanStack Query + React Router + Tailwind) es un paquete propio con su `package.json`: landing pública en `/` sin sesión y plataforma desde `/ingresar`. En desarrollo Vite enruta `/api/<servicio>` a cada puerto y en producción lo hace nginx (`deploy/`). Producción en EasyPanel (`easypanel.compose.yml`, rama `main`, https://amauti.keoit.com). CI en `.github/workflows/ci.yml`.

| Tarea        | Comando |
|--------------|---------|
| Instalar     | Node 26; `npm ci && npm rebuild` (npm 11 omite los scripts de instalación sin `allowScripts`), `npm run auth:generate`, `npm run siagie:generate` `npm run alerta:generate`, `npm run simon:generate` y `npm run escale:generate` |
| Desarrollo   | `npm run start:auth`, `npm run start:siagie` `npm run start:alerta`, `npm run start:simon` y `npm run start:escale` en terminales separadas |
| Tests        | `npm test`, `npm run test:e2e`, `npm run test:smoke` (requiere build previo) |
| Lint/format  | `npm run lint`, `npm run typecheck`, `npm run format` |
| Build        | `npm run build` |
| Demo local   | `npm run build && npm run demo:stack` (schemas `_test`) y `npm run web:dev` |
| Frontend     | `npm --prefix apps/web ci` (y `npm rebuild` dentro), `npm run web:test`, `npm run web:build` |
| Despliegue   | Local: `docker compose -f deploy/compose.yml up --build` (puerto 8080). Producción: EasyPanel construye `easypanel.compose.yml` desde `main`; luego `migrate deploy` por servicio y `npm run demo:publish` |

- Configuración en `.env.example`; nunca mostrar ni commitear los secretos del `.env`.
- Las pruebas solo usan `auth_test`, `siagie_test`, `alerta_test`, `simon_test` y `escale_test` (derivado de la URL de prueba de SIMON si falta `ESCALE_TEST_DATABASE_URL`). `test/test-databases.ts` aborta ante otro schema. No ejecutar suites de integración simultáneas: comparten tablas de prueba y las limpian entre casos.
- Las notificaciones de F2 son simuladas por `ConsoleProvider`. No imprimir datos personales ni textos de las familias en logs. Webhooks y rutas internas exigen `x-internal-key`.
- Las escrituras de SIAGIE guardan eventos en una outbox en la misma transacción. No introducir llamadas HTTP que hagan fallar una escritura ya confirmada. Workers de entrega/inbox/notificaciones cada minuto; evaluación global cada hora. `BACKGROUND_JOBS_ENABLED=false` los desactiva para tests.
- No ejecutar seeds sobre `auth` o `siagie` sin confirmación explícita del usuario.
- SIMON: diagnóstico cifrado con clave propia; solo tutor asignado, psicología y dirección pueden leerlo. Nunca devolver ciphertext ni incluir diagnóstico en listados, reportes o auditoría. Contratos en `docs/ms-simon.md`.
- ESCALE: los indicadores oficiales son datos abiertos; los calculados se filtran por UGEL/DRE. El catálogo de indicadores vive en la migración. Contratos en `docs/ms-escale.md`.
- Frontend: capas `app/` → `features/<dominio>/` → `shared/` con alias `@/`; `src/architecture.test.ts` falla si `shared` importa features o app, si una feature importa app o páginas de otra feature, o ante imports relativos con `../`. Ningún número sin fuente en una API (la landing usa cifras derivadas de los CSV oficiales de `docs/`); no guardar datos personales en `localStorage` (refresh token en `sessionStorage`, access token en memoria). `demo:stack` limpia y siembra solo schemas `_test`: no correrlo junto a las suites e2e.
- Estado y pendientes: `docs/continuidad-backend.md`. Plan detallado: `docs/superpowers/plans/2026-10-17-backend-fundacion-auth-siagie.md`.

## Estructura

```
.
├── .agents/      # Subagentes compartidos (fuente única; .claude/agents apunta aquí)
├── .commands/    # Comandos/prompts reutilizables (fuente única; .claude/commands apunta aquí)
├── .claude/      # Config de Claude Code (settings.json + symlinks a .agents y .commands)
├── apps/         # ms-auth, ms-siagie, ms-alerta, ms-simon y ms-escale (Prisma y tests propios) y web (frontend)
├── libs/         # common (autorización y utilidades) y fixtures (IDs sintéticos compartidos)
├── test/         # Configuración y protección de las bases de prueba
├── scripts/      # Base de datos, demo local, publicación de la demo y arranque compilado
├── deploy/       # Dockerfiles, compose local y nginx (producción: easypanel.compose.yml en la raíz)
├── docs/         # Investigación, especificación, plan y registro de continuidad
├── AGENTS.md     # Este archivo: instrucciones para cualquier agente
├── CLAUDE.md     # Instrucciones específicas de Claude Code (importa AGENTS.md)
└── README.md     # Documentación para humanos
```

## Convenciones

- Idioma: documentación y mensajes de commit en español; código (identificadores) en inglés.
- Commits: [Conventional Commits](https://www.conventionalcommits.org/es/) — `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`.
- Ramas: `main` estable y desplegada en EasyPanel; `develop` integra; `pre-develop` prepara cambios antes de pasar a `develop`. Trabajo puntual en `feat/<tema>` o `fix/<tema>` desde `pre-develop`.
- `.gitignore` excluye imágenes y multimedia; los recursos del frontend en `apps/web/src/**/assets/*.png` sí se versionan. Comprobar con `git status` que un recurso importado por el código quede en el commit.
- Cambios pequeños y enfocados; no mezclar refactors con features.
- No commitear secretos: usar `.env` (ignorado) y documentar variables en `.env.example`.

## Agentes y comandos

- **Subagentes** en `.agents/*.md`: frontmatter con `name`, `description` y opcionalmente `tools`; el cuerpo es el prompt del agente.
- **Comandos** en `.commands/*.md`: cada archivo es un prompt invocable (`/<nombre>` en Claude Code). `$ARGUMENTS` se reemplaza por lo que escriba el usuario.

Para añadir uno nuevo, crea el `.md` en la carpeta correspondiente; Claude Code lo detecta vía los symlinks de `.claude/`.
