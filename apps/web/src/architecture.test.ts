// Reglas de capas del frontend (ver apps/web/README.md):
//   app → features → shared. shared no conoce features ni app; features no conocen app;
//   una feature no importa las páginas de otra (solo su api, tipos o componentes públicos).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const SRC = join(__dirname);

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return files(path);
    return /\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}

const imports = (path: string) =>
  [
    ...readFileSync(path, 'utf8').matchAll(
      /from '(@\/[^']+)'|import\('(@\/[^']+)'\)/g,
    ),
  ].map((m) => m[1] ?? m[2]);

const all = files(SRC).map((path) => ({
  file: relative(SRC, path),
  imports: imports(path),
}));

describe('arquitectura', () => {
  it('shared no depende de features ni de app', () => {
    const bad = all
      .filter((f) => f.file.startsWith('shared/'))
      .flatMap((f) =>
        f.imports
          .filter((i) => /^@\/(features|app)\//.test(i))
          .map((i) => `${f.file} → ${i}`),
      );
    expect(bad).toEqual([]);
  });

  it('features no depende de app', () => {
    const bad = all
      .filter((f) => f.file.startsWith('features/'))
      .flatMap((f) =>
        f.imports
          .filter((i) => i.startsWith('@/app/'))
          .map((i) => `${f.file} → ${i}`),
      );
    expect(bad).toEqual([]);
  });

  it('una feature no importa páginas de otra; las páginas se cargan desde el router', () => {
    const bad = all
      .filter((f) => f.file.startsWith('features/'))
      .flatMap((f) => {
        const own = f.file.split('/')[1];
        return f.imports
          .filter(
            (i) =>
              /^@\/features\/[^/]+\/pages\//.test(i) && i.split('/')[2] !== own,
          )
          .map((i) => `${f.file} → ${i}`);
      });
    expect(bad).toEqual([]);
  });

  it('no quedan imports relativos que suban de carpeta', () => {
    const bad = files(SRC)
      .filter((p) => /from '\.\.\//.test(readFileSync(p, 'utf8')))
      .map((p) => relative(SRC, p));
    expect(bad).toEqual([]);
  });
});
