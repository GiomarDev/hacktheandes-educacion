import { useState } from 'react';
import { Link } from 'react-router';
import { useAlerts, useSchools } from '../api/queries';
import {
  Badge,
  Card,
  Empty,
  ErrorNote,
  inputClass,
  Loading,
  PageHeader,
} from '../ui/kit';

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
            <table className="w-full min-w-[640px] text-[12.5px]">
              <thead>
                <tr className="border-b border-line text-left text-[11px] text-faint uppercase">
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
                        to={`/escuelas/${s.id}`}
                        className="font-medium hover:underline"
                      >
                        {s.name}
                      </Link>
                      <div className="font-mono text-[11px] text-faint">
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
                    <td className="px-3 py-2.5 font-mono">{s.attentionGoal}</td>
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
