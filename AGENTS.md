# AGENTS.md

Guía para agentes de IA (Claude Code, Codex, Cursor, etc.) que trabajan en este repositorio.

## Proyecto

**hacktheandes-educacion** — proyecto de KeoIT para el reto de educación de Hack the Andes.

> TODO: describir el problema, el usuario objetivo y la propuesta de solución.

## Stack

> TODO: definir stack (frontend, backend, base de datos, despliegue) y comandos.

| Tarea        | Comando |
|--------------|---------|
| Instalar     | _pendiente_ |
| Desarrollo   | _pendiente_ |
| Tests        | _pendiente_ |
| Lint/format  | _pendiente_ |
| Build        | _pendiente_ |

## Estructura

```
.
├── .agents/      # Subagentes compartidos (fuente única; .claude/agents apunta aquí)
├── .commands/    # Comandos/prompts reutilizables (fuente única; .claude/commands apunta aquí)
├── .claude/      # Config de Claude Code (settings.json + symlinks a .agents y .commands)
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
