import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { requireEnv } from '@app/common';

export interface SchoolRef {
  id: string;
  ugelId: string;
  dreId: string;
}

// Consulta a ms-siagie por su API interna. Devuelve null si el recurso no existe.
@Injectable()
export class SiagieClient {
  getSchool(id: string): Promise<SchoolRef | null> {
    return this.get(`/internal/schools/${id}`);
  }

  getUgel(id: string): Promise<{ id: string; dreId: string } | null> {
    return this.get(`/internal/ugels/${id}`);
  }

  getDre(id: string): Promise<{ id: string } | null> {
    return this.get(`/internal/dres/${id}`);
  }

  private async get<T>(path: string): Promise<T | null> {
    let res: Response;
    try {
      res = await fetch(`${requireEnv('SIAGIE_URL')}${path}`, {
        headers: { 'x-internal-key': requireEnv('INTERNAL_API_KEY') },
        signal: AbortSignal.timeout(3000),
      });
    } catch {
      throw new ServiceUnavailableException('ms-siagie no responde');
    }
    if (res.status === 404) return null;
    if (!res.ok) throw new ServiceUnavailableException(`ms-siagie respondió ${res.status}`);
    return (await res.json()) as T;
  }
}
