import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';

// FIXTURE LOCAL DE PRUEBA — no es Atomic Memory real.
// Imita en memoria las cuatro rutas documentadas de la API HTTP de Atomic Memory que usa
// ms-simon (ingest/quick, list, search/fast y delete), aislando por user_id como Cloud.
// Sirve para las pruebas e2e y la demo local; nunca debe presentarse como el servicio real.

interface StoredMemory {
  id: string;
  user_id: string;
  content: string;
  source_site: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface FixtureRequest {
  method: string;
  path: string;
  authorization: string | undefined;
  body: unknown;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

async function readJson(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  if (!chunks.length) return undefined;
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function send(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

export async function startAtomicMemoryFixture(options: {
  apiKey: string;
  port?: number;
  host?: string;
}) {
  const memories: StoredMemory[] = [];
  const requests: FixtureRequest[] = [];
  // Modos para probar un proveedor caído, lento o que responde mal.
  const state = {
    mode: 'ok' as
      | 'ok'
      | 'fail'
      | 'hang'
      | 'empty'
      | 'malformed'
      | 'ignoreFilters'
      | 'delete204'
      | 'deleteRejected'
      | 'deleteEmpty',
  };

  const server = createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://fixture');
    const body = await readJson(req).catch(() => undefined);
    requests.push({
      method: req.method ?? 'GET',
      path: url.pathname,
      authorization: req.headers.authorization,
      body,
    });
    if (state.mode === 'hang') return; // Nunca responde: el cliente debe cortar por timeout.
    if (state.mode === 'fail') return send(res, 503, { error: 'fixture down' });
    if (state.mode === 'empty') return res.writeHead(200).end();
    if (state.mode === 'malformed')
      return res
        .writeHead(200, { 'Content-Type': 'application/json' })
        .end('<html>ok</html>');
    if (req.headers.authorization !== `Bearer ${options.apiKey}`)
      return send(res, 401, { error: 'unauthorized' });

    if (req.method === 'POST' && url.pathname === '/v1/memories/ingest/quick') {
      if (
        !isRecord(body) ||
        typeof body.user_id !== 'string' ||
        typeof body.conversation !== 'string' ||
        typeof body.source_site !== 'string'
      )
        return send(res, 400, { error: 'user_id (string) is required' });
      const metadata = isRecord(body.metadata) ? body.metadata : {};
      const existing = memories.find(
        (m) =>
          m.user_id === body.user_id &&
          metadata.externalId !== undefined &&
          m.metadata.externalId === metadata.externalId,
      );
      if (existing) {
        existing.content = body.conversation;
        existing.metadata = metadata;
        return send(res, 200, {
          episode_id: randomUUID(),
          memories_stored: 0,
          memories_updated: 1,
          stored_memory_ids: [],
          updated_memory_ids: [existing.id],
        });
      }
      const memory: StoredMemory = {
        id: randomUUID(),
        user_id: body.user_id,
        content: body.conversation,
        source_site: body.source_site,
        metadata,
        created_at: new Date().toISOString(),
      };
      memories.push(memory);
      return send(res, 200, {
        episode_id: randomUUID(),
        memories_stored: 1,
        memories_updated: 0,
        stored_memory_ids: [memory.id],
        updated_memory_ids: [],
      });
    }

    if (req.method === 'GET' && url.pathname === '/v1/memories/list') {
      const user = url.searchParams.get('user_id');
      if (!user)
        return send(res, 400, { error: 'user_id (string) is required' });
      const site = url.searchParams.get('source_site');
      const found = memories.filter(
        (m) =>
          state.mode === 'ignoreFilters' ||
          (m.user_id === user && (!site || m.source_site === site)),
      );
      return send(res, 200, { memories: found, count: found.length });
    }

    if (req.method === 'POST' && url.pathname === '/v1/memories/search/fast') {
      if (!isRecord(body) || typeof body.user_id !== 'string')
        return send(res, 400, { error: 'user_id (string) is required' });
      const words = String(body.query ?? '')
        .toLowerCase()
        .split(/\W+/)
        .filter((w) => w.length > 3);
      const found = memories
        .filter(
          (m) =>
            state.mode === 'ignoreFilters' ||
            (m.user_id === body.user_id &&
              (!body.source_site || m.source_site === body.source_site)),
        )
        .map((m) => ({
          ...m,
          score: words.filter((w) => m.content.toLowerCase().includes(w))
            .length,
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, typeof body.limit === 'number' ? body.limit : 10);
      return send(res, 200, { count: found.length, memories: found });
    }

    const remove = /^\/v1\/memories\/([^/]+)$/.exec(url.pathname);
    if (req.method === 'DELETE' && remove) {
      const user = url.searchParams.get('user_id');
      const index = memories.findIndex(
        (m) => m.id === remove[1] && m.user_id === user,
      );
      if (index < 0) return send(res, 404, { error: 'Memory not found' });
      if (state.mode === 'deleteEmpty') return send(res, 200, {});
      if (state.mode === 'deleteRejected')
        return send(res, 200, { success: false });
      memories.splice(index, 1);
      if (state.mode === 'delete204') return res.writeHead(204).end();
      return send(res, 200, { success: true });
    }

    return send(res, 404, { error: 'not found' });
  });

  await new Promise<void>((resolve) =>
    server.listen(options.port ?? 0, options.host ?? '127.0.0.1', resolve),
  );
  return {
    url: `http://${options.host ?? '127.0.0.1'}:${(server.address() as AddressInfo).port}`,
    memories,
    requests,
    state,
    reset() {
      memories.length = 0;
      requests.length = 0;
      state.mode = 'ok';
    },
    close: () =>
      new Promise<void>((resolve) => {
        server.closeAllConnections();
        server.close(() => resolve());
      }),
  };
}
