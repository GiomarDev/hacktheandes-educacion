import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { requireEnv } from '@app/common';
import type {
  AlertReportSnapshot,
  EscaleSchool,
  SchoolReportSnapshot,
} from '@app/common';

async function get<T>(base: string, path: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${requireEnv(base)}${path}`, {
      headers: { 'x-internal-key': requireEnv('INTERNAL_API_KEY') },
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    throw new ServiceUnavailableException(
      'Fuente de información no disponible',
    );
  }
  if (!response.ok)
    throw new ServiceUnavailableException(
      'Fuente de información no disponible',
    );
  return (await response.json()) as T;
}

@Injectable()
export class SourcesClient {
  schools(date: string) {
    return get<EscaleSchool[]>(
      'SIAGIE_URL',
      `/internal/escale/schools?${new URLSearchParams({ date })}`,
    );
  }
  schoolReport(schoolId: string, date: string) {
    const q = new URLSearchParams({
      schoolId,
      from: date,
      to: date,
      year: date.slice(0, 4),
    });
    return get<SchoolReportSnapshot>(
      'SIAGIE_URL',
      `/internal/simon/reports?${q}`,
    );
  }
  alerts(schoolId: string, date: string) {
    const q = new URLSearchParams({ schoolId, from: date, to: date });
    return get<AlertReportSnapshot>(
      'ALERTA_URL',
      `/internal/simon/reports?${q}`,
    );
  }
}
