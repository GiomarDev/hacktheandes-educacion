import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Upload } from 'lucide-react';
import { apiFetch } from '../api/client';
import { formatDate, int } from '../lib/format';
import {
  Badge,
  Card,
  CardHeader,
  Empty,
  ErrorNote,
  Field,
  inputClass,
  Loading,
  PageHeader,
} from '../ui/kit';

interface DatasetImport {
  id: string;
  dataset: string;
  name: string;
  fileName: string;
  checksum: string;
  rowCount: number;
  importedAt: string;
}
const DATASETS = {
  DROPOUT_BY_REGION_SIAGIE: 'Deserción por región (SIAGIE)',
  DROPOUT_RATE_SECONDARY_ESCALE: 'Tasa de deserción secundaria (ESCALE)',
};

export function FuentesPage() {
  const client = useQueryClient();
  const imports = useQuery({
    queryKey: ['imports'],
    queryFn: () => apiFetch<DatasetImport[]>('escale', '/imports'),
  });
  const [dataset, setDataset] = useState<keyof typeof DATASETS>(
    'DROPOUT_BY_REGION_SIAGIE',
  );
  const [period, setPeriod] = useState('');
  const upload = useMutation({
    mutationFn: (file: { name: string; content: string }) =>
      apiFetch<{ values: number }>('escale', '/imports', {
        method: 'POST',
        body: {
          dataset,
          fileName: file.name,
          content: file.content,
          ...(period ? { period } : {}),
        },
      }),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['imports'] });
      void client.invalidateQueries({ queryKey: ['indicators'] });
    },
  });

  async function pick(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) upload.mutate({ name: file.name, content: await file.text() });
  }

  return (
    <>
      <PageHeader
        title="Fuentes de datos"
        subtitle="Datos abiertos oficiales que alimentan los indicadores de ESCALE"
      />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card>
          <CardHeader
            title="Importaciones"
            subtitle="Cada archivo se importa una sola vez (sha256)"
          />
          {imports.isPending ? (
            <Loading />
          ) : imports.error ? (
            <ErrorNote error={imports.error} />
          ) : !imports.data.length ? (
            <Empty title="Sin importaciones" />
          ) : (
            <ul className="divide-y divide-line">
              {imports.data.map((i) => (
                <li key={i.id} className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{i.fileName}</span>
                    <Badge tone="gob">
                      {DATASETS[i.dataset as keyof typeof DATASETS] ??
                        i.dataset}
                    </Badge>
                  </div>
                  <div className="mt-0.5 text-[0.9375rem] text-faint">
                    {int(i.rowCount)} filas · {formatDate(i.importedAt, true)} ·{' '}
                    <span className="font-sans tabular-nums">
                      {i.checksum.slice(0, 12)}…
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <CardHeader
            title="Importar CSV"
            subtitle="Formato de los archivos de docs/"
          />
          <div className="space-y-3 px-4 py-3">
            <Field label="Conjunto de datos">
              <select
                className={inputClass}
                value={dataset}
                onChange={(e) =>
                  setDataset(e.target.value as keyof typeof DATASETS)
                }
              >
                {Object.entries(DATASETS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </Field>
            {dataset === 'DROPOUT_BY_REGION_SIAGIE' && (
              <Field
                label="Periodo"
                hint="Opcional si el nombre del archivo lo trae (…_2023_2024.csv)."
              >
                <input
                  className={inputClass}
                  placeholder="2023-2024"
                  pattern="\d{4}-\d{4}"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                />
              </Field>
            )}
            <label className="flex h-9 cursor-pointer items-center justify-center gap-2 rounded bg-ink px-3 text-[0.9375rem] font-medium text-white hover:bg-ink-2">
              <Upload className="size-4" aria-hidden />{' '}
              {upload.isPending ? 'Importando…' : 'Elegir archivo CSV'}
              <input
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                onChange={(e) => void pick(e)}
              />
            </label>
            {upload.error ? <ErrorNote error={upload.error} /> : null}
            {upload.data && (
              <p role="status" className="text-[0.9375rem] text-stable">
                Importado: {upload.data.values} valores.
              </p>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
