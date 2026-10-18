const puppeteer = require('puppeteer-core');
const path = require('path');

const BRAVE_PATH = 'C:\\Users\\augus\\AppData\\Local\\BraveSoftware\\Brave-Browser\\Application\\brave.exe';
const SCREENSHOTS_DIR = path.resolve(__dirname, '../../docs/pitch/screenshots');

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function captureTeacher() {
  console.log('🚀 Iniciando navegador para rol Docente / Tutor (70000104)...');
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

  // Usar contexto incógnito totalmente aislado
  const context = await browser.createBrowserContext();
  const page = await context.newPage();

  async function takeShot(name, fullPage = false) {
    const filePath = path.join(SCREENSHOTS_DIR, name);
    await page.screenshot({ path: filePath, fullPage });
    console.log(`📸 Guardada captura: ${name}`);
  }

  try {
    console.log('Navegando al login...');
    await page.goto('https://amauti.keoit.com', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(1500);

    console.log('Ingresando como Tutor/Docente: 70000104...');
    await page.waitForSelector('input[placeholder="DNI"]');
    await page.type('input[placeholder="DNI"]', '70000104', { delay: 40 });
    await page.type('input[type="password"]', 'Demo-Escuela-2026', { delay: 40 });

    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {}),
    ]);
    await sleep(2500);

    console.log('17. Docente Hoy...');
    await takeShot('17_docente_hoy_tablero_diario.png', true);

    console.log('18. Mi Aula / Pase de lista...');
    await page.goto('https://amauti.keoit.com/docente/aula', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2000);
    await takeShot('18_docente_pase_lista_asistencia.png', true);

    console.log('19. Documentos (Papeleo generado desde WhatsApp)...');
    await page.goto('https://amauti.keoit.com/documentos', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2000);
    await takeShot('19_documentos_papeleo_whatsapp_copiloto.png', true);

    // Clic en tab "Aprobados" o "Por revisar" si hay
    const tabAprobados = await page.$('button ::-p-text(Aprobados)');
    if (tabAprobados) {
      await tabAprobados.click();
      await sleep(1000);
      await takeShot('19b_documentos_aprobados.png', true);
    }

    console.log('20. Registro de Notas por Competencias...');
    await page.goto('https://amauti.keoit.com/notas', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2000);
    await takeShot('20_registro_calificaciones_competencias.png', true);

    console.log('21. Planes de Apoyo...');
    await page.goto('https://amauti.keoit.com/planes', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2000);
    await takeShot('21_planes_apoyo_diagnostico.png', true);

    // Si hay un plan, entrar al detalle
    const planLink = await page.$('a[href^="/planes/"]');
    if (planLink) {
      const planUrl = await planLink.evaluate((el) => el.getAttribute('href'));
      await page.goto(`https://amauti.keoit.com${planUrl}`, { waitUntil: 'networkidle2', timeout: 30000 });
      await sleep(2000);
      await takeShot('21b_plan_detalle_intervencion.png', true);
    }

    console.log('22. Ficha Integral del Estudiante...');
    await page.goto('https://amauti.keoit.com/docente', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(1500);
    const studentLink = await page.$('a[href^="/estudiantes/"]');
    if (studentLink) {
      const studentUrl = await studentLink.evaluate((el) => el.getAttribute('href'));
      console.log('Navegando a ficha del estudiante:', studentUrl);
      await page.goto(`https://amauti.keoit.com${studentUrl}`, { waitUntil: 'networkidle2', timeout: 30000 });
      await sleep(2000);
      await takeShot('22_ficha_integral_estudiante_cneb.png', true);
    }

    console.log('✨ Capturas de rol Docente/Tutor completadas con éxito!');
  } catch (err) {
    console.error('Error capturando docente:', err);
  } finally {
    await browser.close();
  }
}

captureTeacher();
