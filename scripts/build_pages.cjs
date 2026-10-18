const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const tempDir = path.join(require('os').tmpdir(), 'gh-pages-build');
if (fs.existsSync(tempDir)) {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
fs.mkdirSync(tempDir, { recursive: true });
fs.mkdirSync(path.join(tempDir, 'screenshots'), { recursive: true });
fs.mkdirSync(path.join(tempDir, 'presentacion'), { recursive: true });

let html = fs.readFileSync('docs/pitch/presentacion.html', 'utf8');
html = html.replace('../presentacion/mockup_phone_full.png', './presentacion/mockup_phone_full.png');
fs.writeFileSync(path.join(tempDir, 'index.html'), html, 'utf8');

const screenshots = [
  '01_panorama_nacional_secundaria.png',
  '14_fuentes_datos_abiertos_csv.png',
  '16_admin_reglas_alerta_umbrales.png',
  '17_docente_hoy_tablero_diario_limpio.png',
  'wsp_real_alerta_nayeli.png',
  'wsp_real_bitacora_observaciones.png'
];

for (const file of screenshots) {
  fs.copyFileSync(path.join('docs/pitch/screenshots', file), path.join(tempDir, 'screenshots', file));
}

fs.copyFileSync('docs/presentacion/mockup_phone_full.png', path.join(tempDir, 'presentacion', 'mockup_phone_full.png'));
fs.copyFileSync('docs/presentacion/mockup_phone_full.png', path.join(tempDir, 'mockup_phone_full.png'));
fs.writeFileSync(path.join(tempDir, '.nojekyll'), '', 'utf8');

console.log('Build completed in', tempDir);

const written = fs.readFileSync(path.join(tempDir, 'index.html'), 'utf8');
if (!written.includes('El Punto Ciego de 60 Días') || !written.includes('👩‍🏫') || written.includes('Ã')) {
  throw new Error('Encoding verification failed!');
}
console.log('Encoding verified: 100% clean UTF-8!');

execSync('git init -b gh-pages', { cwd: tempDir, stdio: 'inherit' });
execSync('git config user.email "augustohuertacopywriting@gmail.com"', { cwd: tempDir, stdio: 'inherit' });
execSync('git config user.name "Augusto Huerta"', { cwd: tempDir, stdio: 'inherit' });
execSync('git add -A', { cwd: tempDir, stdio: 'inherit' });
execSync('git commit -m "fix(pages): corregir codificacion UTF-8 estricta en la presentacion"', { cwd: tempDir, stdio: 'inherit' });
execSync('git remote add origin https://github.com/GiomarDev/hacktheandes-educacion.git', { cwd: tempDir, stdio: 'inherit' });
execSync('git push --force origin gh-pages', { cwd: tempDir, stdio: 'inherit' });
console.log('Successfully pushed clean UTF-8 to origin/gh-pages!');
