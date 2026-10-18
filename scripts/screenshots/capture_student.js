const puppeteer = require('puppeteer-core');
const path = require('path');

const BRAVE_PATH = 'C:\\Users\\augus\\AppData\\Local\\BraveSoftware\\Brave-Browser\\Application\\brave.exe';
const SCREENSHOTS_DIR = path.resolve(__dirname, '../../docs/pitch/screenshots');

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function captureDirectorAndStudent() {
  console.log('🚀 Iniciando captura de Dirección y Ficha de Estudiante (70000102)...');
  const browser = await puppeteer.launch({
    executablePath: BRAVE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1920,1080'],
    defaultViewport: {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 2,
    },
  });

  const context = await browser.createBrowserContext();
  const page = await context.newPage();

  async function takeShot(name, fullPage = false) {
    const filePath = path.join(SCREENSHOTS_DIR, name);
    await page.screenshot({ path: filePath, fullPage });
    console.log(`📸 Guardada captura: ${name}`);
  }

  try {
    await page.goto('https://amauti.keoit.com', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(1000);

    console.log('Ingresando como Director: 70000102...');
    await page.waitForSelector('input[placeholder="DNI"]');
    await page.type('input[placeholder="DNI"]', '70000102', { delay: 40 });
    await page.type('input[type="password"]', 'Demo-Escuela-2026', { delay: 40 });

    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {}),
    ]);
    await sleep(2500);

    // 1. Pase de lista con estudiantes cargados
    console.log('Navegando a Mi Aula / Pase de Lista con estudiantes reales...');
    await page.goto('https://amauti.keoit.com/docente/aula?seccion=01920000-0000-7000-8000-000000000010', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2000);
    await takeShot('18_pase_lista_diario_aula_alumnos.png', true);

    // 2. Ficha del estudiante Kevin Ahuanari Vela
    console.log('Navegando a Ficha Integral del Estudiante...');
    await page.goto('https://amauti.keoit.com/estudiantes/01920000-0000-7000-8001-000000000013', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2000);
    await takeShot('22_ficha_integral_estudiante_cneb.png', true);

    // 3. Registro de notas de la sección
    console.log('Navegando a Registro de notas...');
    await page.goto('https://amauti.keoit.com/notas?seccion=01920000-0000-7000-8000-000000000010', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2000);
    await takeShot('20_registro_calificaciones_competencias_aula.png', true);

    // 4. Planes de apoyo con diagnóstico
    console.log('Navegando a Planes de apoyo...');
    await page.goto('https://amauti.keoit.com/planes', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2000);
    await takeShot('21_planes_apoyo_diagnostico_direccion.png', true);

    // Si hay un plan, detalle
    const planLink = await page.$('a[href^="/planes/"]');
    if (planLink) {
      const planUrl = await planLink.evaluate(el => el.getAttribute('href'));
      await page.goto(`https://amauti.keoit.com${planUrl}`, { waitUntil: 'networkidle2', timeout: 30000 });
      await sleep(2000);
      await takeShot('21b_plan_detalle_pedagogico.png', true);
    }

    console.log('✨ Capturas de Director y Ficha completadas exitosamente!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await browser.close();
  }
}

captureDirectorAndStudent();
