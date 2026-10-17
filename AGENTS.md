# AGENTS.md

Guía para agentes de IA (Claude Code, Codex, Cursor, etc.) que trabajan en este repositorio.

## Proyecto

**hacktheandes-educacion** — proyecto de KeoIT para el reto de educación de Hack the Andes.

Backend de AmautaIA para prevenir deserción y bajo rendimiento escolar en Perú. Docentes, tutores y directivos registran matrícula, asistencia y notas; los especialistas de UGEL/DRE acceden según su ámbito. La siguiente fase incorporará alertas e intervenciones tempranas.

## Stack

Monorepo ESM: NestJS 12, TypeScript 6, Prisma 7.10.1 y PostgreSQL. `ms-auth` sirve identidad y JWT RS256/JWKS (puerto 3000); `ms-siagie` sirve los datos escolares (3001). Vitest + Supertest para pruebas, oxlint para lint y Rspack para compilar incluyendo las librerías compartidas. Frontend y despliegue pendientes.

| Tarea        | Comando |
|--------------|---------|
| Instalar     | `npm ci` y `npm run auth:generate && npm run siagie:generate` |
| Desarrollo   | `npm run start:auth` y `npm run start:siagie` en terminales separadas |
| Tests        | `npm test`, `npm run test:e2e`, `npm run test:smoke` (requiere build previo) |
| Lint/format  | `npm run lint`, `npm run typecheck`, `npm run format` |
| Build        | `npm run build` |

- Configuración en `.env.example`; nunca mostrar ni commitear los secretos del `.env`.
- Las pruebas solo usan `auth_test` y `siagie_test`. `test/test-databases.ts` aborta ante otro schema. No ejecutar suites de integración simultáneas: comparten tablas de prueba y las limpian entre casos.
- No ejecutar seeds sobre `auth` o `siagie` sin confirmación explícita del usuario.
- Estado y pendientes: `docs/continuidad-backend.md`. Plan detallado: `docs/superpowers/plans/2026-10-17-backend-fundacion-auth-siagie.md`.

## Estructura

```
.
├── .agents/      # Subagentes compartidos (fuente única; .claude/agents apunta aquí)
├── .commands/    # Comandos/prompts reutilizables (fuente única; .claude/commands apunta aquí)
├── .claude/      # Config de Claude Code (settings.json + symlinks a .agents y .commands)
├── apps/         # ms-auth y ms-siagie, cada uno con Prisma y tests propios
├── libs/         # common (autorización y utilidades) y fixtures (IDs sintéticos compartidos)
├── test/         # Configuración y protección de las bases de prueba
├── scripts/      # Creación de base de datos y prueba de arranque compilado
├── docs/         # Investigación, especificación, plan y registro de continuidad
├── AGENTS.md     # Este archivo: instrucciones para cualquier agente
├── CLAUDE.md     # Instrucciones específicas de Claude Code (importa AGENTS.md)
└── README.md     # Documentación para humanos
```

## Convenciones

- Idioma: documentación y mensajes de commit en español; código (identificadores) en inglés.
- Commits: [Conventional Commits](https://www.conventionalcommits.org/es/) — `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`.
- Ramas: `main` estable; trabajo en `feat/<tema>` o `fix/<tema>`.
- Cambios pequeños y enfocados; no mezclar refactors con features.
- No commitear secretos: usar `.env` (ignorado) y documentar variables en `.env.example`.

## Agentes y comandos

- **Subagentes** en `.agents/*.md`: frontmatter con `name`, `description` y opcionalmente `tools`; el cuerpo es el prompt del agente.
- **Comandos** en `.commands/*.md`: cada archivo es un prompt invocable (`/<nombre>` en Claude Code). `$ARGUMENTS` se reemplaza por lo que escriba el usuario.

Para añadir uno nuevo, crea el `.md` en la carpeta correspondiente; Claude Code lo detecta vía los symlinks de `.claude/`.
