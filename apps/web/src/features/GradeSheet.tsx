import { useState } from 'react';
import { Plus } from 'lucide-react';
import type { GradeSheet as Sheet, LiteralGrade } from '../api/types';
import { fullName, pct } from '../lib/format';
import { Badge, Button, cx, ErrorNote } from '../ui/kit';
import type { Tone } from '../ui/kit';

export const GRADES: LiteralGrade[] = ['AD', 'A', 'B', 'C'];
const GRADE_TONE: Record<LiteralGrade, Tone> = {
  AD: 'stable',
  A: 'low',
  B: 'medium',
  C: 'critical',
};
// El registro auxiliar admite hasta 20 columnas por competencia (como el backend).
const MAX_COLUMNS = 20;
const MIN_COLUMNS = 3;

export interface GradeChange {
  enrollmentId: string;
  competencyId: string;
  columnNumber: number;
  value: LiteralGrade | null;
}

export function GradeSheet({
  sheet,
  editable,
  onSave,
}: {
  sheet: Sheet;
  editable: boolean;
  onSave: (change: GradeChange) => Promise<unknown>;
}) {
  const [competencyId, setCompetencyId] = useState(sheet.competencies[0]?.id);
  const [extraColumns, setExtraColumns] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<unknown>(null);
  const competency = sheet.competencies.find((c) => c.id === competencyId);
  if (!competency)
    return (
      <p className="px-4 py-6 text-[0.9375rem] text-faint">
        El área no tiene competencias registradas.
      </p>
    );

  const used = Math.max(
    0,
    ...sheet.rows.flatMap((r) =>
      r.entries
        .filter((e) => e.competencyId === competency.id)
        .map((e) => e.columnNumber),
    ),
  );
  const columns = Math.min(
    MAX_COLUMNS,
    Math.max(MIN_COLUMNS, used) + (extraColumns[competency.id] ?? 0),
  );

  async function change(next: GradeChange) {
    const key = `${next.enrollmentId}:${next.columnNumber}`;
    setSaving(key);
    setError(null);
    try {
      await onSave(next);
    } catch (e) {
      setError(e);
    } finally {
      setSaving(null);
    }
  }

  return (
    <div>
      <div
        role="tablist"
        aria-label="Competencias"
        className="flex gap-1 overflow-x-auto border-b border-line px-3 py-2"
      >
        {sheet.competencies.map((c) => (
          <button
            key={c.id}
            role="tab"
            aria-selected={c.id === competency.id}
            title={c.name}
            onClick={() => setCompetencyId(c.id)}
            className={cx(
              'shrink-0 rounded px-2.5 py-1 text-[0.9375rem] font-medium',
              c.id === competency.id
                ? 'bg-ink text-white'
                : 'text-muted hover:bg-soft hover:text-ink',
            )}
          >
            {c.code}
          </button>
        ))}
      </div>
      <p className="px-4 pt-3 text-[0.9375rem] text-muted">{competency.name}</p>
      {error ? <ErrorNote error={error} /> : null}
      <div className="overflow-x-auto">
        <table className="w-full min-w-max text-[0.9375rem]">
          <thead>
            <tr className="text-left text-[0.875rem] text-faint">
              <th className="sticky left-0 bg-card px-4 py-2 font-medium md:w-full">
                Estudiante
              </th>
              {Array.from({ length: columns }, (_, i) => (
                <th key={i} className="px-1 py-2 text-center font-medium">
                  {i + 1}
                </th>
              ))}
              {editable && columns < MAX_COLUMNS && (
                <th className="px-1 py-2">
                  <Button
                    variant="ghost"
                    className="h-6 px-1.5"
                    aria-label="Agregar columna"
                    onClick={() =>
                      setExtraColumns((x) => ({
                        ...x,
                        [competency.id]: (x[competency.id] ?? 0) + 1,
                      }))
                    }
                  >
                    <Plus className="size-3.5" aria-hidden />
                  </Button>
                </th>
              )}
              <th className="px-3 py-2 text-center font-medium">Periodo</th>
              <th className="px-3 py-2 text-right font-medium">Asistencia</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {sheet.rows.map((row) => {
              const name = fullName(row.student);
              const final = row.periodGrades.find(
                (g) => g.competencyId === competency.id,
              );
              return (
                <tr key={row.enrollmentId}>
                  <td className="sticky left-0 bg-card px-4 py-1.5 font-medium whitespace-nowrap">
                    {name}
                  </td>
                  {Array.from({ length: columns }, (_, i) => {
                    const columnNumber = i + 1;
                    const value =
                      row.entries.find(
                        (e) =>
                          e.competencyId === competency.id &&
                          e.columnNumber === columnNumber,
                      )?.value ?? null;
                    const busy =
                      saving === `${row.enrollmentId}:${columnNumber}`;
                    return (
                      <td key={i} className="px-1 py-1.5 text-center">
                        {editable ? (
                          <select
                            aria-label={`${name}: columna ${columnNumber}`}
                            className={cx(
                              'h-7 w-12 rounded border border-line bg-card text-center font-sans tabular-nums text-[0.9375rem] focus:border-gob focus:outline-none',
                              busy && 'opacity-50',
                            )}
                            value={value ?? ''}
                            disabled={busy}
                            onChange={(e) =>
                              void change({
                                enrollmentId: row.enrollmentId,
                                competencyId: competency.id,
                                columnNumber,
                                value: (e.target.value ||
                                  null) as LiteralGrade | null,
                              })
                            }
                          >
                            <option value="">—</option>
                            {GRADES.map((g) => (
                              <option key={g} value={g}>
                                {g}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="font-sans tabular-nums">
                            {value ?? '—'}
                          </span>
                        )}
                      </td>
                    );
                  })}
                  {editable && columns < MAX_COLUMNS && <td />}
                  <td className="px-3 py-1.5 text-center">
                    {final?.value ? (
                      <Badge tone={GRADE_TONE[final.value]}>
                        {final.value}
                      </Badge>
                    ) : (
                      <span className="text-faint">—</span>
                    )}
                  </td>
                  <td className="px-3 py-1.5 text-right font-sans tabular-nums text-muted">
                    {final ? pct(final.attendanceRate, 0) : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="px-4 py-3 text-[0.875rem] text-faint">
        La nota del periodo la calcula SIAGIE con la regla provisional del
        proyecto: la calificación más frecuente y, si hay empate, la más
        reciente. Está pendiente validarla con la norma oficial.
      </p>
    </div>
  );
}
