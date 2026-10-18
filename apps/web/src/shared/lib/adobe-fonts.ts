interface AdobeFontsOptions {
  kitId?: string;
  uiFamily?: string;
  displayFamily?: string;
}

// El ID de un proyecto web es público; nunca se necesita una contraseña de Adobe.
// Sin kit o si falla el proveedor, las dos fuentes locales siguen funcionando.
export function configureAdobeFonts({
  kitId,
  uiFamily = 'source-sans-3',
  displayFamily = 'source-serif-4',
}: AdobeFontsOptions) {
  if (!kitId || !/^[a-z0-9]{7}$/i.test(kitId)) return;
  const validFamily = (value: string) =>
    /^[a-z0-9][a-z0-9 -]{0,80}$/i.test(value);
  if (!validFamily(uiFamily) || !validFamily(displayFamily)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://use.typekit.net/${kitId}.css`;
  link.dataset.amautiAdobeFonts = 'true';
  link.onload = () => {
    document.documentElement.style.setProperty(
      '--font-sans',
      `"${uiFamily}", "Source Sans 3", "Segoe UI", Arial, sans-serif`,
    );
    document.documentElement.style.setProperty(
      '--font-display',
      `"${displayFamily}", "Source Serif 4", Georgia, serif`,
    );
  };
  document.head.append(link);
}
