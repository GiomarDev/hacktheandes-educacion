# Prompt de diseño — Amauti

## Estética

Servicio público educativo contemporáneo: humanista, editorial, legible, confiable, sereno, preciso y cercano.

## Referencia

No se adjuntó captura de referencia. Partir de las pantallas actuales de Amauti y del criterio de legibilidad de GOV.UK y USWDS; igualar su claridad y disciplina, sin copiar marcas, escudos, contenido ni tipografías de uso restringido. La mascota Amauti mantiene la identidad propia del piloto.

## Intención

Ayudar a docentes, tutores, dirección y especialistas UGEL/DRE a entender qué estudiantes necesitan acompañamiento y qué acción sigue. Debe sentirse como un cuaderno de trabajo público bien editado: humano y confiable, cómodo durante una jornada larga, sin apariencia de trámite hostil ni de landing comercial.

## Jerarquía y layout

Una navegación lateral clara, una cabecera compacta de contexto y un área principal generosa, alineada a la izquierda. El título explica la tarea; el texto secundario orienta; cifras y tablas permiten comparar sin esfuerzo. Una sola familia serif en los títulos principales aporta carácter educativo; sans humanista en navegación, tablas, formularios y lectura funcional. No convertir todos los bloques en tarjetas decorativas. En móvil, priorizar tarea, lectura y controles táctiles; conservar acceso a todas las secciones.

## Sistema visual

- Tipografía: Source Sans 3 de Adobe como base funcional, Source Serif 4 de Adobe para títulos de pantalla y momentos de bienvenida. Explorar una alternativa de Adobe Fonts mediante un proyecto web autorizado del usuario; nunca inventar un ID de Typekit. Fuentes locales y fallbacks fiables para la demo sin conexión al proveedor.
- Escala: texto funcional principal 16–18 px; tablas y anotaciones al menos 14 px cuando el espacio lo permita; títulos fluidos 28–40 px, interlineado y ritmo vertical consistentes en rem. Textos de lectura con ancho máximo aproximado de 65–75 caracteres. Números tabulares en indicadores y columnas numéricas, sin convertir toda la interfaz en monoespaciada.
- Paleta: tinta azul #183349; azul de acción #164e73; papel blanco #ffffff; fondo gris azulado #f2f5f7; amarillo lápiz #ffd21f solo como acento de Amauti. Conservar rojo, ámbar y verde como estados semánticos, siempre acompañados de texto.
- Bordes finos, radios moderados por función, espaciado base de 4/8 px y sombras puntuales. Contraste suficiente para texto secundario, foco visible y campos claramente identificables.
- Iconografía: seleccionar con better-icons una familia coherente de trazo abierto; incrustar SVG locales, sin descargas de iconos durante la navegación. Iconos decorativos ocultos a lectores de pantalla; acciones sin texto con nombre accesible.

## Restricciones

Siempre conservar rutas, permisos, formularios, estados de carga/error, datos procedentes de API y la mascota. Siempre español claro, mayúscula inicial normal, contraste de texto y números alineados. Nunca inventar métricas o nombres institucionales oficiales, perder etiquetas por sustituirlas con iconos, usar fuentes diminutas, bloques completos en mayúsculas, degradados decorativos o animaciones perpetuas de contenido. Nunca depender de una suscripción de Adobe para que la aplicación siga siendo legible.

## Comportamiento

Responsive desde 360 px, títulos que se ajustan sin recortes, formularios utilizables con zoom y tablas con desplazamiento local cuando sea necesario. Hover sobrio que confirme interacción, foco de teclado inequívoco, botones y campos con área táctil suficiente. Transiciones breves ligadas a acciones; respetar prefers-reduced-motion. Cargar fuentes con font-display: swap y solo los archivos necesarios; verificar en navegador escritorio y móvil, login y pantallas internas, antes de dar el diseño por terminado.

## Fuentes de investigación

- USWDS, tipografía: https://designsystem.digital.gov/components/typography/
- GOV.UK, escala: https://design-system.service.gov.uk/styles/type-scale/
- GOV.UK, uso de fuentes: https://design-system.service.gov.uk/styles/typeface/
- Adobe Source Sans 3: https://fonts.adobe.com/fonts/source-sans-3
- Adobe Source Serif 4: https://fonts.adobe.com/fonts/source-serif-4

Decisión de diseño: evitar una reproducción de GOV.UK o una combinación de serif de lujo con fondo crema. El contraste entre títulos de lectura y UI humanista sirve al contexto educativo; el amarillo queda ligado al lápiz de Amauti y el azul ordena las acciones.
