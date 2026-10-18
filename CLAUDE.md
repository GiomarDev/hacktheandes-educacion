# CLAUDE.md

@AGENTS.md

## Notas específicas para Claude Code

- Las instrucciones generales viven en `AGENTS.md`; actualiza ese archivo en lugar de duplicar contenido aquí.
- `.claude/agents` y `.claude/commands` son symlinks a `.agents/` y `.commands/`.
- `.claude/settings.json` es configuración compartida del equipo; preferencias personales van en `.claude/settings.local.json` (ignorado por git).
- Hacer commit o push solo cuando el usuario lo pida. Los commits terminan con la línea `Co-Authored-By` del agente.
- Los cambios en DNS (Hostinger), EasyPanel y la base de producción los ejecuta el usuario; el agente indica los pasos.
