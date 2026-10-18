import { useState } from 'react';
import { useSession } from '../auth/AuthProvider';
import {
  useDocumentCorrection,
  useDocuments,
  useReviewDocument,
} from '../api/queries';
import type { DocumentStatus } from '../api/types';
import { DocumentCard } from '../features/DocumentCard';
import {
  Card,
  cx,
  Empty,
  ErrorNote,
  Kpi,
  Loading,
  PageHeader,
} from '../ui/kit';

const TABS: { status?: DocumentStatus; label: string }[] = [
  { status: 'PENDING', label: 'Por revisar' },
  { status: 'REJECTED', label: 'No aprobados' },
  { status: 'APPROVED', label: 'Aprobados' },
  { label: 'Todos' },
];

export function DocumentosPage() {
  const { user, active } = useSession();
  const [tab, setTab] = useState(0);
  const all = useDocuments();
  const review = useReviewDocument();
  const correction = useDocumentCorrection();
  const docs = all.data ?? [];
  const shown = TABS[tab].status
    ? docs.filter((d) => d.status === TABS[tab].status)
    : docs;
  const count = (s: DocumentStatus) =>
    docs.filter((d) => d.status === s).length;
  const isDirector = active.role === 'DIRECTOR';

  return (
    <>
      <PageHeader
        title="Documentos"
        subtitle={
          isDirector
            ? 'Papeleo que Amauti preparó para los docentes de tu IE a partir de sus mensajes de WhatsApp, con su revisión.'
            : 'Papeleo que Amauti preparó con tus mensajes de WhatsApp. Revísalo y marca si está aprobado; si no, descárgalo y sube tu versión corregida.'
        }
      />
      <div className="mb-5 grid grid-cols-3 gap-3">
        <Kpi
          label="Por revisar"
          value={count('PENDING')}
          tone={count('PENDING') ? 'high' : 'ink'}
        />
        <Kpi
          label="No aprobados"
          value={count('REJECTED')}
          tone={count('REJECTED') ? 'critical' : 'ink'}
        />
        <Kpi label="Aprobados" value={count('APPROVED')} tone="stable" />
      </div>
      <Card>
        <div
          role="tablist"
          aria-label="Filtrar documentos"
          className="flex gap-1 overflow-x-auto border-b border-line px-3 pt-2"
        >
          {TABS.map((t, i) => (
            <button
              key={t.label}
              role="tab"
              aria-selected={tab === i}
              onClick={() => setTab(i)}
              className={cx(
                '-mb-px min-h-11 border-b-2 px-3 py-2 text-[0.9375rem] font-medium whitespace-nowrap transition-colors',
                tab === i
                  ? 'border-peru text-ink'
                  : 'border-transparent text-muted hover:text-ink',
              )}
            >
              {t.label}
              <span className="ml-1.5 tabular-nums text-faint">
                {t.status ? count(t.status) : docs.length}
              </span>
            </button>
          ))}
        </div>
        {all.isPending ? (
          <Loading label="Cargando documentos…" />
        ) : all.error ? (
          <ErrorNote error={all.error} />
        ) : !shown.length ? (
          <Empty
            title={docs.length ? 'Nada en esta vista' : 'Aún no hay documentos'}
          >
            {docs.length
              ? 'Cambia de pestaña para ver los demás documentos.'
              : 'Cuando pidas un documento por WhatsApp, Amauti lo preparará y aparecerá aquí para tu revisión.'}
          </Empty>
        ) : (
          <ul className="divide-y divide-line">
            {shown.map((doc) => (
              <DocumentCard
                key={doc.id}
                doc={doc}
                canReview={doc.ownerUserId === user.id}
                busy={
                  (review.isPending && review.variables?.id === doc.id) ||
                  (correction.isPending && correction.variables?.id === doc.id)
                }
                onReview={(status) => review.mutate({ id: doc.id, status })}
                onCorrection={(file) => correction.mutate({ id: doc.id, file })}
              />
            ))}
          </ul>
        )}
        {review.error ? <ErrorNote error={review.error} /> : null}
        {correction.error ? <ErrorNote error={correction.error} /> : null}
      </Card>
    </>
  );
}
