import {
  Check,
  Download,
  FileSpreadsheet,
  FileText,
  MessageCircle,
  X,
} from 'lucide-react';
import type { GeneratedDocument } from '@/features/documents/types';
import { formatDate } from '@/shared/lib/format';
import {
  buildDoc,
  buildDocx,
  buildXlsx,
  downloadBytes,
  MIME,
} from '@/features/documents/lib/officeFiles';
import { Badge, Button, cx } from '@/shared/ui/kit';
import type { Tone } from '@/shared/ui/kit';
import { DropZone } from '@/features/documents/components/DropZone';

const STATUS: Record<
  GeneratedDocument['status'],
  { label: string; tone: Tone }
> = {
  PENDING: { label: 'Por revisar', tone: 'medium' },
  APPROVED: { label: 'Aprobado', tone: 'stable' },
  REJECTED: { label: 'No aprobado', tone: 'critical' },
};

const sizeLabel = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;

const slug = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\w]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
    .slice(0, 60);

// Mientras no se almacena el archivo original, la descarga es una plantilla con los datos del registro.
function download(doc: GeneratedDocument, ext: 'docx' | 'doc' | 'xlsx') {
  const lines = [
    `Tipo de documento: ${doc.category ?? 'Documento'}`,
    `Generado por Amauti a partir de tus mensajes de WhatsApp el ${formatDate(doc.createdAt, true)}.`,
    'Corrige o completa este documento y súbelo de nuevo en la plataforma.',
  ];
  const bytes =
    ext === 'xlsx'
      ? buildXlsx(doc.category ?? 'Documento', [
          ['Campo', 'Valor'],
          ['Documento', doc.title],
          ['Tipo', doc.category ?? 'Documento'],
          ['Generado', formatDate(doc.createdAt, true)],
          ['Origen', 'WhatsApp'],
        ])
      : ext === 'docx'
        ? buildDocx(doc.title, lines)
        : buildDoc(doc.title, lines);
  downloadBytes(bytes, `${slug(doc.title)}.${ext}`, MIME[ext]);
}

export function DocumentCard({
  doc,
  canReview,
  onReview,
  onCorrection,
  busy,
}: {
  doc: GeneratedDocument;
  canReview: boolean;
  onReview(status: 'APPROVED' | 'REJECTED'): void;
  onCorrection(file: File): void;
  busy?: boolean;
}) {
  const word = doc.format === 'WORD';
  const Icon = word ? FileText : FileSpreadsheet;
  const status = STATUS[doc.status];
  return (
    <li className="px-4 py-4 sm:px-5">
      <div className="flex flex-wrap items-start gap-3">
        <div
          className={cx(
            'flex size-11 shrink-0 items-center justify-center rounded-md',
            word ? 'bg-gob-soft text-gob' : 'bg-stable-soft text-stable',
          )}
          aria-hidden
        >
          <Icon className="size-5" />
        </div>
        <div className="min-w-[200px] flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-ink">{doc.title}</h3>
            <Badge tone={status.tone}>{status.label}</Badge>
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[0.875rem] text-muted">
            <span>{doc.category ?? 'Documento'}</span>
            <span aria-hidden>·</span>
            <span>{word ? 'Word' : 'Excel'}</span>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1">
              <MessageCircle className="size-3.5" aria-hidden /> Generado desde
              WhatsApp {formatDate(doc.createdAt, true)}
            </span>
          </p>
        </div>
        {canReview && (
          <div
            className="flex gap-2"
            role="group"
            aria-label={`Revisión de ${doc.title}`}
          >
            <Button
              variant={doc.status === 'APPROVED' ? 'primary' : 'secondary'}
              aria-pressed={doc.status === 'APPROVED'}
              disabled={busy}
              onClick={() => onReview('APPROVED')}
            >
              <Check className="size-4" aria-hidden /> Aprobado
            </Button>
            <Button
              variant={doc.status === 'REJECTED' ? 'danger' : 'secondary'}
              aria-pressed={doc.status === 'REJECTED'}
              disabled={busy}
              onClick={() => onReview('REJECTED')}
            >
              <X className="size-4" aria-hidden /> No aprobado
            </Button>
          </div>
        )}
      </div>

      {doc.status === 'REJECTED' && (
        <div className="fade-in mt-4 space-y-3 rounded-md border border-line bg-card p-4 sm:ml-14">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[0.875rem] font-medium text-ink">
              Descargar para corregir:
            </span>
            {word ? (
              <>
                <Button onClick={() => download(doc, 'docx')}>
                  <Download className="size-4" aria-hidden /> Word .docx
                </Button>
                <Button onClick={() => download(doc, 'doc')}>
                  <Download className="size-4" aria-hidden /> Word .doc
                </Button>
              </>
            ) : (
              <Button onClick={() => download(doc, 'xlsx')}>
                <Download className="size-4" aria-hidden /> Excel .xlsx
              </Button>
            )}
          </div>
          <p className="text-[0.9375rem] text-muted">
            Puedes subir otro documento o tus correcciones del mismo. Arrastra
            el archivo a la casilla o elígelo desde tu equipo.
          </p>
          {doc.correctionFileName && (
            <p
              role="status"
              className="rounded bg-stable-soft px-3 py-2 text-[0.875rem] text-stable"
            >
              Corrección registrada:{' '}
              <span className="font-medium">{doc.correctionFileName}</span>
              {doc.correctionSizeBytes
                ? ` (${sizeLabel(doc.correctionSizeBytes)})`
                : ''}
              {doc.correctionUploadedAt
                ? ` · ${formatDate(doc.correctionUploadedAt, true)}`
                : ''}
            </p>
          )}
          {canReview && <DropZone onFile={onCorrection} disabled={busy} />}
        </div>
      )}
    </li>
  );
}
