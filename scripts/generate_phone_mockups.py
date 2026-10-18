"""
Script to generate ultra high-res smartphone mockups showing WhatsApp conversation step-by-step
for AmautaIA (KeoIT / Hack the Andes - Reto Educacion Escolar).
"""

import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

OUTPUT_DIR = "docs/presentacion"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Color Palette
BG_WHATSAPP = (11, 20, 26, 255)         # #0b141a
HEADER_BG = (32, 44, 51, 255)           # #202c33
FOOTER_BG = (17, 27, 33, 255)           # #111b21
BUBBLE_INCOMING = (32, 44, 51, 255)     # #202c33
BUBBLE_OUTGOING = (0, 92, 75, 255)      # #005c4b
BUBBLE_BOT = (0, 92, 75, 255)           # WhatsApp green #005c4b (matches user screenshot)
BUBBLE_AUDIO = (32, 44, 51, 255)        # #202c33 (matches user screenshot)
ACCENT_GREEN = (37, 211, 102, 255)      # #25d366
TEXT_WHITE = (241, 242, 246, 255)       # #f1f2f6
TEXT_MUTED = (134, 150, 160, 255)       # #8696a0
AUDIO_PURPLE = (110, 80, 180, 255)      # Purple mic icon
PHONE_CHASSIS = (28, 33, 40, 255)       # Metallic dark slate
PHONE_BORDER = (55, 65, 81, 255)        # Frame border
PHONE_HIGHLIGHT = (80, 95, 115, 255)    # Outer rim highlight

# Load fonts
try:
    font_bold_lg = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 20)
    font_bold_md = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 16)
    font_bold_sm = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 14)
    font_reg_md = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 16)
    font_reg_sm = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 14)
    font_time = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 12)
    font_status = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 13)
    font_emoji = ImageFont.truetype("C:/Windows/Fonts/seguiemj.ttf", 16)
except Exception:
    font_bold_lg = ImageFont.load_default()
    font_bold_md = ImageFont.load_default()
    font_bold_sm = ImageFont.load_default()
    font_reg_md = ImageFont.load_default()
    font_reg_sm = ImageFont.load_default()
    font_time = ImageFont.load_default()
    font_status = ImageFont.load_default()
    font_emoji = ImageFont.load_default()

def draw_phone_base(width=480, height=980):
    """Draws realistic modern smartphone frame with screen, notch, and status bar"""
    img = Image.new("RGBA", (width + 40, height + 40), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # Shadow
    shadow_img = Image.new("RGBA", (width + 40, height + 40), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow_img)
    sd.rounded_rectangle((20, 24, width + 20, height + 24), radius=56, fill=(0, 0, 0, 140))
    shadow_img = shadow_img.filter(ImageFilter.GaussianBlur(14))
    img.paste(shadow_img, (0, 0), shadow_img)
    d = ImageDraw.Draw(img)

    # Phone outer body
    ox, oy = 20, 16
    d.rounded_rectangle((ox, oy, ox + width, oy + height), radius=54, fill=PHONE_CHASSIS, outline=PHONE_BORDER, width=2)
    # Inner rim highlight
    d.rounded_rectangle((ox + 2, oy + 2, ox + width - 2, oy + height - 2), radius=52, outline=PHONE_HIGHLIGHT, width=1)

    # Screen dimensions
    sx = ox + 14
    sy = oy + 14
    sw = width - 28
    sh = height - 28
    d.rounded_rectangle((sx, sy, sx + sw, sy + sh), radius=42, fill=BG_WHATSAPP)

    # WhatsApp Header (sy to sy + 72)
    header_h = 72
    # Mask to keep header rounded at top
    header_mask = Image.new("L", (sw, header_h), 0)
    hmd = ImageDraw.Draw(header_mask)
    hmd.rounded_rectangle((0, 0, sw, header_h + 30), radius=42, fill=255)
    
    header_layer = Image.new("RGBA", (sw, header_h), HEADER_BG)
    img.paste(header_layer, (sx, sy), header_mask)

    # Dynamic Island / Notch
    notch_w, notch_h = 120, 26
    nx = sx + (sw - notch_w) // 2
    ny = sy + 9
    d.rounded_rectangle((nx, ny, nx + notch_w, ny + notch_h), radius=13, fill=(10, 10, 10, 255))
    # Camera dot
    d.ellipse((nx + notch_w - 24, ny + 7, nx + notch_w - 12, ny + 19), fill=(25, 30, 40, 255))

    # Status bar icons
    d.text((sx + 24, sy + 13), "09:41", font=font_status, fill=(230, 230, 230, 255))
    # Battery icon
    bx = sx + sw - 48
    d.rounded_rectangle((bx, sy + 15, bx + 22, sy + 26), radius=3, outline=(220, 220, 220, 255), width=1)
    d.rounded_rectangle((bx + 2, sy + 17, bx + 18, sy + 24), radius=2, fill=ACCENT_GREEN)
    d.rectangle((bx + 22, sy + 18, bx + 24, sy + 23), fill=(220, 220, 220, 255))
    # WiFi arc
    d.arc((bx - 26, sy + 12, bx - 12, sy + 26), start=210, end=330, fill=(220, 220, 220, 255), width=2)
    # 5G text
    d.text((bx - 50, sy + 13), "5G", font=font_status, fill=(200, 200, 200, 255))

    # WhatsApp Header items (sy + 35 to sy + 70)
    # Back arrow
    d.polygon([(sx + 16, sy + 52), (sx + 24, sy + 44), (sx + 24, sy + 48), (sx + 34, sy + 48), 
               (sx + 34, sy + 56), (sx + 24, sy + 56), (sx + 24, sy + 60)], fill=(0, 168, 132, 255))
    # Avatar circle
    av_x = sx + 42
    av_y = sy + 38
    d.ellipse((av_x, av_y, av_x + 36, av_y + 36), fill=(0, 168, 132, 255))
    # Robot / AI symbol inside avatar
    d.rounded_rectangle((av_x + 10, av_y + 11, av_x + 26, av_y + 25), radius=4, fill=(255, 255, 255, 255))
    d.ellipse((av_x + 13, av_y + 15, av_x + 16, av_y + 18), fill=(0, 168, 132, 255))
    d.ellipse((av_x + 20, av_y + 15, av_x + 23, av_y + 18), fill=(0, 168, 132, 255))
    # Online badge dot
    d.ellipse((av_x + 26, av_y + 26, av_x + 36, av_y + 36), fill=(37, 211, 102, 255), outline=HEADER_BG, width=2)

    # Name & status
    d.text((av_x + 44, sy + 38), "AmautaIA · Copiloto", font=font_bold_sm, fill=TEXT_WHITE)
    d.text((av_x + 44, sy + 56), "en línea (KeoIT)", font=font_time, fill=ACCENT_GREEN)

    # Header right icons: Video, Phone, Menu
    rx = sx + sw - 20
    # 3 dots
    d.ellipse((rx - 6, sy + 44, rx - 2, sy + 48), fill=TEXT_MUTED)
    d.ellipse((rx - 6, sy + 52, rx - 2, sy + 56), fill=TEXT_MUTED)
    d.ellipse((rx - 6, sy + 60, rx - 2, sy + 64), fill=TEXT_MUTED)
    # Phone icon simple
    d.rounded_rectangle((rx - 32, sy + 47, rx - 20, sy + 61), radius=3, outline=TEXT_MUTED, width=1)
    # Video icon simple
    d.polygon([(rx - 56, sy + 47), (rx - 44, sy + 47), (rx - 44, sy + 61), (rx - 56, sy + 61)], fill=TEXT_MUTED)
    d.polygon([(rx - 44, sy + 51), (rx - 38, sy + 47), (rx - 38, sy + 61), (rx - 44, sy + 57)], fill=TEXT_MUTED)

    # WhatsApp Bottom Bar (sh - 70 to sh)
    footer_y = sy + sh - 70
    footer_mask = Image.new("L", (sw, 70), 0)
    fmd = ImageDraw.Draw(footer_mask)
    fmd.rounded_rectangle((0, -20, sw, 70), radius=42, fill=255)
    footer_layer = Image.new("RGBA", (sw, 70), FOOTER_BG)
    img.paste(footer_layer, (sx, footer_y), footer_mask)

    # Bottom input pill
    inp_x = sx + 12
    inp_y = footer_y + 10
    inp_w = sw - 76
    d.rounded_rectangle((inp_x, inp_y, inp_x + inp_w, inp_y + 42), radius=21, fill=(42, 57, 66, 255))
    # Input text
    d.text((inp_x + 18, inp_y + 12), "Mensaje de voz o texto...", font=font_reg_sm, fill=TEXT_MUTED)
    # Mic circle button
    mic_x = sx + sw - 54
    mic_y = inp_y
    d.ellipse((mic_x, mic_y, mic_x + 42, mic_y + 42), fill=(0, 168, 132, 255))
    # Mic shape
    d.rounded_rectangle((mic_x + 18, mic_y + 11, mic_x + 24, mic_y + 24), radius=3, fill=(255, 255, 255, 255))
    d.arc((mic_x + 15, mic_y + 16, mic_x + 27, mic_y + 28), start=0, end=180, fill=(255, 255, 255, 255), width=2)
    d.line([(mic_x + 21, mic_y + 28), (mic_x + 21, mic_y + 32)], fill=(255, 255, 255, 255), width=2)

    # Home bottom bar
    hx = sx + (sw - 120) // 2
    d.rounded_rectangle((hx, sy + sh - 10, hx + 120, sy + sh - 6), radius=2, fill=(200, 200, 200, 100))

    # Date badge in chat
    date_badge_y = sy + header_h + 10
    db_w = 64
    db_x = sx + (sw - db_w) // 2
    d.rounded_rectangle((db_x, date_badge_y, db_x + db_w, date_badge_y + 22), radius=11, fill=(24, 34, 41, 255))
    d.text((db_x + 16, date_badge_y + 4), "HOY", font=font_time, fill=TEXT_MUTED)

    return img, (sx, sy + header_h + 38, sw, sh - header_h - 110)

def draw_audio_bubble(img, x, y, duration="0:03", time="1:31 a.m.", is_outgoing=False, label="Nota de voz del profesor"):
    """Draws realistic WhatsApp audio message bubble"""
    d = ImageDraw.Draw(img)
    w = 280
    h = 66
    bg = BUBBLE_AUDIO
    
    # Rounded bubble
    d.rounded_rectangle((x, y, x + w, y + h), radius=12, fill=bg)

    # Purple mic avatar (like in user screenshot)
    p_x = x + 12
    p_y = y + 13
    d.ellipse((p_x, p_y, p_x + 38, p_y + 38), fill=AUDIO_PURPLE)
    # White mic inside
    d.rounded_rectangle((p_x + 16, p_y + 11, p_x + 22, p_y + 23), radius=3, fill=(255, 255, 255, 255))
    d.arc((p_x + 13, p_y + 16, p_x + 25, p_y + 26), start=0, end=180, fill=(255, 255, 255, 255), width=2)
    d.line([(p_x + 19, p_y + 26), (p_x + 19, p_y + 29)], fill=(255, 255, 255, 255), width=2)

    # Play button (triangle)
    play_x = p_x + 48
    d.polygon([(play_x, y + 23), (play_x + 14, y + 31), (play_x, y + 39)], fill=ACCENT_GREEN)

    # Waveform bars
    wave_x = play_x + 22
    bar_heights = [6, 12, 18, 10, 22, 14, 20, 8, 16, 24, 18, 12, 20, 14, 8, 18, 22, 12, 6]
    for i, bh in enumerate(bar_heights):
        bx = wave_x + (i * 6)
        if bx > x + w - 40:
            break
        color = ACCENT_GREEN if i < 9 else TEXT_MUTED
        d.rounded_rectangle((bx, y + 32 - bh//2, bx + 3, y + 32 + bh//2), radius=1, fill=color)

    # Duration & Time
    d.text((play_x, y + 46), duration, font=font_time, fill=TEXT_MUTED)
    d.text((x + w - 75, y + 46), time, font=font_time, fill=TEXT_MUTED)
    # Double checkmark
    d.text((x + w - 24, y + 46), "✓✓", font=font_time, fill=(83, 189, 235, 255))

    return y + h + 14

def draw_text_bubble(img, x, y, lines, time="1:31 a.m.", is_bot=True, max_w=340):
    """Draws realistic WhatsApp green bot response bubble"""
    d = ImageDraw.Draw(img)
    bg = BUBBLE_BOT if is_bot else BUBBLE_INCOMING

    line_spacing = 20
    text_h = len(lines) * line_spacing
    bubble_h = text_h + 34
    bubble_w = max_w

    d.rounded_rectangle((x, y, x + bubble_w, y + bubble_h), radius=12, fill=bg)

    # Draw lines
    cur_y = y + 10
    for line in lines:
        # Check if bullet or header
        if line.startswith("•") or line.startswith("✅"):
            d.text((x + 14, cur_y), line, font=font_bold_sm, fill=TEXT_WHITE)
        elif line.startswith("¿"):
            d.text((x + 14, cur_y), line, font=font_bold_sm, fill=(220, 245, 230, 255))
        else:
            d.text((x + 14, cur_y), line, font=font_reg_sm, fill=TEXT_WHITE)
        cur_y += line_spacing

    # Time and checkmark
    d.text((x + bubble_w - 75, y + bubble_h - 20), time, font=font_time, fill=(180, 220, 200, 255))
    d.text((x + bubble_w - 24, y + bubble_h - 20), "✓✓", font=font_time, fill=(83, 189, 235, 255))

    return y + bubble_h + 14

def generate_step_1():
    """Paso 1: Solicitud inicial por audio y respuesta del bot solicitando nombre"""
    img, (sx, chat_top, sw, chat_h) = draw_phone_base(width=460, height=920)
    
    # Audio del profesor (arriba)
    cur_y = chat_top + 10
    cur_y = draw_audio_bubble(img, sx + 14, cur_y, duration="0:03", time="1:31 a.m.", is_outgoing=False)

    # Respuesta del bot
    lines_bot1 = [
        "Entendí que un estudiante participó mucho",
        "en la clase de lectura, pero necesito que",
        "me indiques su nombre para poder registrar",
        "esta observación. ¿A quién te refieres? 📋"
    ]
    cur_y = draw_text_bubble(img, sx + 50, cur_y, lines_bot1, time="1:31 a.m.", is_bot=True, max_w=370)

    # Typing / listening pill at bottom to show it's dynamic
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((sx + 20, cur_y + 20, sx + sw - 20, cur_y + 60), radius=12, fill=(24, 34, 41, 220), outline=(0, 168, 132, 180), width=1)
    d.text((sx + 36, cur_y + 32), "🎙️ Esperando respuesta del docente...", font=font_reg_sm, fill=ACCENT_GREEN)

    out_path = os.path.join(OUTPUT_DIR, "mockup_phone_step1.png")
    img.save(out_path, "PNG")
    print(f"Step 1 saved: {out_path}")
    return out_path

def generate_step_2():
    """Paso 2: Aclaración de apellido Huamán y detección de homónimos en lista"""
    img, (sx, chat_top, sw, chat_h) = draw_phone_base(width=460, height=920)
    cur_y = chat_top + 6

    # Audio 1 & Bot 1 (ligeramente más compacto)
    cur_y = draw_audio_bubble(img, sx + 14, cur_y, duration="0:03", time="1:31 a.m.", is_outgoing=False)
    lines_bot1 = [
        "Entendí que un estudiante participó mucho en",
        "lectura. ¿A quién te refieres? 📋"
    ]
    cur_y = draw_text_bubble(img, sx + 50, cur_y, lines_bot1, time="1:31 a.m.", is_bot=True, max_w=370)

    # Audio 2 del profesor: "Huamán"
    cur_y = draw_audio_bubble(img, sx + 14, cur_y, duration="0:02", time="1:31 a.m.", is_outgoing=False)

    # Bot 2: Detección de homónimos
    lines_bot2 = [
        "Encontré a dos estudiantes con el",
        "apellido Huamán en tu lista:",
        "• Brayan Huamán Ríos",
        "• Sheyla Huamán Ríos",
        "¿Podrías confirmar a cuál de ellos",
        "te refieres? 🤔"
    ]
    cur_y = draw_text_bubble(img, sx + 50, cur_y, lines_bot2, time="1:31 a.m.", is_bot=True, max_w=370)

    # Dynamic badge: Consulta en SIAGIE / Nómina escolar
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((sx + 20, cur_y + 10, sx + sw - 20, cur_y + 50), radius=10, fill=(24, 34, 41, 230), outline=(230, 163, 22, 180), width=1)
    d.text((sx + 34, cur_y + 22), "⚡ Base de datos: 2 coincidencias encontradas", font=font_reg_sm, fill=(240, 190, 80, 255))

    out_path = os.path.join(OUTPUT_DIR, "mockup_phone_step2.png")
    img.save(out_path, "PNG")
    print(f"Step 2 saved: {out_path}")
    return out_path

def generate_step_3():
    """Paso 3: Confirmación y vinculación curricular CNEB"""
    img, (sx, chat_top, sw, chat_h) = draw_phone_base(width=460, height=920)
    cur_y = chat_top + 4

    # Audio 2 & Bot 2 resumen
    cur_y = draw_audio_bubble(img, sx + 14, cur_y, duration="0:02", time="1:31 a.m.", is_outgoing=False)
    lines_bot2 = [
        "Encontré: • Brayan Huamán • Sheyla Huamán",
        "¿A cuál de ellos te refieres? 🤔"
    ]
    cur_y = draw_text_bubble(img, sx + 50, cur_y, lines_bot2, time="1:31 a.m.", is_bot=True, max_w=370)

    # Audio 3 del profesor: "Sheyla Huamán"
    cur_y = draw_audio_bubble(img, sx + 14, cur_y, duration="0:02", time="1:32 a.m.", is_outgoing=False)

    # Bot 3: Confirmación oficial y competencia CNEB
    lines_bot3 = [
        "✅ Registré la participación activa de",
        "Sheyla Huamán en la competencia:",
        "Lee diversos tipos de textos escritos",
        "en su lengua materna (CNEB).",
        "¿Algo más que quieras anotar?"
    ]
    cur_y = draw_text_bubble(img, sx + 40, cur_y, lines_bot3, time="1:32 a.m.", is_bot=True, max_w=380)

    # Badge de confirmación exitosa
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((sx + 20, cur_y + 14, sx + sw - 20, cur_y + 54), radius=10, fill=(24, 34, 41, 230), outline=(43, 138, 62, 180), width=1)
    d.text((sx + 34, cur_y + 24), "🎯 Guardado en SIAGIE & Portafolio Docente", font=font_reg_sm, fill=(80, 220, 120, 255))

    out_path = os.path.join(OUTPUT_DIR, "mockup_phone_step3.png")
    img.save(out_path, "PNG")
    print(f"Step 3 saved: {out_path}")
    return out_path

def generate_full_flow():
    """Mockup completo con el flujo de inicio a fin"""
    img, (sx, chat_top, sw, chat_h) = draw_phone_base(width=460, height=920)
    cur_y = chat_top + 2

    # Mensaje 1
    cur_y = draw_audio_bubble(img, sx + 14, cur_y, duration="0:03", time="1:31 a.m.")
    lines_b1 = ["Entendí la participación en lectura.", "¿A qué estudiante te refieres? 📋"]
    cur_y = draw_text_bubble(img, sx + 60, cur_y, lines_b1, time="1:31 a.m.", max_w=360)

    # Mensaje 2
    cur_y = draw_audio_bubble(img, sx + 14, cur_y, duration="0:02", time="1:31 a.m.")
    lines_b2 = [
        "Dos alumnos Huamán en tu lista:",
        "• Brayan Huamán  • Sheyla Huamán",
        "¿A cuál te refieres? 🤔"
    ]
    cur_y = draw_text_bubble(img, sx + 60, cur_y, lines_b2, time="1:31 a.m.", max_w=360)

    # Mensaje 3
    cur_y = draw_audio_bubble(img, sx + 14, cur_y, duration="0:02", time="1:32 a.m.")
    lines_b3 = [
        "✅ Registré a Sheyla Huamán en:",
        "Lee diversos tipos de textos escritos...",
        "¿Algo más que quieras anotar?"
    ]
    cur_y = draw_text_bubble(img, sx + 50, cur_y, lines_b3, time="1:32 a.m.", max_w=370)

    out_path = os.path.join(OUTPUT_DIR, "mockup_phone_full.png")
    img.save(out_path, "PNG")
    print(f"Full flow saved: {out_path}")
    return out_path

if __name__ == "__main__":
    generate_step_1()
    generate_step_2()
    generate_step_3()
    generate_full_flow()

