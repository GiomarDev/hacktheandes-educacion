# Tipografía e interfaz de Amauti — 18 de octubre de 2026

El [prompt de diseño](2026-10-18-prompt-amauti.md) se escribió antes de instalar y aplicar `frontend-design`. La dirección combina lectura pública clara con carácter educativo: sans humanista en las tareas, serif en títulos de pantalla y el amarillo del lápiz como acento contenido.

## Investigación y decisiones

| Referencia primaria | Criterio aplicado |
| --- | --- |
| [USWDS — Typography](https://designsystem.digital.gov/components/typography/) | Letras abiertas para interfaces, jerarquía por tamaño/peso y cifras tabulares para comparar datos. USWDS documenta Source Sans Pro y Public Sans; la elección de Source Sans 3 para Amauti es una adaptación de diseño, no una exigencia gubernamental. |
| [GOV.UK — Type scale](https://design-system.service.gov.uk/styles/type-scale/) | Escala consistente, texto cómodo en móvil y unidades relativas para permitir aumento de texto. |
| [GOV.UK — Typeface](https://design-system.service.gov.uk/styles/typeface/) | Tomar criterios de claridad sin copiar GDS Transport ni la identidad oficial. |
| [Adobe — Source Sans 3](https://fonts.adobe.com/fonts/source-sans-3) y [Source Serif 4](https://fonts.adobe.com/fonts/source-serif-4) | Dos familias abiertas de Adobe: UI funcional y títulos de lectura. Se usan archivos WOFF2 locales de Fontsource, con sus licencias OFL en `apps/web/public/fonts/`. |

Se reemplazó la carga de Geist desde Google Fonts por dos WOFF2 latinos variables: Source Sans 3 (28.87 kB) y Source Serif 4 con ajuste óptico (122.36 kB). `font-display: swap` mantiene texto visible; `font-size-adjust: from-font` mejora la consistencia de la altura de letra al alternar familias. Si el navegador no admite esta última propiedad, conserva las familias de respaldo y la escala en rem.

La escala funcional principal es de 15–18 px equivalentes al tamaño base habitual, con títulos de página fluidos de 30–40 px. Se utilizan rem, interlineado sin unidades, párrafos limitados por caracteres y títulos con ajuste equilibrado. Las etiquetas auxiliares y contadores permanecen más compactos. Los números usan cifras tabulares de la sans, sin presentar todo el contenido como código.

## Cambios visibles

- Acceso con composición de lectura a dos columnas en escritorio, mensaje educativo, mascota y formulario independiente. En móvil queda una sola columna centrada en la tarea.
- Navegación lateral con etiquetas completas en escritorio, marcas activas amarillas y accesos compactos en pantallas intermedias; el menú móvil conserva todas las rutas.
- Títulos serif de pantalla, encabezados de sección sans, más espacio en tarjetas y controles de al menos 44 px en las acciones principales y el pase de lista.
- Texto secundario más contrastado y colores de estado ajustados para lectura. El significado de rojo/ámbar/verde se conserva con etiquetas.
- Enlace para saltar al contenido, foco visible, navegación lateral desplazable cuando falta altura, y respeto de movimiento reducido. Una sola transición de pantalla reemplaza las entradas en cascada de cada bloque.
- Once iconos Phosphor duotone seleccionados y obtenidos mediante `better-icons`, incluidos como SVG estático en `NavigationIcon.tsx`. Los iconos de acciones existentes se conservan; ninguna navegación descarga iconos de un proveedor. Licencia MIT y atribución en `public/icons/`.

## Conectar Adobe Fonts

La activación de fuentes de escritorio en Creative Cloud es distinta de un proyecto web. Creative Cloud quedó accesible, pero la política del navegador mantuvo bloqueado `https://fonts.adobe.com`; no se creó ni se inventó un kit de la cuenta del usuario.

La aplicación ya admite un kit autorizado:

1. En Adobe Fonts, crear un proyecto web con las familias y pesos deseados, y obtener su ID público.
2. Copiar `apps/web/.env.example` a `apps/web/.env.local` y completar `VITE_ADOBE_FONTS_KIT_ID` y los nombres CSS exactos de las familias que muestre Adobe.
3. Reiniciar Vite, o volver a compilar para producción. Solo un ID de kit válido puede producir un enlace a `https://use.typekit.net/<id>.css`.

Sin kit no hay solicitudes a Adobe. Las familias del kit se priorizan cuando su hoja carga; las fuentes locales permanecen en el respaldo. No se copian archivos de fuentes activadas por suscripción ni se piden credenciales de Adobe.

## Skills

Instaladas para este proyecto, disponibles desde `.agents/skills/` y con enlaces para Claude Code en `.claude/skills/`:

| Skill | Fuente | Uso en esta entrega |
| --- | --- | --- |
| `frontend-design` | `anthropics/skills`, `skills/frontend-design` | Dirección visual, prompt, tipografía y composición. Se ejecutó la instalación solicitada con `npx skills add`. |
| `better-icons` | `better-auth/better-icons`, `skills` | Búsqueda y obtención de SVG Phosphor con su CLI. |
| `reverse-engineer-anything` | `morluto/rea`, `.agents/skills/reverse-engineer-anything` | Instalada con referencias. No se ejecutaron herramientas de ingeniería inversa: su propia guía excluye el análisis ordinario de un repositorio fuente. |

REA y better-icons se instalaron mediante el instalador de Codex y descarga de GitHub, tras fallar la clonación del CLI por conectividad. `skills-lock.json` conserva origen, ruta y hash de carpeta con el mismo algoritmo del CLI de skills. Estas skills se detectarán en el siguiente turno de los clientes compatibles. REA como skill no registra por sí sola un servidor MCP ni instala motores nativos.

Se consultaron además las guías `typography` y `visually-stable-font-fallbacks` de `modern-web-guidance`: unidades relativas, títulos fluidos acotados, ancho de lectura y ajuste de tamaño para respaldos tipográficos.

## Verificación y demo

- `npm run web:build`: tipos y compilación correctos.
- `npm run web:test`: 34 pruebas aprobadas, incluidas cuatro de configuración opcional de Adobe y degradación ante fallo del proveedor.
- `npm run lint` y `git diff --check`: sin errores.
- Los cinco servicios del backend se regeneraron y compilaron para ejecutar la demo vigente. Con Node 22.22.2 ya instalado se aplicaron las migraciones pendientes exclusivamente a `_test` y arrancó `demo:stack`.
- Demo con 570 registros sintéticos de asistencia, importaciones oficiales e indicadores calculados. Frontend en `http://127.0.0.1:5173/`, servicios en 3000–3004. No correr e2e mientras esta demo use los schemas compartidos de prueba.
- La inspección visual automatizada de escritorio/móvil quedó pendiente: la herramienta del navegador denegó el origen local por una regla guardada. Las pruebas y compilación no sustituyen esa inspección. No se afirma que se haya realizado una revisión visual en navegador.

La aplicación conserva las rutas, reglas de acceso, datos de API, estados y flujos existentes; no se añadieron cifras de muestra a las pantallas.
