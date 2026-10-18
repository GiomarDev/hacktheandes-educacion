import { useState } from 'react';
import { Link } from 'react-router';
import { useAlerts, useCases, useUpdateAlert } from '@/features/alerts/api';
import { useSchools } from '@/features/schools/api';
import { useStudentNames } from '@/features/attendance/api';
import type { AlertStatus } from '@/features/alerts/types';
import {
  ALERT_STATUS,
  alertEvidence,
  alertType,
  CASE_STATUS,
  daysUntil,
  formatDate,
  fullName,
  SEVERITY,
  timeAgo,
} from '@/shared/lib/format';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  cx,
  Empty,
  ErrorNote,
  Kpi,
  Loading,
  PageHeader,
} from '@/shared/ui/kit';

const TABS: { status?: AlertStatus; label: string }[] = [
  { status: 'OPEN', label: 'Abiertas' },
  { status: 'ACKNOWLEDGED', label: 'En atención' },
  { status: 'RESOLVED', label: 'Resueltas' },
  { label: 'Todas' },
];

export function AlertasPage() {
  const [tab, setTab] = useState(0);
  const all = useAlerts();
  const alerts = useAlerts({ status: TABS[tab].status });
  const cases = useCases();
  const schools = useSchools();
  const update = useUpdateAlert();
  const names = useStudentNames();
  const nameOf = (id: string | null) => {
    const e = id ? names.get(id) : undefined;
    return e ? fullName(e.student) : null;
  };
  const schoolName = new Map((schools.data ?? []).map((s) => [s.id, s]));
  const open = (all.data ?? []).filter((a) => a.status === 'OPEN');
  const count = (severity: string) =>
    open.filter((a) => a.severity === severity).length;
  const openCases = (cases.data ?? [])
    .filter((c) => !c.closedAt)
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt));

  return (
    <>
      <PageHeader
        title="Centro de alertas"
        subtitle={`${open.length} alertas abiertas en tu ámbito · priorizadas por severidad y antigüedad`}
      />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi
          label="Alertas altas"
          value={count('HIGH')}
          tone="critical"
          hint="Atender en 48 h"
        />
        <Kpi
          label="Alertas medias"
          value={count('MEDIUM')}
          tone="high"
          hint="Esta semana"
        />
        <Kpi label="Alertas bajas" value={count('LOW')} hint="Monitoreo" />
        <Kpi
          label="Casos abiertos"
          value={openCases.length}
          tone="gob"
          hint={`${openCases.filter((c) => c.firstContactAt).length} con familia contactada`}
        />
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <div
            role="tablist"
            className="flex gap-1 overflow-x-auto border-b border-line px-3 pt-2"
          >
            {TABS.map((t, i) => (
              <button
                key={t.label}
                role="tab"
                aria-selected={tab === i}
                onClick={() => setTab(i)}
                className={cx(
                  '-mb-px border-b-2 px-3 py-2 text-[0.9375rem] font-medium whitespace-nowrap',
                  tab === i
                    ? 'border-peru text-ink'
                    : 'border-transparent text-muted hover:text-ink',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          {alerts.isPending ? (
            <Loading />
          ) : alerts.error ? (
            <ErrorNote error={alerts.error} />
          ) : !alerts.data.length ? (
            <Empty title="Sin alertas en esta vista" />
          ) : (
            <ul className="divide-y divide-line">
              {alerts.data.map((a) => {
                const school = schoolName.get(a.schoolId);
                return (
                  <li
                    key={a.id}
                    className="flex flex-wrap items-start gap-3 px-4 py-3.5"
                  >
                    <span
                      className={cx(
                        'mt-1.5 size-2 shrink-0 rounded-full',
                        a.severity === 'HIGH'
                          ? 'bg-critical'
                          : a.severity === 'MEDIUM'
                            ? 'bg-high'
                            : 'bg-medium',
                      )}
                    />
                    <div className="min-w-[220px] flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-[0.875rem] text-faint">
                        <span className="font-sans tabular-nums">
                          #{a.id.slice(-6).toUpperCase()}
                        </span>
                        <Badge tone={SEVERITY[a.severity].tone}>
                          {SEVERITY[a.severity].label}
                        </Badge>
                        <Badge tone={ALERT_STATUS[a.status].tone}>
                          {ALERT_STATUS[a.status].label}
                        </Badge>
                        <span>{timeAgo(a.detectedAt)}</span>
                      </div>
                      <div className="mt-1 font-semibold">
                        {alertType(a.type)}
                        {nameOf(a.studentId) && (
                          <Link
                            viewTransition
                            to={`/estudiantes/${a.studentId}`}
                            className="font-normal text-muted hover:underline"
                          >
                            {' '}
                            · {nameOf(a.studentId)}
                          </Link>
                        )}
                      </div>
                      <div className="text-[0.9375rem] text-muted">
                        {school ? (
                          <Link
                            viewTransition
                            to={`/escuelas/${school.id}`}
                            className="hover:underline"
                          >
                            {school.name}
                          </Link>
                        ) : (
                          'IE de tu ámbito'
                        )}
                        {alertEvidence(a.data)
                          ? ` · ${alertEvidence(a.data)}`
                          : ''}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {a.caseId && (
                        <Link viewTransition to={`/casos/${a.caseId}`}>
                          <Button variant="primary">Ver caso</Button>
                        </Link>
                      )}
                      {a.status === 'OPEN' && (
                        <Button
                          onClick={() =>
                            update.mutate({ id: a.id, status: 'ACKNOWLEDGED' })
                          }
                          busy={
                            update.isPending && update.variables?.id === a.id
                          }
                        >
                          Atender
                        </Button>
                      )}
                      {(a.status === 'OPEN' || a.status === 'ACKNOWLEDGED') && (
                        <>
                          <Button
                            variant="ghost"
                            onClick={() =>
                              update.mutate({ id: a.id, status: 'RESOLVED' })
                            }
                          >
                            Resolver
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() =>
                              update.mutate({ id: a.id, status: 'DISMISSED' })
                            }
                          >
                            Descartar
                          </Button>
                        </>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {update.error ? <ErrorNote error={update.error} /> : null}
        </Card>
        <Card>
          <CardHeader
            title="Casos abiertos"
            subtitle="Ordenados por plazo de contacto"
          />
          {cases.isPending ? (
            <Loading />
          ) : cases.error ? (
            <ErrorNote error={cases.error} />
          ) : !openCases.length ? (
            <Empty title="Sin casos abiertos" />
          ) : (
            <ul className="divide-y divide-line">
              {openCases.slice(0, 12).map((c) => {
                const days = daysUntil(c.dueAt);
                return (
                  <li key={c.id}>
                    <Link
                      viewTransition
                      to={`/casos/${c.id}`}
                      className="block px-4 py-3 hover:bg-canvas"
                    >
                      <div className="flex items-center gap-2">
                        <Badge tone={CASE_STATUS[c.status].tone}>
                          {CASE_STATUS[c.status].label}
                        </Badge>
                        <span
                          className={cx(
                            'ml-auto font-sans tabular-nums text-[0.875rem]',
                            days <= 0 ? 'text-critical' : 'text-faint',
                          )}
                        >
                          {days <= 0 ? 'vencido' : `${days} d`}
                        </span>
                      </div>
                      {nameOf(c.studentId) && (
                        <div className="mt-1 font-medium">
                          {nameOf(c.studentId)}
                        </div>
                      )}
                      <div className="mt-1 text-[0.9375rem] text-muted">
                        {schoolName.get(c.schoolId)?.name ?? 'IE'} · abierto{' '}
                        {formatDate(c.openedAt)} · nivel {c.escalationLevel}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
