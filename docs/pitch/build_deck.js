const pptxgen = require("pptxgenjs");

const C = {
  rojo: "D91023", azul: "003876", azulBg: "E6EEF5", bg: "F5F7FA", white: "FFFFFF",
  nav: "1A2332", ink: "1A2332", mid: "5A6578", alto: "F0633B", medio: "E6A316",
  estable: "2B8A3E", estableBg: "E8F3EC", critico: "C8102E",
};
const F = "Calibri";

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.3 x 7.5
pres.title = "Amauti - Pitch";

const tag = (s, dark) =>
  s.addText("AMAUTI · Futuro Agéntico", {
    x: 0.6, y: 6.9, w: 6, h: 0.35, margin: 0, fontFace: F, fontSize: 12, bold: true,
    color: dark ? "B4BCC9" : "8A95A8",
  });

// 1. Hook
{
  const s = pres.addSlide();
  s.background = { color: C.nav };
  s.addText("375", { x: 0.6, y: 0.9, w: 12, h: 3.2, margin: 0, fontFace: F, fontSize: 220, bold: true, color: C.white });
  s.addText("alumnos abandonan el colegio\ncada 24 horas", { x: 0.6, y: 4.1, w: 12, h: 1.5, margin: 0, fontFace: F, fontSize: 40, color: "B4BCC9" });
  s.addText("¿En qué minuto los perdimos?", { x: 0.6, y: 5.7, w: 12, h: 0.8, margin: 0, fontFace: F, fontSize: 36, bold: true, color: "FF6B7A" });
  tag(s, true);
  s.addNotes("0:00-0:13 Augusto. Hook: 375 alumnos cada 24h. ¿Fue el día que dejaron de ir, o mucho antes?");
}

// 2. Punto ciego
{
  const s = pres.addSlide();
  s.background = { color: C.bg };
  s.addText("PUNTO CIEGO", { x: 0.6, y: 0.5, w: 6, h: 0.5, margin: 0, fontFace: F, fontSize: 18, bold: true, color: C.rojo });
  s.addText("60", { x: 0.6, y: 1.0, w: 5.5, h: 3.2, margin: 0, fontFace: F, fontSize: 200, bold: true, color: C.critico });
  s.addText("días sin que nadie lo vea", { x: 0.6, y: 4.2, w: 5.5, h: 1.0, margin: 0, fontFace: F, fontSize: 32, bold: true, color: C.ink });
  s.addText("Hoy: autopsias, no rescates", { x: 0.6, y: 5.4, w: 5.5, h: 0.6, margin: 0, fontFace: F, fontSize: 22, color: C.mid });
  const items = [["Falla en matemáticas", C.medio], ["Empieza a faltar", C.alto], ["Se apaga en el salón", C.critico]];
  items.forEach(([t, col], i) => {
    const y = 1.2 + i * 1.7;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 6.9, y, w: 5.8, h: 1.4, fill: { color: C.white }, line: { color: "E1E5EB", width: 1 }, rectRadius: 0.15 });
    s.addShape(pres.shapes.OVAL, { x: 7.2, y: y + 0.4, w: 0.6, h: 0.6, fill: { color: col }, line: { color: col } });
    s.addText(String(i + 1), { x: 7.2, y: y + 0.4, w: 0.6, h: 0.6, margin: 0, align: "center", valign: "middle", fontFace: F, fontSize: 22, bold: true, color: C.white });
    s.addText(t, { x: 8.1, y, w: 4.5, h: 1.4, margin: 0, valign: "middle", fontFace: F, fontSize: 28, bold: true, color: C.ink });
  });
  s.addText("Docente solo… con WhatsApp en el bolsillo", { x: 6.9, y: 6.3, w: 5.8, h: 0.5, margin: 0, fontFace: F, fontSize: 18, italic: true, color: C.mid });
  tag(s, false);
  s.addNotes("0:13-0:44 Augusto. Punto ciego de 60 días. Sistemas del Estado = autopsias. El docente está ahogado en trámites; solo tiene WhatsApp.");
}

// 3. Diferencia
{
  const s = pres.addSlide();
  s.background = { color: C.white };
  s.addText("Del audio de 10 s al rescate", { x: 0.6, y: 0.5, w: 12, h: 0.9, margin: 0, fontFace: F, fontSize: 40, bold: true, color: C.azul });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 2.0, w: 3.2, h: 3.6, fill: { color: C.estable }, line: { color: C.estable }, rectRadius: 0.2 });
  s.addText("10 s", { x: 0.6, y: 2.4, w: 3.2, h: 1.6, margin: 0, align: "center", valign: "middle", fontFace: F, fontSize: 80, bold: true, color: C.white });
  s.addText("audio en\nWhatsApp", { x: 0.6, y: 4.0, w: 3.2, h: 1.2, margin: 0, align: "center", fontFace: F, fontSize: 26, color: C.white });
  s.addText("➔", { x: 3.85, y: 3.3, w: 0.8, h: 0.8, margin: 0, align: "center", valign: "middle", fontFace: F, fontSize: 44, bold: true, color: C.mid });
  const p = [["Trámites", "ágiles"], ["Bitácora", "de observaciones"], ["Alertas", "alumnos en riesgo"]];
  p.forEach(([a, b], i) => {
    const x = 4.75 + i * 2.7;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 2.0, w: 2.5, h: 3.6, fill: { color: C.azulBg }, line: { color: C.azulBg }, rectRadius: 0.2 });
    s.addText(String(i + 1), { x, y: 2.2, w: 2.5, h: 0.8, margin: 0, align: "center", fontFace: F, fontSize: 36, bold: true, color: C.rojo });
    s.addText(a, { x, y: 3.2, w: 2.5, h: 0.8, margin: 0, align: "center", fontFace: F, fontSize: 28, bold: true, color: C.azul });
    s.addText(b, { x, y: 4.0, w: 2.5, h: 1.0, margin: 0.1, align: "center", fontFace: F, fontSize: 20, color: C.mid });
  });
  s.addText("Director · UGEL · Ministerio sincronizados en tiempo real", { x: 0.6, y: 6.1, w: 12, h: 0.6, margin: 0, fontFace: F, fontSize: 24, bold: true, color: C.ink });
  tag(s, false);
  s.addNotes("0:44-1:08 Augusto. Amauti cierra el ciclo señal -> rescate. Tres pilares. Pase a Xander.");
}

// 4. Demo
{
  const s = pres.addSlide();
  s.background = { color: C.azul };
  s.addText("DEMO EN VIVO", { x: 0.6, y: 0.6, w: 12, h: 1.2, margin: 0, fontFace: F, fontSize: 60, bold: true, color: C.white });
  s.addText("amauti.keoit.com", { x: 0.6, y: 1.8, w: 12, h: 0.8, margin: 0, fontFace: F, fontSize: 36, color: "FF9AA5" });
  const st = [["Docente", "Hoy · Alertas"], ["Caso", "Atender · Bitácora"], ["MINEDU / UGEL", "Panorama · Reportes"]];
  st.forEach(([a, b], i) => {
    const x = 0.6 + i * 4.1;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 3.5, w: 3.8, h: 2.6, fill: { color: C.white }, line: { color: C.white }, rectRadius: 0.2 });
    s.addText(String(i + 1), { x: x + 0.3, y: 3.7, w: 1, h: 0.8, margin: 0, fontFace: F, fontSize: 40, bold: true, color: C.rojo });
    s.addText(a, { x: x + 0.3, y: 4.6, w: 3.3, h: 0.7, margin: 0, fontFace: F, fontSize: 30, bold: true, color: C.azul });
    s.addText(b, { x: x + 0.3, y: 5.3, w: 3.3, h: 0.6, margin: 0, fontFace: F, fontSize: 20, color: C.mid });
  });
  s.addNotes("1:08-2:10 Xander. Web en vivo. 1) Hoy/Alertas: 5 alumnos, plazo 48h. 2) Atender caso (Nayeli): bitácora, mensaje a familia, plan de apoyo cifrado. 3) Panorama/Reportes sin Excel extra.");
}

// 5. Arquitectura
{
  const s = pres.addSlide();
  s.background = { color: C.bg };
  s.addText("5 microservicios independientes", { x: 0.6, y: 0.5, w: 12, h: 0.9, margin: 0, fontFace: F, fontSize: 40, bold: true, color: C.azul });
  s.addText("NestJS · PostgreSQL con esquemas aislados", { x: 0.6, y: 1.35, w: 12, h: 0.5, margin: 0, fontFace: F, fontSize: 20, color: C.mid });
  const ms = [["auth", "RBAC · JWKS"], ["siagie", "Académico"], ["alerta", "Reglas"], ["simon", "Monitoreo"], ["escale", "Estadística"]];
  ms.forEach(([a, b], i) => {
    const x = 0.6 + i * 2.45;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 2.5, w: 2.25, h: 2.1, fill: { color: C.white }, line: { color: C.azul, width: 2 }, rectRadius: 0.15 });
    s.addText("ms-" + a, { x, y: 2.8, w: 2.25, h: 0.7, margin: 0, align: "center", fontFace: F, fontSize: 26, bold: true, color: C.azul });
    s.addText(b, { x, y: 3.6, w: 2.25, h: 0.6, margin: 0, align: "center", fontFace: F, fontSize: 18, color: C.mid });
  });
  [["AES-256", "diagnósticos cifrados"], ["SHA-256", "datasets verificados"]].forEach(([a, b], i) => {
    const x = 0.6 + i * 6.2;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 5.2, w: 5.9, h: 1.3, fill: { color: C.nav }, line: { color: C.nav }, rectRadius: 0.15 });
    s.addText(a, { x: x + 0.3, y: 5.2, w: 2.6, h: 1.3, margin: 0, valign: "middle", fontFace: F, fontSize: 36, bold: true, color: C.white });
    s.addText(b, { x: x + 2.9, y: 5.2, w: 2.9, h: 1.3, margin: 0, valign: "middle", fontFace: F, fontSize: 20, color: "B4BCC9" });
  });
  tag(s, false);
  s.addNotes("2:10-2:35 Xander. 5 microservicios NestJS, schemas aislados en PostgreSQL, RBAC con JWKS, alertas deterministas, AES-256, SHA-256.");
}

// 6. Decisiones y cierre
{
  const s = pres.addSlide();
  s.background = { color: C.nav };
  s.addText("DECISIÓN", { x: 0.6, y: 0.6, w: 6, h: 0.5, margin: 0, fontFace: F, fontSize: 18, bold: true, color: "FF6B7A" });
  s.addText("Reglas claras,\nno cajas negras", { x: 0.6, y: 1.1, w: 6, h: 2.2, margin: 0, fontFace: F, fontSize: 44, bold: true, color: C.white });
  s.addText("Cada alerta es auditable", { x: 0.6, y: 3.4, w: 6, h: 0.6, margin: 0, fontFace: F, fontSize: 22, color: "B4BCC9" });
  s.addText("SIGUIENTE PASO", { x: 7.1, y: 0.6, w: 5.6, h: 0.5, margin: 0, fontFace: F, fontSize: 18, bold: true, color: "7FD08F" });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 7.1, y: 1.2, w: 5.6, h: 2.8, fill: { color: C.estable }, line: { color: C.estable }, rectRadius: 0.2 });
  s.addText("Planes de nivelación y tutoría", { x: 7.4, y: 1.2, w: 5.0, h: 2.8, margin: 0, valign: "middle", fontFace: F, fontSize: 36, bold: true, color: C.white });
  s.addText("Con Amauti, cada día en el aula cuenta.", { x: 0.6, y: 5.2, w: 12, h: 1.0, margin: 0, fontFace: F, fontSize: 40, bold: true, color: C.white });
  s.addText("Muchas gracias", { x: 0.6, y: 6.2, w: 12, h: 0.6, margin: 0, fontFace: F, fontSize: 24, color: "B4BCC9" });
  s.addNotes("2:35-3:00 Xander. Reglas deterministas configurables; enfoque en liberar tiempo del docente; siguiente paso: planes de nivelación. Cierre.");
}

pres.writeFile({ fileName: __dirname + "/Amauti_Pitch.pptx" }).then((f) => console.log("OK", f));
