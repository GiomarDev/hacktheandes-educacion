import { isChunkLoadError, reloadForNewVersion } from './app-version';

describe('recarga por nueva versión', () => {
  const reload = vi.fn();
  beforeEach(() => {
    sessionStorage.clear();
    reload.mockReset();
    vi.useFakeTimers({ now: new Date('2026-10-18T12:00:00Z') });
  });
  afterEach(() => vi.useRealTimers());

  it('reconoce los errores de carga de módulos de cada navegador', () => {
    expect(
      isChunkLoadError(
        new TypeError(
          'Failed to fetch dynamically imported module: https://x/assets/a.js',
        ),
      ),
    ).toBe(true);
    expect(
      isChunkLoadError(new TypeError('Importing a module script failed.')),
    ).toBe(true);
    expect(
      isChunkLoadError(
        new TypeError(
          'error loading dynamically imported module: https://x/a.js',
        ),
      ),
    ).toBe(true);
    expect(isChunkLoadError(new Error('No tiene acceso a esta IE'))).toBe(
      false,
    );
    expect(isChunkLoadError('cadena')).toBe(false);
  });

  it('recarga una vez y no entra en bucle si el error se repite enseguida', () => {
    expect(reloadForNewVersion(reload)).toBe(true);
    expect(reload).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(5_000);
    expect(reloadForNewVersion(reload)).toBe(false);
    expect(reload).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(60_000);
    expect(reloadForNewVersion(reload)).toBe(true);
    expect(reload).toHaveBeenCalledTimes(2);
  });
});

describe('versión publicada', () => {
  it('lee el script de entrada del index.html', async () => {
    const { entryFromHtml } = await import('./app-version');
    const html =
      '<script type="module" crossorigin src="/assets/index-C3eKzd7_.js"></script><link href="/assets/index-Bn3y02XG.css">';
    expect(entryFromHtml(html)).toBe('/assets/index-C3eKzd7_.js');
    expect(entryFromHtml('<html></html>')).toBeNull();
  });
});

describe('destino de la recarga', () => {
  it('si había una navegación en curso, la recarga apunta a esa pantalla', async () => {
    const { reloadTarget, setPendingNavigation } =
      await import('./app-version');
    expect(reloadTarget()).toBeNull();
    setPendingNavigation(() => '/documentos?tab=1');
    expect(reloadTarget()).toBe('/documentos?tab=1');
    setPendingNavigation(() => null);
  });
});
