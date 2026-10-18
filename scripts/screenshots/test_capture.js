const puppeteer = require('puppeteer-core');
const path = require('path');

const BRAVE_PATH = 'C:\\Users\\augus\\AppData\\Local\\BraveSoftware\\Brave-Browser\\Application\\brave.exe';

async function test() {
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
    console.log('Navigating to https://amauti.keoit.com ...');
    await page.goto('https://amauti.keoit.com', { waitUntil: 'networkidle2', timeout: 30000 });
    
    const outPath = path.resolve(__dirname, '../../docs/pitch/screenshots/00_login_screen.png');
    await page.screenshot({ path: outPath });
    console.log('Screenshot saved to', outPath);
  } catch (err) {
    console.error('Error during test:', err);
  } finally {
    await browser.close();
    console.log('Browser closed.');
  }
}

test();
