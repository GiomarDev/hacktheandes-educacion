import { useState } from 'react';
import { Link } from 'react-router';
import { useAlerts } from '@/features/alerts/api';
import { useSchools } from '@/features/schools/api';
import {
  Badge,
  Card,
  Empty,
  ErrorNote,
  inputClass,
  Loading,
  PageHeader,
} from '@/shared/ui/kit';

export function EscuelasPage() {
  const schools = useSchools();
  const alerts = useAlerts({ status: 'OPEN' });
  const [q, setQ] = useState('');
  const count = new Map<string, number>();
  for (const a of alerts.data ?? [])
    count.set(a.schoolId, (count.get(a.schoolId) ?? 0) + 1);
  const term = q.trim().toLowerCase();
  const rows = (schools.data ?? []).filter(
    (s) =>
      !term ||
      s.name.toLowerCase().includes(term) ||
      s.modularCode.includes(term) ||
      s.district.toLowerCase().includes(term),
  );
  return (
    <>
      <PageHeader
        title="Instituciones educativas"
        subtitle={`${schools.data?.length ?? 0} IE en tu ámbito`}
      />
      <Card>
        <div className="border-b border-line p-3">
          <input
            className={inputClass}
            placeholder="Buscar por nombre, código modular o distrito…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Buscar IE"
          />
        </div>
        {schools.isPending ? (
          <Loading />
        ) : schools.error ? (
          <ErrorNote error={schools.error} />
        ) : !rows.length ? (
          <Empty title="No hay IEs que coincidan" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-[0.9375rem]">
              <thead>
                <tr className="border-b border-line text-left text-[0.875rem] text-faint">
                  <th className="px-4 py-2 font-medium">
                    Institución educativa
                  </th>
                  <th className="px-3 py-2 font-medium">Ubicación</th>
                  <th className="px-3 py-2 font-medium">Nivel</th>
                  <th className="px-3 py-2 font-medium">Meta de atención</th>
                  <th className="px-3 py-2 font-medium">Alertas</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-line last:border-0 hover:bg-canvas"
                  >
                    <td className="px-4 py-2.5">
                      <Link
                        viewTransition
                        to={`/escuelas/${s.id}`}
                        className="font-medium hover:underline"
                      >
                        {s.name}
                      </Link>
                      <div className="font-sans tabular-nums text-[0.875rem] text-faint">
                        {s.modularCode}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-muted">
                      {s.district}, {s.province} ·{' '}
                      {s.area === 'RURAL' ? 'Rural' : 'Urbana'}
                    </td>
                    <td className="px-3 py-2.5 text-muted">
                      {s.level === 'SECONDARY'
                        ? 'Secundaria'
                        : s.level === 'PRIMARY'
                          ? 'Primaria'
                          : s.level}{' '}
                      · {s.management === 'PUBLIC' ? 'pública' : 'privada'}
                    </td>
                    <td className="px-3 py-2.5 font-sans tabular-nums">
                      {s.attentionGoal}
                    </td>
                    <td className="px-3 py-2.5">
                      {count.get(s.id) ? (
                        <Badge tone="critical">
                          {count.get(s.id)} abiertas
                        </Badge>
                      ) : (
                        <Badge tone="stable">0</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
