import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { IsString, Length } from 'class-validator';

// Recordatorios de revisión que el docente guarda para sus próximos documentos de un tipo.
// Se guardan en Atomic Memory (opcional, desactivado por defecto) con el ID del
// docente tomado del JWT; nunca de un campo enviado por el cliente.
const SOURCE_SITE = 'amauti-documentos';
const DEFAULT_TIMEOUT_MS = 2500;
const LIST_LIMIT = 50;

export class SavePreferenceDto {
  @IsString() @Length(3, 280) instruction: string;
}

export interface DocumentPreference {
  id: string;
  category: string;
  instruction: string;
  savedAt: string | null;
}

export type PreferencesResult =
  | { status: 'disabled' }
  | { status: 'unavailable' }
  | { status: 'available'; preferences: DocumentPreference[] };

interface MemoryConfig {
  apiUrl: string;
  apiKey: string;
  timeoutMs: number;
}

class MemoryUnavailable extends Error {}
class MemoryNotFound extends Error {}

// Lee la configuración en cada uso: sin ATOMICMEMORY_ENABLED=true la función queda apagada.
function memoryConfig(): MemoryConfig | null {
  if (process.env.ATOMICMEMORY_ENABLED !== 'true') return null;
  const apiUrl = process.env.ATOMICMEMORY_API_URL?.replace(/\/+$/, '');
  const apiKey = process.env.ATOMICMEMORY_API_KEY;
  if (!apiUrl || !apiKey) return null;
  const timeout = Number(process.env.ATOMICMEMORY_TIMEOUT_MS);
  return {
    apiUrl,
    apiKey,
    timeoutMs:
      Number.isInteger(timeout) && timeout > 0 ? timeout : DEFAULT_TIMEOUT_MS,
  };
}

// Sujeto de memoria por docente. En Cloud, user_id identifica al sujeto; no se envía
// session_id (en Cloud reemplazaría al sujeto) ni namespace (solo filtra búsquedas).
export const memorySubject = (userId: string) => `amauti-docente:${userId}`;

export const categoryOf = (category: string | null) =>
  category?.trim() || 'Documento';

const externalIdOf = (category: string) =>
  `amauti-doc-pref:${category
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')}`;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const contentOf = (category: string, instruction: string) =>
  `Preferencia del docente para documentos de tipo "${category}" preparados por Amauti: ${instruction}`;
const CONTENT =
  /^Preferencia del docente para documentos de tipo "(.+?)" preparados por Amauti: (.+)$/s;

// Convierte un registro de Atomic Memory en preferencia; descarta lo que no sea nuestro aunque
// el proveedor ignore algún filtro: otro sujeto, otro source_site o un texto con otro formato.
// Usa la metadata si viene; si no (algunas búsquedas no la devuelven), el texto guardado.
function toPreference(
  raw: unknown,
  subject: string,
  requireSource: boolean,
): DocumentPreference | null {
  if (!isRecord(raw) || typeof raw.id !== 'string' || !raw.id) return null;
  if (raw.user_id !== undefined && raw.user_id !== subject) return null;
  if (
    (requireSource || raw.source_site !== undefined) &&
    raw.source_site !== SOURCE_SITE
  )
    return null;
  const metadata = isRecord(raw.metadata) ? raw.metadata : {};
  const parsed =
    typeof raw.content === 'string' ? CONTENT.exec(raw.content) : null;
  const category =
    typeof metadata.category === 'string' ? metadata.category : parsed?.[1];
  const instruction =
    typeof metadata.instruction === 'string'
      ? metadata.instruction
      : parsed?.[2];
  if (!category || !instruction) return null;
  return {
    id: raw.id,
    category,
    instruction,
    savedAt: typeof raw.created_at === 'string' ? raw.created_at : null,
  };
}

function memoriesOf(body: unknown): unknown[] {
  if (!isRecord(body) || !Array.isArray(body.memories))
    throw new MemoryUnavailable('Respuesta de Atomic Memory no válida');
  return body.memories;
}

@Injectable()
export class DocumentPreferencesService {
  private readonly logger = new Logger(DocumentPreferencesService.name);

  private async call(
    config: MemoryConfig,
    path: string,
    init: { method: 'GET' | 'POST' | 'DELETE'; body?: unknown },
  ): Promise<unknown> {
    let response: Response;
    try {
      response = await fetch(`${config.apiUrl}${path}`, {
        method: init.method,
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          ...(init.body === undefined
            ? {}
            : { 'Content-Type': 'application/json' }),
        },
        body: init.body === undefined ? undefined : JSON.stringify(init.body),
        signal: AbortSignal.timeout(config.timeoutMs),
        redirect: 'error',
      });
    } catch (error) {
      // Solo el tipo de error: nunca el texto del docente ni la llave.
      this.logger.warn(
        `Atomic Memory sin respuesta (${init.method} ${path.split('?')[0]}): ${error instanceof Error ? error.name : 'error'}`,
      );
      throw new MemoryUnavailable('Atomic Memory no respondió');
    }
    if (response.status === 404) throw new MemoryNotFound();
    if (!response.ok) {
      this.logger.warn(
        `Atomic Memory respondió ${response.status} (${init.method} ${path.split('?')[0]})`,
      );
      throw new MemoryUnavailable(`Atomic Memory respondió ${response.status}`);
    }
    // Un 204 o un cuerpo vacío son éxito sin datos (por ejemplo, al borrar); cada operación
    // decide si eso le basta. Un cuerpo que no es JSON nunca cuenta como confirmación.
    let text: string;
    try {
      text = await response.text();
    } catch {
      throw new MemoryUnavailable('Respuesta de Atomic Memory no válida');
    }
    if (response.status === 204) return { success: true };
    if (!text.trim()) return null;
    try {
      return JSON.parse(text);
    } catch {
      throw new MemoryUnavailable('Respuesta de Atomic Memory no válida');
    }
  }

  private async fetchAll(
    config: MemoryConfig,
    userId: string,
  ): Promise<DocumentPreference[]> {
    const query = new URLSearchParams({
      user_id: memorySubject(userId),
      source_site: SOURCE_SITE,
      limit: String(LIST_LIMIT),
    });
    const body = await this.call(config, `/v1/memories/list?${query}`, {
      method: 'GET',
    });
    const subject = memorySubject(userId);
    return memoriesOf(body).flatMap(
      (m) => toPreference(m, subject, true) ?? [],
    );
  }

  // Las preferencias del propio docente para la página Documentos.
  async list(userId: string): Promise<PreferencesResult> {
    const config = memoryConfig();
    if (!config) return { status: 'disabled' };
    try {
      return {
        status: 'available',
        preferences: await this.fetchAll(config, userId),
      };
    } catch {
      return { status: 'unavailable' };
    }
  }

  // Una preferencia por tipo de documento: volver a guardarla la corrige (metadata.externalId).
  async save(
    userId: string,
    category: string,
    instruction: string,
  ): Promise<DocumentPreference> {
    const config = memoryConfig();
    if (!config)
      throw new ServiceUnavailableException(
        'La memoria de preferencias no está activada',
      );
    const text = instruction.trim().replace(/\s+/g, ' ');
    if (text.length < 3)
      throw new BadRequestException('Escribe el recordatorio');
    // Las preferencias son del docente, no de sus estudiantes: se rechazan DNI y teléfonos.
    if (/\d{8,}/.test(text.replace(/[\s.-]/g, '')))
      throw new BadRequestException(
        'No incluyas DNI, teléfonos ni datos de estudiantes en la preferencia',
      );
    const metadata = {
      externalId: externalIdOf(category),
      category,
      instruction: text,
    };
    let body: unknown;
    try {
      body = await this.call(config, '/v1/memories/ingest/quick', {
        method: 'POST',
        body: {
          user_id: memorySubject(userId),
          conversation: contentOf(category, text),
          source_site: SOURCE_SITE,
          skip_extraction: true,
          content_class: 'summary',
          metadata,
        },
      });
    } catch {
      throw new ServiceUnavailableException(
        'Atomic Memory no está disponible: la preferencia no se guardó',
      );
    }
    // Solo cuenta como guardado si el recibo trae el ID creado o actualizado.
    const idsOf = (field: string) =>
      isRecord(body) && Array.isArray(body[field]) ? body[field] : [];
    const ids: unknown[] = [
      ...idsOf('stored_memory_ids'),
      ...idsOf('updated_memory_ids'),
    ];
    const id = ids.find(
      (value): value is string => typeof value === 'string' && value !== '',
    );
    if (!id)
      throw new ServiceUnavailableException(
        'Atomic Memory no confirmó el guardado: la preferencia no se guardó',
      );
    return { id, category, instruction: text, savedAt: null };
  }

  async remove(userId: string, id: string): Promise<void> {
    const config = memoryConfig();
    if (!config)
      throw new ServiceUnavailableException(
        'La memoria de preferencias no está activada',
      );
    let owned: DocumentPreference[];
    try {
      owned = await this.fetchAll(config, userId);
    } catch {
      throw new ServiceUnavailableException(
        'Atomic Memory no está disponible: la preferencia no se borró',
      );
    }
    // Solo se borra lo que aparece en la memoria del propio docente.
    if (!owned.some((p) => p.id === id))
      throw new NotFoundException('Preferencia no encontrada');
    const query = new URLSearchParams({ user_id: memorySubject(userId) });
    let body: unknown;
    try {
      body = await this.call(
        config,
        `/v1/memories/${encodeURIComponent(id)}?${query}`,
        { method: 'DELETE' },
      );
    } catch (error) {
      if (error instanceof MemoryNotFound)
        throw new NotFoundException('Preferencia no encontrada');
      throw new ServiceUnavailableException(
        'Atomic Memory no está disponible: la preferencia no se borró',
      );
    }
    // Solo un recibo afirmativo o el 204 documentado confirma el borrado.
    if (!isRecord(body) || body.success !== true)
      throw new ServiceUnavailableException(
        'Atomic Memory no confirmó el borrado: la preferencia no se borró',
      );
  }

  // Gancho opcional para un agente externo (el de WhatsApp no vive en este repo y aún no lo
  // consume): búsqueda semántica en la memoria del docente dueño. Si falla, responde unavailable.
  async recall(
    userId: string,
    category: string,
    title?: string,
  ): Promise<PreferencesResult> {
    const config = memoryConfig();
    if (!config) return { status: 'disabled' };
    try {
      const body = await this.call(config, '/v1/memories/search/fast', {
        method: 'POST',
        body: {
          user_id: memorySubject(userId),
          query: `Preferencias del docente para documentos de tipo "${category}"${title ? `: ${title}` : ''}`,
          source_site: SOURCE_SITE,
          limit: 5,
        },
      });
      return {
        status: 'available',
        preferences: memoriesOf(body).flatMap(
          (m) => toPreference(m, memorySubject(userId), false) ?? [],
        ),
      };
    } catch {
      return { status: 'unavailable' };
    }
  }
}
