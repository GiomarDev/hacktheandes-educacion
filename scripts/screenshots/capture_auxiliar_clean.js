const puppeteer = require('puppeteer-core');
const path = require('path');

const BRAVE_PATH = 'C:\\Users\\augus\\AppData\\Local\\BraveSoftware\\Brave-Browser\\Application\\brave.exe';
const SCREENSHOTS_DIR = path.resolve(__dirname, '../../docs/pitch/screenshots');

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  const browser = await puppeteer.launch({
    executablePath: BRAVE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1920, height: 1080, deviceScaleFactor: 2 },
  });
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  await page.goto('https://amauti.keoit.com', { waitUntil: 'networkidle2' });
  await page.waitForSelector('input[placeholder="DNI"]');
  await page.type('input[placeholder="DNI"]', '70000108', { delay: 40 });
  await page.type('input[type="password"]', 'Demo-Escuela-2026', { delay: 40 });
  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {}),
  ]);
  await sleep(2500);
  // Cerrar el tour con Escape o botón X
  await page.keyboard.press('Escape');
  await sleep(600);
  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, '17_docente_hoy_tablero_diario_limpio.png'),
    fullPage: true,
  });
  console.log('Saved 17_docente_hoy_tablero_diario_limpio.png');
  await browser.close();
}

run();
