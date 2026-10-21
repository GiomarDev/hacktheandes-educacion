import { buildTemplate } from '@/features/documents/lib/template';
import type { GeneratedDocument } from '@/features/documents/types';

const text = (bytes: Uint8Array) => new TextDecoder().decode(bytes);

// Contenido de una entrada de un ZIP "store" por sus cabeceras locales.
function entry(zip: Uint8Array, wanted: string) {
  const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
  let p = 0;
  while (view.getUint32(p, true) === 0x04034b50) {
    const size = view.getUint32(p + 18, true);
    const nameLen = view.getUint16(p + 26, true);
    const start = p + 30 + nameLen + view.getUint16(p + 28, true);
    if (text(zip.slice(p + 30, p + 30 + nameLen)) === wanted)
      return text(zip.slice(start, start + size));
    p = start + size;
  }
  throw new Error(`Falta ${wanted}`);
}

const doc: GeneratedDocument = {
  id: 'd1',
  schoolId: 's1',
  ownerUserId: 'u1',
  title: 'Sesión de aprendizaje: textos narrativos',
  category: 'Sesión de aprendizaje',
  format: 'WORD',
  source: 'WHATSAPP',
  status: 'REJECTED',
  reviewedAt: null,
  correctionFileName: null,
  correctionMimeType: null,
  correctionSizeBytes: null,
  correctionUploadedAt: null,
  createdAt: '2026-10-16T15:00:00.000Z',
};

describe('plantilla de corrección', () => {
  it('incluye el recordatorio guardado, rotulado como ayuda de revisión', () => {
    const xml = entry(
      buildTemplate(doc, 'docx', 'Pon las competencias del CNEB al inicio'),
      'word/document.xml',
    );
    expect(xml).toContain(
      'Tu recordatorio guardado para documentos «Sesión de aprendizaje» (ayuda de revisión; no se aplicó al contenido generado): Pon las competencias del CNEB al inicio',
    );
    expect(text(buildTemplate(doc, 'doc', 'Usa Arial 12'))).toContain(
      'Usa Arial 12',
    );
    expect(
      entry(
        buildTemplate(
          { ...doc, format: 'EXCEL' },
          'xlsx',
          'Una fila por alumno',
        ),
        'xl/worksheets/sheet1.xml',
      ),
    ).toContain('Una fila por alumno');
  });

  it('sin recordatorio la plantilla queda como antes', () => {
    const xml = entry(buildTemplate(doc, 'docx'), 'word/document.xml');
    expect(xml).not.toContain('recordatorio');
    expect(xml).toContain('Tipo de documento: Sesión de aprendizaje');
  });
});
