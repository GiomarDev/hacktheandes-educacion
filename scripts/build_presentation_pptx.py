"""
Generador de Presentación PPTX: Flujo de Interacción WhatsApp - Perspectiva Docente
Proyecto: AmautaIA (Equipo Futuro Agéntico - Reto Educación Escolar / Hack the Andes 2026)
"""

import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

OUTPUT_FILE = "docs/presentacion/flujo_whatsapp_docente.pptx"
ASSETS_DIR = "docs/presentacion"

# Paleta Ejecutiva (Dark Tech Institucional)
COLOR_BG = RGBColor(11, 20, 32)           # #0b1420 Fondo oscuro elegante
COLOR_CARD = RGBColor(22, 32, 48)         # #162030 Tarjetas contenedoras
COLOR_CARD_BORDER = RGBColor(38, 52, 74)  # #26344a Borde sutil de tarjeta
COLOR_TITLE = RGBColor(255, 255, 255)     # #ffffff Blanco puro
COLOR_SUBTITLE = RGBColor(148, 163, 184)  # #94a3b8 Gris claro
COLOR_BODY = RGBColor(226, 232, 240)      # #e2e8f0 Texto principal
COLOR_MUTED = RGBColor(100, 116, 139)     # #64748b Texto secundario
COLOR_GREEN = RGBColor(0, 168, 132)       # #00a884 Verde WhatsApp
COLOR_GREEN_BG = RGBColor(6, 78, 59)      # #064e3b Verde fondo badge
COLOR_AMBER = RGBColor(245, 158, 11)      # #f59e0b Ámbar alerta
COLOR_BLUE = RGBColor(37, 99, 235)        # #2563eb Azul institucional
COLOR_ROJO = RGBColor(217, 16, 35)        # #d91023 Rojo Perú / alerta
COLOR_CARD_ALT = RGBColor(17, 24, 39)     # #111827 Fondo contraste

def create_deck():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    def set_slide_background(slide):
        """Dibuja un fondo oscuro con degradé sutil o tarjeta base completa"""
        bg_shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
        bg_shape.fill.solid()
        bg_shape.fill.fore_color.rgb = COLOR_BG
        bg_shape.line.fill.background() # sin borde
        return bg_shape

    def add_header(slide, tag_text, title_text, subtitle_text):
        """Header estándar elegante para cada diapositiva"""
        # Tag pill
        tag_box = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(0.45), Inches(3.2), Inches(0.36))
        tag_box.fill.solid()
        tag_box.fill.fore_color.rgb = COLOR_CARD_BORDER
        tag_box.line.fill.background()
        tf_tag = tag_box.text_frame
        tf_tag.word_wrap = True
        p_tag = tf_tag.paragraphs[0]
        p_tag.text = tag_text.upper()
        p_tag.font.name = "Segoe UI"
        p_tag.font.size = Pt(10)
        p_tag.font.bold = True
        p_tag.font.color.rgb = COLOR_GREEN
        p_tag.alignment = PP_ALIGN.CENTER

        # Título principal
        tx_title = slide.shapes.add_textbox(Inches(0.8), Inches(0.85), Inches(11.7), Inches(0.65))
        tf_t = tx_title.text_frame
        tf_t.word_wrap = True
        p_t = tf_t.paragraphs[0]
        p_t.text = title_text
        p_t.font.name = "Segoe UI"
        p_t.font.size = Pt(24)
        p_t.font.bold = True
        p_t.font.color.rgb = COLOR_TITLE

        # Subtítulo explicativo
        tx_sub = slide.shapes.add_textbox(Inches(0.8), Inches(1.45), Inches(11.7), Inches(0.5))
        tf_s = tx_sub.text_frame
        tf_s.word_wrap = True
        p_s = tf_s.paragraphs[0]
        p_s.text = subtitle_text
        p_s.font.name = "Segoe UI"
        p_s.font.size = Pt(13)
        p_s.font.color.rgb = COLOR_SUBTITLE

    # -------------------------------------------------------------
    # SLIDE 1: PORTADA EJECUTIVA
    # -------------------------------------------------------------
    slide1 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide1)

    # Decoración lateral izquierda (acento verde/azul)
    accent_bar = slide1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(1.2), Inches(0.1), Inches(4.5))
    accent_bar.fill.solid()
    accent_bar.fill.fore_color.rgb = COLOR_GREEN
    accent_bar.line.fill.background()

    # Badge de evento
    event_badge = slide1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.1), Inches(1.2), Inches(4.5), Inches(0.4))
    event_badge.fill.solid()
    event_badge.fill.fore_color.rgb = COLOR_CARD
    event_badge.line.color.rgb = COLOR_CARD_BORDER
    p = event_badge.text_frame.paragraphs[0]
    p.text = "HACK THE ANDES 2026 · RETO EDUCACIÓN ESCOLAR"
    p.font.name = "Segoe UI"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = COLOR_GREEN

    # Título principal de la portada
    tb_title = slide1.shapes.add_textbox(Inches(1.05), Inches(1.75), Inches(6.8), Inches(1.8))
    tf = tb_title.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "Amauta·IA: Flujo WhatsApp para el Docente"
    p.font.name = "Segoe UI"
    p.font.size = Pt(32)
    p.font.bold = True
    p.font.color.rgb = COLOR_TITLE

    p2 = tf.add_paragraph()
    p2.text = "Demostración de cómo un audio de 3 segundos se transforma en un registro curricular oficial con cero burocracia."
    p2.font.name = "Segoe UI"
    p2.font.size = Pt(15)
    p2.font.color.rgb = COLOR_SUBTITLE
    p2.space_before = Pt(12)

    # 3 Tarjetas de pilares clave
    pillars = [
        ("🎙️ 100% Manos Libres", "El profesor habla naturalmente en clase; no abre apps ni llena formularios."),
        ("🔍 Desambiguación Proactiva", "Cruce instantáneo con la lista del aula para evitar confusiones de homónimos."),
        ("📋 Alineamiento CNEB", "Mapeo semántico automático a las competencias oficiales del Currículo Nacional.")
    ]
    for i, (p_title, p_desc) in enumerate(pillars):
        card = slide1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.1), Inches(3.9 + (i * 1.05)), Inches(6.6), Inches(0.9))
        card.fill.solid()
        card.fill.fore_color.rgb = COLOR_CARD
        card.line.color.rgb = COLOR_CARD_BORDER
        ctf = card.text_frame
        ctf.word_wrap = True
        
        cp1 = ctf.paragraphs[0]
        cp1.text = p_title
        cp1.font.name = "Segoe UI"
        cp1.font.size = Pt(13)
        cp1.font.bold = True
        cp1.font.color.rgb = COLOR_GREEN

        cp2 = ctf.add_paragraph()
        cp2.text = p_desc
        cp2.font.name = "Segoe UI"
        cp2.font.size = Pt(11)
        cp2.font.color.rgb = COLOR_BODY

    # Imagen del celular en la derecha
    phone_full_path = os.path.join(ASSETS_DIR, "mockup_phone_full.png")
    if os.path.exists(phone_full_path):
        slide1.shapes.add_picture(phone_full_path, Inches(8.3), Inches(0.6), height=Inches(6.4))

    # -------------------------------------------------------------
    # SLIDE 2: PANORAMA GENERAL DEL FLUJO (3 PASOS)
    # -------------------------------------------------------------
    slide2 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide2)
    add_header(slide2, "Arquitectura de la Experiencia Docente", 
               "El Flujo Conversacional en 3 Fases Clave", 
               "Diseñado específicamente para el ritmo acelerado del aula: simple para el docente, potente bajo el capó.")

    # Celular en el centro/izquierda
    if os.path.exists(phone_full_path):
        slide2.shapes.add_picture(phone_full_path, Inches(0.8), Inches(1.9), height=Inches(5.2))

    # 3 Tarjetas explicativas conectadas en la derecha
    steps_info = [
        ("PASO 1: ENTRADA POR VOZ", "El docente envía un audio breve de 3 seg.", 
         "El sistema transcribe con Whisper, identifica la intención ('participó en lectura') y detecta qué dato falta para completar el registro.",
         COLOR_GREEN),
        ("PASO 2: CONSULTA Y DESAMBIGUACIÓN", "El docente responde 'Huamán' por audio.", 
         "El agente consulta la nómina escolar y detecta 2 homónimos (Brayan y Sheyla). Pregunta con calidez en vez de cometer errores.",
         COLOR_AMBER),
        ("PASO 3: VINCULACIÓN CNEB Y CIERRE", "El docente confirma 'Sheyla' por audio.", 
         "El sistema vincula la observación con la competencia curricular oficial y confirma el registro listo para SIAGIE.",
         COLOR_BLUE)
    ]
    for idx, (st_badge, st_title, st_desc, st_color) in enumerate(steps_info):
        card_y = Inches(1.9 + (idx * 1.7))
        c = slide2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(4.5), card_y, Inches(8.0), Inches(1.5))
        c.fill.solid()
        c.fill.fore_color.rgb = COLOR_CARD
        c.line.color.rgb = COLOR_CARD_BORDER

        # Barra lateral de color en cada card
        s_bar = slide2.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(4.5), card_y, Inches(0.12), Inches(1.5))
        s_bar.fill.solid()
        s_bar.fill.fore_color.rgb = st_color
        s_bar.line.fill.background()

        ctf = c.text_frame
        ctf.word_wrap = True
        
        p1 = ctf.paragraphs[0]
        p1.text = st_badge
        p1.font.name = "Segoe UI"
        p1.font.size = Pt(10)
        p1.font.bold = True
        p1.font.color.rgb = st_color

        p2 = ctf.add_paragraph()
        p2.text = st_title
        p2.font.name = "Segoe UI"
        p2.font.size = Pt(13)
        p2.font.bold = True
        p2.font.color.rgb = COLOR_TITLE

        p3 = ctf.add_paragraph()
        p3.text = st_desc
        p3.font.name = "Segoe UI"
        p3.font.size = Pt(11)
        p3.font.color.rgb = COLOR_BODY
        p3.space_before = Pt(4)

    # -------------------------------------------------------------
    # SLIDE 3: PASO 1 - SOLICITUD POR AUDIO Y DETECCIÓN
    # -------------------------------------------------------------
    slide3 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide3)
    add_header(slide3, "Paso 1 · Interacción Inicial", 
               "Captura Rápida de Voz y Detección de Intención", 
               "El profesor no escribe: graba un audio de 3 segundos mientras atiende a sus alumnos.")

    p1_path = os.path.join(ASSETS_DIR, "mockup_phone_step1.png")
    if os.path.exists(p1_path):
        slide3.shapes.add_picture(p1_path, Inches(0.8), Inches(1.9), height=Inches(5.2))

    # Panel lateral derecho con detalles
    # Tarjeta 1: Acción del Docente
    card_doc = slide3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(4.5), Inches(1.9), Inches(8.0), Inches(1.6))
    card_doc.fill.solid()
    card_doc.fill.fore_color.rgb = COLOR_CARD
    card_doc.line.color.rgb = COLOR_CARD_BORDER
    tf = card_doc.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "1. ACCIÓN DEL PROFESOR (AULA EN VIVO)"
    p.font.name = "Segoe UI"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = COLOR_GREEN

    p2 = tf.add_paragraph()
    p2.text = "🎙️ Nota de voz de 3 segundos (1:31 a.m.):"
    p2.font.name = "Segoe UI"
    p2.font.size = Pt(12)
    p2.font.bold = True
    p2.font.color.rgb = COLOR_TITLE
    p2.space_before = Pt(4)

    p3 = tf.add_paragraph()
    p3.text = "\"Un estudiante participó mucho en la clase de lectura hoy, pero se me pasó anotar su nombre en el momento...\""
    p3.font.name = "Segoe UI"
    p3.font.size = Pt(11)
    p3.font.italic = True
    p3.font.color.rgb = COLOR_BODY

    # Tarjeta 2: Qué hace el Agente
    card_agent = slide3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(4.5), Inches(3.65), Inches(8.0), Inches(3.45))
    card_agent.fill.solid()
    card_agent.fill.fore_color.rgb = COLOR_CARD
    card_agent.line.color.rgb = COLOR_CARD_BORDER
    tf = card_agent.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "2. QUÉ PROCESA EL ASISTENTE (DETRÁS DE ESCENA)"
    p.font.name = "Segoe UI"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = COLOR_AMBER

    points = [
        ("Transcripción Instantánea (Speech-to-Text):", "Convierte el audio del aula a texto mediante modelos de lenguaje optimizados para español peruano."),
        ("Extracción Semántica de Entidades:", "Identifica que se trata de un logro de participación en el área de Comunicación / Comprensión Lectora."),
        ("Detección de Dato Faltante (Slot Filling):", "El sistema no falla ni rechaza el pedido: detecta proactivamente que falta el nombre del alumno."),
        ("Respuesta Guiada y Amable:", "\"Entendí que un estudiante participó mucho en la clase de lectura, pero necesito que me indiques su nombre. ¿A quién te refieres? 📋\"")
    ]
    for p_title, p_body in points:
        p_item = tf.add_paragraph()
        p_item.text = f"• {p_title} "
        p_item.font.name = "Segoe UI"
        p_item.font.size = Pt(11)
        p_item.font.bold = True
        p_item.font.color.rgb = COLOR_TITLE
        p_item.space_before = Pt(6)

        p_item_body = tf.add_paragraph()
        p_item_body.text = f"  {p_body}"
        p_item_body.font.name = "Segoe UI"
        p_item_body.font.size = Pt(10)
        p_item_body.font.color.rgb = COLOR_SUBTITLE

    # -------------------------------------------------------------
    # SLIDE 4: PASO 2 - VALIDACIÓN EN NÓMINA Y HOMÓNIMOS
    # -------------------------------------------------------------
    slide4 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide4)
    add_header(slide4, "Paso 2 · Búsqueda y Validación", 
               "Resolución de Ambigüedad y Detección de Homónimos", 
               "El docente dice solo el apellido; el sistema cruza con la nómina escolar y evita errores humanos.")

    p2_path = os.path.join(ASSETS_DIR, "mockup_phone_step2.png")
    if os.path.exists(p2_path):
        slide4.shapes.add_picture(p2_path, Inches(0.8), Inches(1.9), height=Inches(5.2))

    card_s4 = slide4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(4.5), Inches(1.9), Inches(8.0), Inches(5.2))
    card_s4.fill.solid()
    card_s4.fill.fore_color.rgb = COLOR_CARD
    card_s4.line.color.rgb = COLOR_CARD_BORDER
    tf4 = card_s4.text_frame
    tf4.word_wrap = True

    p = tf4.paragraphs[0]
    p.text = "1. EL RETO COMÚN EN EL AULA: COINCIDENCIA DE APELLIDOS"
    p.font.name = "Segoe UI"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = COLOR_AMBER

    p2 = tf4.add_paragraph()
    p2.text = "El docente envía una segunda nota de voz de 2 segundos: \"Huamán\""
    p2.font.name = "Segoe UI"
    p2.font.size = Pt(12)
    p2.font.bold = True
    p2.font.color.rgb = COLOR_TITLE
    p2.space_before = Pt(4)

    p3 = tf4.add_paragraph()
    p3.text = "En la educación peruana es muy frecuente tener alumnos hermanos o primos con el mismo apellido en el mismo salón o grado. Un sistema rígido fallaría o asignaría al alumno incorrecto."
    p3.font.name = "Segoe UI"
    p3.font.size = Pt(11)
    p3.font.color.rgb = COLOR_BODY
    p3.space_before = Pt(4)

    p4 = tf4.add_paragraph()
    p4.text = "2. CÓMO LO RESUELVE AMAUTA·IA EN TIEMPO REAL:"
    p4.font.name = "Segoe UI"
    p4.font.size = Pt(11)
    p4.font.bold = True
    p4.font.color.rgb = COLOR_GREEN
    p4.space_before = Pt(12)

    s4_points = [
        ("Consulta a la Base de Datos del Aula:", "Busca coincidencias difusas (fuzzy search) en la lista de matrícula de la sección."),
        ("Detección de Homónimos:", "Identifica que existen 2 estudiantes registrados: Brayan Huamán Ríos y Sheyla Huamán Ríos."),
        ("Cero Suposiciones (Datos Verídicos):", "En lugar de asumir cuál de los dos es, el sistema presenta las opciones claras y numeradas."),
        ("Pregunta de Confirmación:", "\"¿Podrías confirmar a cuál de ellos te refieres? 🤔\" con tono pedagógico empático.")
    ]
    for t_pt, b_pt in s4_points:
        p_t = tf4.add_paragraph()
        p_t.text = f"• {t_pt} "
        p_t.font.name = "Segoe UI"
        p_t.font.size = Pt(11)
        p_t.font.bold = True
        p_t.font.color.rgb = COLOR_TITLE
        p_t.space_before = Pt(6)

        p_b = tf4.add_paragraph()
        p_b.text = f"  {b_pt}"
        p_b.font.name = "Segoe UI"
        p_b.font.size = Pt(10)
        p_b.font.color.rgb = COLOR_SUBTITLE

    # -------------------------------------------------------------
    # SLIDE 5: PASO 3 - MAPEO CNEB Y CONFIRMACIÓN
    # -------------------------------------------------------------
    slide5 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide5)
    add_header(slide5, "Paso 3 · Mapeo Curricular y Cierre", 
               "Alineamiento Automático con el CNEB y Registro Oficial", 
               "De un audio de WhatsApp a una competencia oficial del Currículo Nacional registrada para SIAGIE.")

    p3_path = os.path.join(ASSETS_DIR, "mockup_phone_step3.png")
    if os.path.exists(p3_path):
        slide5.shapes.add_picture(p3_path, Inches(0.8), Inches(1.9), height=Inches(5.2))

    card_s5 = slide5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(4.5), Inches(1.9), Inches(8.0), Inches(5.2))
    card_s5.fill.solid()
    card_s5.fill.fore_color.rgb = COLOR_CARD
    card_s5.line.color.rgb = COLOR_CARD_BORDER
    tf5 = card_s5.text_frame
    tf5.word_wrap = True

    p = tf5.paragraphs[0]
    p.text = "1. CIERRE TRANSACCIONAL RÁPIDO"
    p.font.name = "Segoe UI"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = COLOR_BLUE

    p2 = tf5.add_paragraph()
    p2.text = "El docente confirma por audio de 2 segundos: \"A Sheyla Huamán\""
    p2.font.name = "Segoe UI"
    p2.font.size = Pt(12)
    p2.font.bold = True
    p2.font.color.rgb = COLOR_TITLE
    p2.space_before = Pt(4)

    p3 = tf5.add_paragraph()
    p3.text = "2. EL MAYOR VALOR: MAPEO CURRICULAR AUTOMÁTICO (CNEB)"
    p3.font.name = "Segoe UI"
    p3.font.size = Pt(11)
    p3.font.bold = True
    p3.font.color.rgb = COLOR_GREEN
    p3.space_before = Pt(12)

    s5_points = [
        ("Asignación de Competencia Oficial:", "El sistema categoriza la observación dentro del marco CNEB: 'Lee diversos tipos de textos escritos en su lengua materna'."),
        ("Registro Estructurado:", "Guarda el evento con fecha, hora, tipo de logro formativo y código de estudiante en el repositorio de la escuela."),
        ("Confirmación Inmediata con Check Verde (✅):", "\"✅ Registré la participación activa de Sheyla Huamán en la competencia Lee diversos tipos de textos escritos en su lengua materna. ¿Algo más que quieras anotar?\""),
        ("Sincronización con Alerta Escuela / SIAGIE:", "Alimentará automáticamente las conclusiones descriptivas al final del periodo sin trasnoches de papeleo.")
    ]
    for t_pt, b_pt in s5_points:
        p_t = tf5.add_paragraph()
        p_t.text = f"• {t_pt} "
        p_t.font.name = "Segoe UI"
        p_t.font.size = Pt(11)
        p_t.font.bold = True
        p_t.font.color.rgb = COLOR_TITLE
        p_t.space_before = Pt(6)

        p_b = tf5.add_paragraph()
        p_b.text = f"  {b_pt}"
        p_b.font.name = "Segoe UI"
        p_b.font.size = Pt(10)
        p_b.font.color.rgb = COLOR_SUBTITLE

    # -------------------------------------------------------------
    # SLIDE 6: EVIDENCIA DE VALIDACIÓN EN WHATSAPP REAL
    # -------------------------------------------------------------
    slide_evid = prs.slides.add_slide(blank_layout)
    set_slide_background(slide_evid)
    add_header(slide_evid, "Validación Técnica Funcional", 
               "Prueba de Concepto en Vivo sobre WhatsApp", 
               "Captura real de la interacción entre el docente y el agente: transcripción, desambiguación y confirmación.")

    # Imagen del chat original subido por el usuario
    raw_chat_path = "C:/Users/augus/.gemini/antigravity/brain/520eca35-9d7c-4b73-9a48-82566978a506/.user_uploaded/media_1792321716820_cb601a59.png"
    if os.path.exists(raw_chat_path):
        slide_evid.shapes.add_picture(raw_chat_path, Inches(0.8), Inches(2.1), width=Inches(7.2))

    # Tarjeta explicativa de la evidencia técnica
    card_evid = slide_evid.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(8.3), Inches(2.1), Inches(4.2), Inches(4.9))
    card_evid.fill.solid()
    card_evid.fill.fore_color.rgb = COLOR_CARD
    card_evid.line.color.rgb = COLOR_GREEN
    tfe = card_evid.text_frame
    tfe.word_wrap = True

    pe = tfe.paragraphs[0]
    pe.text = "🔬 ANÁLISIS DE LA PRUEBA REAL"
    pe.font.name = "Segoe UI"
    pe.font.size = Pt(11)
    pe.font.bold = True
    pe.font.color.rgb = COLOR_GREEN

    evid_bullets = [
        ("Audios reales de 1 a 3 seg:", "El docente envía notas breves; el sistema responde en menos de 2 segundos."),
        ("Detección de dato incompleto:", "\"Entendí que un estudiante participó... pero necesito su nombre\"."),
        ("Resolución de homónimos:", "Detecta a Brayan y Sheyla Huamán sin equivocarse ni mezclar expedientes."),
        ("Cierre curricular con éxito:", "Vincula la nota a 'Lee diversos tipos de textos escritos en su lengua materna'."),
        ("Listo para escalar:", "No requiere soporte de hardware adicional ni apps pesadas.")
    ]
    for b_t, b_d in evid_bullets:
        pb_t = tfe.add_paragraph()
        pb_t.text = f"• {b_t}"
        pb_t.font.name = "Segoe UI"
        pb_t.font.size = Pt(10)
        pb_t.font.bold = True
        pb_t.font.color.rgb = COLOR_TITLE
        pb_t.space_before = Pt(6)

        pb_d = tfe.add_paragraph()
        pb_d.text = f"  {b_d}"
        pb_d.font.name = "Segoe UI"
        pb_d.font.size = Pt(9)
        pb_d.font.color.rgb = COLOR_SUBTITLE

    # -------------------------------------------------------------
    # SLIDE 7: COMPARATIVA DE VALOR (ANTES VS. AHORA)
    # -------------------------------------------------------------
    slide6 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide6)
    add_header(slide6, "Impacto y Propuesta de Valor", 
               "Comparativa: El Modelo Burocrático vs. Amauta·IA", 
               "Por qué esta solución resuelve el cuello de botella que las plataformas web gubernamentales no han podido cerrar.")

    # Columna Izquierda: Modelo Tradicional
    col1 = slide6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(2.0), Inches(5.6), Inches(5.0))
    col1.fill.solid()
    col1.fill.fore_color.rgb = COLOR_CARD
    col1.line.color.rgb = COLOR_ROJO
    tf_c1 = col1.text_frame
    tf_c1.word_wrap = True

    p = tf_c1.paragraphs[0]
    p.text = "❌ MODELO TRADICIONAL (ALERTA ESCUELA / EXCEL)"
    p.font.name = "Segoe UI"
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = COLOR_ROJO

    trad_items = [
        ("Anotaciones dispersas en papel:", "El docente anota en libretas durante el día y debe transcribir en su tiempo libre en casa."),
        ("Acceso exclusivo del director:", "Los docentes no tienen acceso directo a Alerta Escuela; los reportes son bimestrales y lentos."),
        ("45 minutos por semana de papeleo:", "Llenado manual de tablas complejas de conclusiones descriptivas y asistencia."),
        ("Llega tarde para prevenir:", "Cuando el semáforo marca rojo en SIAGIE, el estudiante ya acumula semanas de inasistencia.")
    ]
    for it_t, it_b in trad_items:
        pt = tf_c1.add_paragraph()
        pt.text = f"• {it_t}"
        pt.font.name = "Segoe UI"
        pt.font.size = Pt(11)
        pt.font.bold = True
        pt.font.color.rgb = COLOR_TITLE
        pt.space_before = Pt(10)

        pb = tf_c1.add_paragraph()
        pb.text = f"  {it_b}"
        pb.font.name = "Segoe UI"
        pb.font.size = Pt(10)
        pb.font.color.rgb = COLOR_SUBTITLE

    # Columna Derecha: Con AmautaIA
    col2 = slide6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.9), Inches(2.0), Inches(5.6), Inches(5.0))
    col2.fill.solid()
    col2.fill.fore_color.rgb = COLOR_CARD
    col2.line.color.rgb = COLOR_GREEN
    tf_c2 = col2.text_frame
    tf_c2.word_wrap = True

    p = tf_c2.paragraphs[0]
    p.text = "✅ CON AMAUTA·IA (COPILOTO WHATSAPP)"
    p.font.name = "Segoe UI"
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = COLOR_GREEN

    amauta_items = [
        ("15 segundos por nota de voz:", "Basta presionar el micrófono entre clases o al final de la sesión; sin pantallas complejas."),
        ("Cero fricción de adopción:", "El 100% de los docentes peruanos ya usa WhatsApp a diario; no hay curvas de aprendizaje."),
        ("Mapeo curricular automático:", "Convierte el lenguaje cotidiano del profesor en categorías y competencias formales del CNEB."),
        ("Alerta temprana en tiempo real:", "Dirección y UGEL ven la información agregada al instante sin pedir reportes manuales.")
    ]
    for it_t, it_b in amauta_items:
        pt = tf_c2.add_paragraph()
        pt.text = f"• {it_t}"
        pt.font.name = "Segoe UI"
        pt.font.size = Pt(11)
        pt.font.bold = True
        pt.font.color.rgb = COLOR_TITLE
        pt.space_before = Pt(10)

        pb = tf_c2.add_paragraph()
        pb.text = f"  {it_b}"
        pb.font.name = "Segoe UI"
        pb.font.size = Pt(10)
        pb.font.color.rgb = COLOR_SUBTITLE

    # -------------------------------------------------------------
    # SLIDE 7: CONCLUSIÓN Y RESUMEN DEL PITCH
    # -------------------------------------------------------------
    slide7 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide7)
    add_header(slide7, "Conclusión para el Pitch", 
               "Menos Pantallas, Más Pedagogía: El Impacto de Amauta·IA", 
               "La verdadera innovación no es obligar al docente a usar otro software, sino llevar la IA al canal donde ya vive.")

    # 3 Cajas métricas
    metrics = [
        ("15s", "Tiempo promedio de registro", "Frente a 30-45 minutos semanales en hojas de cálculo tradicionales.", COLOR_GREEN),
        ("100%", "Adopción sin capacitación", "Funciona directamente sobre WhatsApp sin descargas ni credenciales nuevas.", COLOR_BLUE),
        ("0", "Burocracia extra para el docente", "La IA asume la transcripción, la desambiguación y el reporte curricular.", COLOR_AMBER)
    ]
    for idx, (m_val, m_title, m_desc, m_color) in enumerate(metrics):
        m_card = slide7.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8 + (idx * 4.0)), Inches(2.1), Inches(3.7), Inches(3.0))
        m_card.fill.solid()
        m_card.fill.fore_color.rgb = COLOR_CARD
        m_card.line.color.rgb = COLOR_CARD_BORDER
        mtf = m_card.text_frame
        mtf.word_wrap = True

        p1 = mtf.paragraphs[0]
        p1.text = m_val
        p1.font.name = "Segoe UI"
        p1.font.size = Pt(44)
        p1.font.bold = True
        p1.font.color.rgb = m_color
        p1.alignment = PP_ALIGN.CENTER

        p2 = mtf.add_paragraph()
        p2.text = m_title
        p2.font.name = "Segoe UI"
        p2.font.size = Pt(14)
        p2.font.bold = True
        p2.font.color.rgb = COLOR_TITLE
        p2.alignment = PP_ALIGN.CENTER
        p2.space_before = Pt(8)

        p3 = mtf.add_paragraph()
        p3.text = m_desc
        p3.font.name = "Segoe UI"
        p3.font.size = Pt(11)
        p3.font.color.rgb = COLOR_SUBTITLE
        p3.alignment = PP_ALIGN.CENTER
        p3.space_before = Pt(8)

    # Banner final de cierre
    banner = slide7.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(5.4), Inches(11.7), Inches(1.5))
    banner.fill.solid()
    banner.fill.fore_color.rgb = COLOR_CARD_BORDER
    banner.line.color.rgb = COLOR_GREEN
    btf = banner.text_frame
    btf.word_wrap = True

    bp1 = btf.paragraphs[0]
    bp1.text = "🎯 MENSAJE FINAL PARA EL JURADO"
    bp1.font.name = "Segoe UI"
    bp1.font.size = Pt(11)
    bp1.font.bold = True
    bp1.font.color.rgb = COLOR_GREEN

    bp2 = btf.add_paragraph()
    bp2.text = "\"Alerta Escuela falla no por falta de algoritmos, sino porque los datos llegan 2 meses tarde. Al darle al docente un copiloto por WhatsApp que convierte notas de voz en datos estructurados en 15 segundos, cerramos la brecha entre el aula y la política pública.\""
    bp2.font.name = "Segoe UI"
    bp2.font.size = Pt(13)
    bp2.font.italic = True
    bp2.font.color.rgb = COLOR_TITLE
    bp2.space_before = Pt(6)

    # Guardar presentación
    prs.save(OUTPUT_FILE)
    print(f"Presentation successfully created at: {OUTPUT_FILE}")
    return OUTPUT_FILE

if __name__ == "__main__":
    create_deck()
