import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { requireEnv } from '@app/common';
import type {
  ContactContext,
  RiskSection,
  RiskSchool,
  StaffRef,
} from '@app/common';

async function internalGet<T>(base: string, path: string): Promise<T> {
  try {
    const response = await fetch(`${requireEnv(base)}${path}`, {
      headers: { 'x-internal-key': requireEnv('INTERNAL_API_KEY') },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new Error('Respuesta interna no disponible');
    return (await response.json()) as T;
  } catch {
    throw new ServiceUnavailableException('Servicio de contexto no disponible');
  }
}

@Injectable()
export class SiagieClient {
  school(id: string) {
    return internalGet<Pick<RiskSchool, 'id' | 'ugelId' | 'dreId'>>(
      'SIAGIE_URL',
      `/internal/schools/${id}`,
    );
  }
  schoolIds(query: string) {
    return internalGet<{ id: string }[]>(
      'SIAGIE_URL',
      `/internal/schools?${query}`,
    );
  }
  sections(date: string, id?: string) {
    return internalGet<RiskSection[]>(
      'SIAGIE_URL',
      `/internal/risk/sections${id ? `/${id}` : ''}?date=${date}`,
    );
  }
  grade(id: string, date: string) {
    return internalGet<RiskSection[]>(
      'SIAGIE_URL',
      `/internal/risk/grades/${id}?date=${date}`,
    );
  }
  access(id: string) {
    return internalGet<{
      id: string;
      schoolId: string;
      studentId: string;
      type: 'ENTRY' | 'EXIT';
      occurredAt: string;
    }>('SIAGIE_URL', `/internal/risk/access/${id}`);
  }
  contact(studentId: string, schoolId: string) {
    return internalGet<ContactContext>(
      'SIAGIE_URL',
      `/internal/students/${studentId}/contact-context?schoolId=${schoolId}`,
    );
  }
}

@Injectable()
export class StaffClient {
  list(schoolId: string, ugelId: string) {
    return internalGet<StaffRef[]>(
      'AUTH_URL',
      `/internal/staff?schoolId=${schoolId}&ugelId=${ugelId}`,
    );
  }
}
