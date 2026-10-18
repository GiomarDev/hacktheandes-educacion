const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const BRAVE_PATH = 'C:\\Users\\augus\\AppData\\Local\\BraveSoftware\\Brave-Browser\\Application\\brave.exe';
const SCREENSHOTS_DIR = path.resolve(__dirname, '../../docs/pitch/screenshots');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function captureAll() {
  console.log('🚀 Iniciando navegador en alta resolución (1920x1080 @ 2x)...');
  const browser = await puppeteer.launch({
    executablePath: BRAVE_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--window-size=1920,1080',
    ],
    defaultViewport: {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 2,
    },
  });

  const page = await browser.newPage();

  async function takeShot(name, fullPage = false) {
    const filePath = path.join(SCREENSHOTS_DIR, name);
    await page.screenshot({ path: filePath, fullPage });
    console.log(`📸 Guardada captura: ${name}`);
  }

  try {
    // -------------------------------------------------------------
    // FASE 1: Login con MINEDU_ADMIN (70000100)
    // -------------------------------------------------------------
    console.log('\n--- 1. Vista de Login ---');
    await page.goto('https://amauti.keoit.com', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(1500);
    await takeShot('00_portal_login_amauti.png');

    console.log('Ingresando credenciales DNI: 70000100...');
    await page.waitForSelector('input[placeholder="DNI"]');
    await page.type('input[placeholder="DNI"]', '70000100', { delay: 40 });
    await page.type('input[type="password"]', 'Demo-Escuela-2026', { delay: 40 });
    await takeShot('00b_portal_login_credenciales.png');

    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {}),
    ]);
    await sleep(2500);

    // -------------------------------------------------------------
    // FASE 2: Panorama Nacional (MINEDU)
    // -------------------------------------------------------------
    console.log('\n--- 2. Panorama Nacional ---');
    await takeShot('01_panorama_nacional_secundaria.png', true);

    // Activar Primaria en el mapa si está disponible
    const primariaBtn = await page.$('button ::-p-text(Primaria)');
    if (primariaBtn) {
      await primariaBtn.click();
      await sleep(1000);
      await takeShot('02_panorama_nacional_primaria.png', true);
    }

    // Clic en la región Ucayali (UCA) en el mapa interactivo
    console.log('Interactuando con mapa regional...');
    const buttons = await page.$$('button');
    for (const b of buttons) {
      const text = await b.evaluate((el) => el.innerText);
      if (text && text.includes('UCA')) {
        await b.click();
        await sleep(1200);
        console.log('Región UCA seleccionada');
        break;
      }
    }
    await takeShot('03_panorama_region_ucayali_detalle.png', true);

    // Probar el Tour Guiado con la brújula / Amauti
    console.log('Iniciando tour guiado de bienvenida...');
    const compassBtn = await page.$('button[title="Ver el recorrido"]');
    if (compassBtn) {
      await compassBtn.click();
      await sleep(1500);
      await takeShot('04_tour_guiado_amauti.png');
      // Cerrar tour o dar click en siguiente
      const nextBtn = await page.$('button ::-p-text(Siguiente)');
      if (nextBtn) {
        await nextBtn.click();
        await sleep(800);
      }
      const closeTourBtn = await page.$('button[aria-label="Cerrar"]');
      if (closeTourBtn) {
        await closeTourBtn.click();
        await sleep(500);
      } else {
        await page.keyboard.press('Escape');
        await sleep(500);
      }
    }

    // -------------------------------------------------------------
    // FASE 3: Centro de Alertas Tempranas
    // -------------------------------------------------------------
    console.log('\n--- 3. Centro de Alertas ---');
    await page.goto('https://amauti.keoit.com/alertas', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2000);
    await takeShot('05_centro_alertas_tempranas.png', true);

    // Clic en tab de alertas altas o abiertas
    const altaTab = await page.$('button ::-p-text(Altas)');
    if (altaTab) {
      await altaTab.click();
      await sleep(1000);
      await takeShot('06_alertas_alta_prioridad.png', true);
    }

    // Obtener enlace al primer caso
    const firstCaseLink = await page.$('a[href^="/casos/"]');
    let caseUrl = null;
    if (firstCaseLink) {
      caseUrl = await firstCaseLink.evaluate((el) => el.getAttribute('href'));
      console.log('Caso encontrado:', caseUrl);
      await page.goto(`https://amauti.keoit.com${caseUrl}`, { waitUntil: 'networkidle2', timeout: 30000 });
      await sleep(2000);
      await takeShot('07_caso_seguimiento_bitacora.png', true);
    }

    // -------------------------------------------------------------
    // FASE 4: Directorio de Escuelas y Detalle de IE
    // -------------------------------------------------------------
    console.log('\n--- 4. Directorio de Escuelas ---');
    await page.goto('https://amauti.keoit.com/escuelas', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2000);
    await takeShot('08_directorio_escuelas.png', true);

    // Clic a la IE de demo
    const ieLink = await page.$('a[href^="/escuelas/"]');
    if (ieLink) {
      const ieUrl = await ieLink.evaluate((el) => el.getAttribute('href'));
      console.log('IE encontrada:', ieUrl);
      await page.goto(`https://amauti.keoit.com${ieUrl}`, { waitUntil: 'networkidle2', timeout: 30000 });
      await sleep(2000);
      await takeShot('09_escuela_detalle_asistencia_riesgo.png', true);
    }

    // -------------------------------------------------------------
    // FASE 5: Reportes SIMON
    // -------------------------------------------------------------
    console.log('\n--- 5. Reportes SIMON ---');
    await page.goto('https://amauti.keoit.com/reportes', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2000);
    await takeShot('10_reportes_simon_listado.png', true);

    // Expandir el primer reporte si existe
    const firstReportBtn = await page.$('ul.divide-y li button');
    if (firstReportBtn) {
      await firstReportBtn.click();
      await sleep(1200);
      await takeShot('11_reporte_simon_detalle_expandido.png', true);
    }

    // -------------------------------------------------------------
    // FASE 6: Visitas de Monitoreo
    // -------------------------------------------------------------
    console.log('\n--- 6. Visitas de Monitoreo ---');
    await page.goto('https://amauti.keoit.com/visitas', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2000);
    await takeShot('12_visitas_monitoreo_aula.png', true);

    const firstVisitBtn = await page.$('ul.divide-y li button');
    if (firstVisitBtn) {
      await firstVisitBtn.click();
      await sleep(1200);
      await takeShot('13_visita_detalle_compromisos.png', true);
    }

    // -------------------------------------------------------------
    // FASE 7: Fuentes de Datos Abiertos ESCALE / SIAGIE
    // -------------------------------------------------------------
    console.log('\n--- 7. Fuentes de Datos CSV ---');
    await page.goto('https://amauti.keoit.com/fuentes', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2000);
    await takeShot('14_fuentes_datos_abiertos_csv.png', true);

    // -------------------------------------------------------------
    // FASE 8: Administración de Usuarios, Roles, Teléfonos y Reglas
    // -------------------------------------------------------------
    console.log('\n--- 8. Administración de Usuarios y Reglas ---');
    await page.goto('https://amauti.keoit.com/admin', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2000);
    await takeShot('15_admin_usuarios_roles_celulares.png', true);

    // Ir a pestaña de Reglas
    const reglasBtn = await page.$('button ::-p-text(Reglas de alerta)');
    if (reglasBtn) {
      await reglasBtn.click();
      await sleep(1200);
      await takeShot('16_admin_reglas_alerta_umbrales.png', true);
    }

    // -------------------------------------------------------------
    // FASE 9: Cerrar sesión y entrar como DOCENTE / TUTOR (70000104)
    // para capturar el copiloto de aula, ficha de alumno, whatsapp y notas
    // -------------------------------------------------------------
    console.log('\n--- 9. Ingresando como TUTOR / DOCENTE (70000104) ---');
    // Limpiar localStorage y cookies
    await page.evaluate(() => localStorage.clear());
    await page.goto('https://amauti.keoit.com', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(1500);

    await page.waitForSelector('input[placeholder="DNI"]');
    await page.type('input[placeholder="DNI"]', '70000104', { delay: 40 });
    await page.type('input[type="password"]', 'Demo-Escuela-2026', { delay: 40 });

    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {}),
    ]);
    await sleep(2500);

    // Vista Docente Hoy
    console.log('Capturando Docente Hoy...');
    await takeShot('17_docente_hoy_tablero_diario.png', true);

    // Mi Aula / Pase de lista
    console.log('Capturando Pase de Lista (Mi Aula)...');
    await page.goto('https://amauti.keoit.com/docente/aula', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2000);
    await takeShot('18_docente_pase_lista_asistencia.png', true);

    // Documentos (WhatsApp paperless flow!)
    console.log('Capturando Gestión de Documentos WhatsApp...');
    await page.goto('https://amauti.keoit.com/documentos', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2000);
    await takeShot('19_documentos_papeleo_whatsapp_copiloto.png', true);

    // Registro de Notas por Competencias
    console.log('Capturando Registro de Notas...');
    await page.goto('https://amauti.keoit.com/notas', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2000);
    await takeShot('20_registro_calificaciones_competencias.png', true);

    // Planes de apoyo pedagógico
    console.log('Capturando Planes de Apoyo...');
    await page.goto('https://amauti.keoit.com/planes', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2000);
    await takeShot('21_planes_apoyo_diagnostico.png', true);

    // Ficha de un Estudiante
    console.log('Capturando Ficha de un Estudiante...');
    // Vamos a /docente para tomar el link a un estudiante
    await page.goto('https://amauti.keoit.com/docente', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(1500);
    const fichaBtn = await page.$('a[href^="/estudiantes/"]');
    if (fichaBtn) {
      const studentUrl = await fichaBtn.evaluate((el) => el.getAttribute('href'));
      console.log('Estudiante encontrado:', studentUrl);
      await page.goto(`https://amauti.keoit.com${studentUrl}`, { waitUntil: 'networkidle2', timeout: 30000 });
      await sleep(2000);
      await takeShot('22_ficha_integral_estudiante_cneb.png', true);
    }

    console.log('\n✨ Todas las capturas fueron extraídas exitosamente en alta resolución!');

  } catch (err) {
    console.error('❌ Error durante la ejecución:', err);
  } finally {
    await browser.close();
    console.log('Navegador cerrado.');
  }
}

captureAll();
