import { configureAdobeFonts } from '@/shared/lib/adobe-fonts';

afterEach(() => {
  document.head
    .querySelectorAll('[data-amauti-adobe-fonts]')
    .forEach((link) => link.remove());
  document.documentElement.style.removeProperty('--font-sans');
  document.documentElement.style.removeProperty('--font-display');
});

describe('kit opcional de Adobe Fonts', () => {
  it('no contacta a un proveedor si no se ha configurado un kit', () => {
    configureAdobeFonts({});
    expect(document.querySelector('[data-amauti-adobe-fonts]')).toBeNull();
  });
  it('rechaza URLs y nombres que puedan introducir CSS en la configuración', () => {
    configureAdobeFonts({ kitId: 'https://other.example/fonts.css' });
    configureAdobeFonts({ kitId: 'abc1234', uiFamily: 'bad"; color:red' });
    expect(document.querySelector('[data-amauti-adobe-fonts]')).toBeNull();
  });
  it('conserva las familias locales cuando la hoja del proveedor falla', () => {
    configureAdobeFonts({ kitId: 'abc1234' });
    document
      .querySelector('link[data-amauti-adobe-fonts]')
      ?.dispatchEvent(new Event('error'));
    expect(document.documentElement.style.getPropertyValue('--font-sans')).toBe(
      '',
    );
  });
  it('activa las familias del kit al cargar y conserva un respaldo local', () => {
    configureAdobeFonts({
      kitId: 'abc1234',
      uiFamily: 'acumin-pro',
      displayFamily: 'source-serif-4',
    });
    const link = document.querySelector<HTMLLinkElement>(
      'link[data-amauti-adobe-fonts]',
    )!;
    expect(link.href).toBe('https://use.typekit.net/abc1234.css');
    link.dispatchEvent(new Event('load'));
    expect(
      document.documentElement.style.getPropertyValue('--font-sans'),
    ).toContain('"acumin-pro", "Source Sans 3"');
    expect(
      document.documentElement.style.getPropertyValue('--font-display'),
    ).toContain('"Source Serif 4"');
  });
});
