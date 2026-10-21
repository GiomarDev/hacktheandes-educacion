import type { GeneratedDocument } from '@/features/documents/types';
import { formatDate } from '@/shared/lib/format';
import {
  buildDoc,
  buildDocx,
  buildXlsx,
} from '@/features/documents/lib/officeFiles';

export type TemplateExt = 'docx' | 'doc' | 'xlsx';

// El recordatorio lo escribió el docente; se rotula para no hacerlo pasar por contenido generado.
export const reminderLabel = (category: string) =>
  `Tu recordatorio guardado para documentos «${category}» (ayuda de revisión; no se aplicó al contenido generado)`;

// Mientras no se almacena el archivo original, la descarga es una plantilla con los datos del registro.
export function buildTemplate(
  doc: GeneratedDocument,
  ext: TemplateExt,
  reminder?: string,
): Uint8Array {
  const category = doc.category ?? 'Documento';
  const lines = [
    `Tipo de documento: ${category}`,
    `Generado por Amauti a partir de tus mensajes de WhatsApp el ${formatDate(doc.createdAt, true)}.`,
    'Corrige o completa este documento y súbelo de nuevo en la plataforma.',
    ...(reminder ? [`${reminderLabel(category)}: ${reminder}`] : []),
  ];
  if (ext === 'xlsx')
    return buildXlsx(category, [
      ['Campo', 'Valor'],
      ['Documento', doc.title],
      ['Tipo', category],
      ['Generado', formatDate(doc.createdAt, true)],
      ['Origen', 'WhatsApp'],
      ...(reminder ? [[reminderLabel(category), reminder]] : []),
    ]);
  return ext === 'docx'
    ? buildDocx(doc.title, lines)
    : buildDoc(doc.title, lines);
}
