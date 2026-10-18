// Tras un despliegue, los archivos con hash de la versión anterior dejan de existir. Una pestaña
// abierta desde antes falla al cargar una pantalla: se recarga para tomar la versión nueva.

const RELOAD_KEY = 'amauti.version-reload-at';
const LOOP_GUARD_MS = 30_000;

const CHUNK_ERROR =
  /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Unable to preload CSS/i;

export function isChunkLoadError(error: unknown): boolean {
  return error instanceof Error && CHUNK_ERROR.test(error.message);
}

// Recarga una sola vez: si el error se repite enseguida (p. ej. el servidor no responde),
// no entra en un bucle y deja que se muestre la pantalla de error.
export function reloadForNewVersion(
  reload: () => void = () => window.location.reload(),
): boolean {
  let last = 0;
  try {
    last = Number(window.sessionStorage.getItem(RELOAD_KEY) ?? 0);
  } catch {
    // Sin sessionStorage: se recarga igual.
  }
  if (Date.now() - last < LOOP_GUARD_MS) return false;
  try {
    window.sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    // Sin sessionStorage no hay protección contra bucles, pero tampoco persiste el estado.
  }
  reload();
  return true;
}

// Script de entrada de una versión (index-<hash>.js), leído del index.html.
export function entryFromHtml(html: string): string | null {
  return (
    html.match(/<script[^>]+src="([^"]*\/assets\/index-[^"]+\.js)"/)?.[1] ??
    null
  );
}

export function currentEntry(): string | null {
  const script = document.querySelector<HTMLScriptElement>(
    'script[type="module"][src*="/assets/index-"]',
  );
  return script ? new URL(script.src).pathname : null;
}

// ¿Se publicó una versión distinta de la cargada? index.html se sirve sin caché.
export async function hasNewVersion(): Promise<boolean> {
  const loaded = currentEntry();
  if (!loaded) return false; // desarrollo (Vite) o sin build
  try {
    const response = await fetch('/', { cache: 'no-store' });
    if (!response.ok) return false;
    const deployed = entryFromHtml(await response.text());
    return !!deployed && deployed !== loaded;
  } catch {
    return false;
  }
}
