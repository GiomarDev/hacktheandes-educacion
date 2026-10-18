const puppeteer = require('puppeteer-core');
const path = require('path');

const BRAVE_PATH = 'C:\\Users\\augus\\AppData\\Local\\BraveSoftware\\Brave-Browser\\Application\\brave.exe';

async function loginAndExplore() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    executablePath: BRAVE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    defaultViewport: {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 2,
    },
  });

  try {
    const page = await browser.newPage();
    console.log('Navigating to login...');
    await page.goto('https://amauti.keoit.com', { waitUntil: 'networkidle2', timeout: 30000 });

    console.log('Typing credentials for MINEDU_ADMIN (70000100)...');
    await page.waitForSelector('input[placeholder="DNI"]');
    await page.type('input[placeholder="DNI"]', '70000100', { delay: 50 });
    await page.type('input[type="password"]', 'Demo-Escuela-2026', { delay: 50 });

    console.log('Submitting login form...');
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {}),
    ]);

    await new Promise((r) => setTimeout(r, 3000));
    console.log('Current URL after login:', page.url());

    const outPath = path.resolve(__dirname, '../../docs/pitch/screenshots/01_after_login.png');
    await page.screenshot({ path: outPath, fullPage: true });
    console.log('Screenshot saved to', outPath);

    // Let's check the current HTML or text
    const title = await page.title();
    console.log('Page title:', title);

    // Let's inspect nav links
    const links = await page.$$eval('a[href]', (els) => els.map(e => ({ text: e.innerText.trim(), href: e.getAttribute('href') })));
    console.log('Nav links found:', JSON.stringify(links, null, 2));

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await browser.close();
  }
}

loginAndExplore();
