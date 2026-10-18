import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { requireEnv } from '@app/common';
import type {
  AlertReportSnapshot,
  PeriodRef,
  PlanStudentContext,
  SchoolReportSnapshot,
  SectionRef,
  SchoolScope,
} from '@app/common';

async function get<T>(base: string, path: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${requireEnv(base)}${path}`, {
      headers: { 'x-internal-key': requireEnv('INTERNAL_API_KEY') },
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    throw new ServiceUnavailableException(
      'Fuente de información no disponible',
    );
  }
  if (response.status === 404)
    throw new NotFoundException('Referencia no encontrada en la fuente');
  if (response.status === 400)
    throw new BadRequestException('Consulta incompatible con la fuente');
  if (!response.ok)
    throw new ServiceUnavailableException(
      'Fuente de información no disponible',
    );
  try {
    return (await response.json()) as T;
  } catch {
    throw new ServiceUnavailableException('Respuesta de la fuente no válida');
  }
}
@Injectable()
export class SourcesClient {
  school(id: string) {
    return get<SchoolScope>('SIAGIE_URL', `/internal/schools/${id}`);
  }
  schoolIds(query: string) {
    return get<{ id: string }[]>('SIAGIE_URL', `/internal/schools?${query}`);
  }
  student(id: string, schoolId: string, year: number) {
    return get<PlanStudentContext>(
      'SIAGIE_URL',
      `/internal/simon/students/${id}?schoolId=${schoolId}&year=${year}`,
    );
  }
  period(id: string) {
    return get<PeriodRef>('SIAGIE_URL', `/internal/simon/periods/${id}`);
  }
  section(id: string) {
    return get<SectionRef>('SIAGIE_URL', `/internal/simon/sections/${id}`);
  }
  schoolReport(query: URLSearchParams) {
    return get<SchoolReportSnapshot>(
      'SIAGIE_URL',
      `/internal/simon/reports?${query}`,
    );
  }
  alerts(query: URLSearchParams) {
    return get<AlertReportSnapshot>(
      'ALERTA_URL',
      `/internal/simon/reports?${query}`,
    );
  }
}
