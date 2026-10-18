import { buildDoc, buildDocx, buildXlsx, crc32, zipStore } from './officeFiles';

const text = (bytes: Uint8Array) => new TextDecoder().decode(bytes);

// Lee las entradas de un ZIP "store" por sus cabeceras locales.
function entries(zip: Uint8Array) {
  const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
  const out: { name: string; data: string; crc: number }[] = [];
  let p = 0;
  while (view.getUint32(p, true) === 0x04034b50) {
    const crc = view.getUint32(p + 14, true);
    const size = view.getUint32(p + 18, true);
    const nameLen = view.getUint16(p + 26, true);
    const extra = view.getUint16(p + 28, true);
    const name = text(zip.slice(p + 30, p + 30 + nameLen));
    const start = p + 30 + nameLen + extra;
    out.push({ name, data: text(zip.slice(start, start + size)), crc });
    p = start + size;
  }
  return out;
}

describe('archivos de Office', () => {
  it('calcula el CRC-32 estándar', () => {
    expect(crc32(new TextEncoder().encode('123456789'))).toBe(0xcbf43926);
  });

  it('el ZIP guarda cada archivo con su CRC y cierra con el directorio central', () => {
    const zip = zipStore([{ name: 'a.txt', data: 'hola' }]);
    const [entry] = entries(zip);
    expect(entry).toEqual({
      name: 'a.txt',
      data: 'hola',
      crc: crc32(new TextEncoder().encode('hola')),
    });
    const view = new DataView(zip.buffer);
    expect(view.getUint32(zip.length - 22, true)).toBe(0x06054b50);
  });

  it('el .docx trae las partes mínimas y el texto escapado', () => {
    const names = entries(
      buildDocx('Acta <1.° A> & familias', ['Línea uno']),
    ).map((e) => e.name);
    expect(names).toEqual([
      '[Content_Types].xml',
      '_rels/.rels',
      'word/document.xml',
    ]);
    const doc = entries(buildDocx('Acta <1.° A> & familias', ['Línea uno']))[2]
      .data;
    expect(doc).toContain('Acta &lt;1.° A&gt; &amp; familias');
    expect(doc).toContain('Línea uno');
  });

  it('el .xlsx trae libro, hoja y celdas de texto', () => {
    const files = entries(
      buildXlsx('Registro', [
        ['DNI', 'Nombre'],
        ['1', 'Ana & Luis'],
      ]),
    );
    expect(files.map((e) => e.name)).toContain('xl/worksheets/sheet1.xml');
    const sheet = files.find(
      (e) => e.name === 'xl/worksheets/sheet1.xml',
    )!.data;
    expect(sheet).toContain(
      '<c r="B2" t="inlineStr"><is><t>Ana &amp; Luis</t></is></c>',
    );
  });

  it('el .doc es HTML que Word abre', () => {
    const doc = text(buildDoc('Informe', ['Hola <b>']));
    expect(doc).toContain('urn:schemas-microsoft-com:office:word');
    expect(doc).toContain('Hola &lt;b&gt;');
  });
});
