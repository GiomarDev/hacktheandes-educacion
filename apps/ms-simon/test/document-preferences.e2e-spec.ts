import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { AppModule as AuthModule } from '../../ms-auth/src/app.module.js';
import { loginAs, start } from '../../ms-escale/test/helpers.js';
import type { Started } from '../../ms-escale/test/helpers.js';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma.service.js';
import { startAtomicMemoryFixture } from './atomic-memory-fixture.js';

// Atomic Memory se reemplaza por un FIXTURE HTTP LOCAL (atomic-memory-fixture.ts), no por el servicio real.
describe('Preferencias de documentos en Atomic Memory', () => {
  let auth: Started, simon: Started, prisma: PrismaService;
  let memory: Awaited<ReturnType<typeof startAtomicMemoryFixture>>;
  let tokens: Record<string, string>;
  const schoolA = randomUUID();
  const ids = {
    teacher: randomUUID(),
    other: randomUUID(),
    director: randomUUID(),
  };
  const fixtureKey = 'amc_fixture_local_only';
  const envKeys = [
    'AUTH_JWKS_URL',
    'ATOMICMEMORY_ENABLED',
    'ATOMICMEMORY_API_URL',
    'ATOMICMEMORY_API_KEY',
    'ATOMICMEMORY_TIMEOUT_MS',
  ] as const;
  const oldEnv = Object.fromEntries(envKeys.map((k) => [k, process.env[k]]));
  const key = { 'x-internal-key': process.env.INTERNAL_API_KEY! };
  const as = (who: string) => ({ Authorization: `Bearer ${tokens[who]}` });
  const enable = () => {
    process.env.ATOMICMEMORY_ENABLED = 'true';
    process.env.ATOMICMEMORY_API_URL = memory.url;
    process.env.ATOMICMEMORY_API_KEY = fixtureKey;
    process.env.ATOMICMEMORY_TIMEOUT_MS = '300';
  };
  const createDoc = async (
    owner = ids.teacher,
    category = 'Sesión de aprendizaje',
  ) =>
    (
      await request(simon.url)
        .post('/internal/documents')
        .set(key)
        .send({
          schoolId: schoolA,
          ownerUserId: owner,
          title: 'Sesión de aprendizaje: fracciones',
          category,
          format: 'WORD',
        })
        .expect(201)
    ).body as { id: string };
  const save = (docId: string, instruction: string, who = 'teacher') =>
    request(simon.url)
      .post(`/documents/${docId}/preference`)
      .set(as(who))
      .send({ instruction });
  const listOf = async (who: string) =>
    (
      await request(simon.url)
        .get('/documents/preferences')
        .set(as(who))
        .expect(200)
    ).body;

  beforeAll(async () => {
    memory = await startAtomicMemoryFixture({ apiKey: fixtureKey });
    auth = await start(AuthModule);
    process.env.AUTH_JWKS_URL = `${auth.url}/.well-known/jwks.json`;
    simon = await start(AppModule);
    prisma = simon.app.get(PrismaService);
    tokens = await loginAs(
      auth,
      {
        teacher: {
          id: ids.teacher,
          claim: { role: 'TEACHER', schoolId: schoolA },
        },
        other: { id: ids.other, claim: { role: 'TEACHER', schoolId: schoolA } },
        director: {
          id: ids.director,
          claim: { role: 'DIRECTOR', schoolId: schoolA },
        },
      },
      '7500000',
    );
  }, 120000);
  beforeEach(async () => {
    memory.reset();
    delete process.env.ATOMICMEMORY_ENABLED;
    delete process.env.ATOMICMEMORY_API_URL;
    delete process.env.ATOMICMEMORY_API_KEY;
    delete process.env.ATOMICMEMORY_TIMEOUT_MS;
    await prisma.$executeRawUnsafe(
      'TRUNCATE "simon_test"."generated_documents"',
    );
  });
  afterAll(async () => {
    await simon?.app.close();
    await auth?.app.close();
    await memory?.close();
    for (const k of envKeys) {
      if (oldEnv[k] === undefined) delete process.env[k];
      else process.env[k] = oldEnv[k];
    }
  });

  it('sin configuración la función queda apagada y no llama a Atomic Memory', async () => {
    const doc = await createDoc();
    expect(await listOf('teacher')).toEqual({ status: 'disabled' });
    await save(doc.id, 'Usa competencias del CNEB al inicio').expect(503);
    const { body } = await request(simon.url)
      .get(`/internal/documents/preferences?ownerUserId=${ids.teacher}`)
      .set(key)
      .expect(200);
    expect(body).toEqual({ status: 'disabled' });
    // La revisión del documento sigue funcionando igual.
    await request(simon.url)
      .post(`/documents/${doc.id}/review`)
      .set(as('teacher'))
      .send({ status: 'REJECTED' })
      .expect(200);
    expect(memory.requests).toEqual([]);
  });

  it('rechaza destinos inseguros o ambiguos sin enviar la llave', async () => {
    const doc = await createDoc();
    for (const url of [
      'http://example.com',
      'https://user:secret@example.com',
      `${memory.url}?redirect=elsewhere`,
      `${memory.url}#fragment`,
      `${memory.url}/unexpected`,
      'not-a-url',
    ]) {
      enable();
      process.env.ATOMICMEMORY_API_URL = url;
      expect(await listOf('teacher')).toEqual({ status: 'disabled' });
      await save(doc.id, 'Pon las competencias al inicio').expect(503);
    }
    expect(memory.requests).toEqual([]);
  });

  it('el docente guarda, corrige y borra lo que Amauti debe recordar; el agente lo recupera', async () => {
    enable();
    const doc = await createDoc();
    const { body: saved } = await save(
      doc.id,
      '  Pon las competencias del CNEB al inicio   y usa letra Arial 12.',
    ).expect(201);
    expect(saved).toMatchObject({
      id: expect.any(String),
      category: 'Sesión de aprendizaje',
      instruction:
        'Pon las competencias del CNEB al inicio y usa letra Arial 12.',
    });
    const ingest = memory.requests.find(
      (r) => r.path === '/v1/memories/ingest/quick',
    );
    expect(ingest).toMatchObject({
      authorization: `Bearer ${fixtureKey}`,
      body: {
        user_id: `amauti-docente:${ids.teacher}`,
        source_site: 'amauti-documentos',
        skip_extraction: true,
        content_class: 'summary',
        metadata: { externalId: 'amauti-doc-pref:sesion-de-aprendizaje' },
      },
    });
    // Ni hilo ni namespace: en Cloud el aislamiento lo da el sujeto (user_id).
    expect(ingest?.body).not.toHaveProperty('session_id');
    expect(ingest?.body).not.toHaveProperty('namespace_scope');

    expect(await listOf('teacher')).toMatchObject({
      status: 'available',
      preferences: [{ id: saved.id, category: 'Sesión de aprendizaje' }],
    });

    // Volver a guardar en el mismo tipo de documento corrige la preferencia, no la duplica.
    await save(doc.id, 'Solo competencias del CNEB al inicio.').expect(201);
    const after = await listOf('teacher');
    expect(after.preferences).toHaveLength(1);
    expect(after.preferences[0]).toMatchObject({
      id: saved.id,
      instruction: 'Solo competencias del CNEB al inicio.',
    });

    // El agente de WhatsApp la recupera antes de preparar el siguiente documento del docente.
    await request(simon.url)
      .get(`/internal/documents/preferences?ownerUserId=${ids.teacher}`)
      .expect(401);
    const { body: recalled } = await request(simon.url)
      .get(
        `/internal/documents/preferences?ownerUserId=${ids.teacher}&category=${encodeURIComponent('Sesión de aprendizaje')}&title=Multiplicación`,
      )
      .set(key)
      .expect(200);
    expect(recalled).toMatchObject({
      status: 'available',
      preferences: [{ instruction: 'Solo competencias del CNEB al inicio.' }],
    });
    expect(
      memory.requests.find((r) => r.path === '/v1/memories/search/fast')?.body,
    ).toMatchObject({ user_id: `amauti-docente:${ids.teacher}` });

    await request(simon.url)
      .delete(`/documents/preferences/${saved.id}`)
      .set(as('teacher'))
      .expect(204);
    expect(await listOf('teacher')).toEqual({
      status: 'available',
      preferences: [],
    });
    expect(memory.memories).toHaveLength(0);
  });

  it('nadie ve, guarda ni borra la memoria de otro docente', async () => {
    enable();
    const doc = await createDoc();
    const { body: saved } = await save(
      doc.id,
      'Usa tablas para las rúbricas',
    ).expect(201);
    await save(doc.id, 'Otra cosa', 'other').expect(403);
    await save(doc.id, 'Otra cosa', 'director').expect(403);
    // El cliente no puede elegir el sujeto de memoria.
    await request(simon.url)
      .post(`/documents/${doc.id}/preference`)
      .set(as('teacher'))
      .send({ instruction: 'Algo', userId: ids.other })
      .expect(400);
    expect(await listOf('other')).toEqual({
      status: 'available',
      preferences: [],
    });
    expect(await listOf('director')).toEqual({
      status: 'available',
      preferences: [],
    });
    await request(simon.url)
      .delete(`/documents/preferences/${saved.id}`)
      .set(as('other'))
      .expect(404);
    expect(memory.memories).toHaveLength(1);
    const { body } = await request(simon.url)
      .get(`/internal/documents/preferences?ownerUserId=${ids.other}`)
      .set(key)
      .expect(200);
    expect(body).toEqual({ status: 'available', preferences: [] });
  });

  it('rechaza DNI o teléfonos sin enviarlos a Atomic Memory', async () => {
    enable();
    const doc = await createDoc();
    await save(doc.id, 'Agrega al alumno con DNI 71234567').expect(400);
    await save(doc.id, 'Llamar al 987 654 321').expect(400);
    expect(memory.requests).toEqual([]);
  });

  it('si Atomic Memory falla o no responde, avisa que no se pudo confirmar y los documentos siguen', async () => {
    enable();
    const doc = await createDoc();
    memory.state.mode = 'fail';
    const failed = await save(doc.id, 'Usa letra Arial 12').expect(503);
    expect(failed.body.message).toMatch(/No pudimos confirmar/);
    expect(await listOf('teacher')).toEqual({ status: 'unavailable' });

    memory.state.mode = 'hang';
    const startedAt = Date.now();
    await save(doc.id, 'Usa letra Arial 12').expect(503);
    expect(Date.now() - startedAt).toBeLessThan(3000);
    const { body: recalled } = await request(simon.url)
      .get(`/internal/documents/preferences?ownerUserId=${ids.teacher}`)
      .set(key)
      .expect(200);
    expect(recalled).toEqual({ status: 'unavailable' });

    await request(simon.url).get('/documents').set(as('teacher')).expect(200);
    await request(simon.url)
      .post(`/documents/${doc.id}/review`)
      .set(as('teacher'))
      .send({ status: 'APPROVED' })
      .expect(200);
  });

  it('un 2xx vacío o que no es JSON nunca cuenta como guardado', async () => {
    enable();
    const doc = await createDoc();
    for (const mode of ['empty', 'malformed'] as const) {
      memory.state.mode = mode;
      const { body } = await save(doc.id, 'Usa letra Arial 12').expect(503);
      expect(body.message).toMatch(/No pudimos confirmar/);
      expect(await listOf('teacher')).toEqual({ status: 'unavailable' });
    }
  });

  it('descarta registros de otro docente u otra fuente aunque el proveedor ignore los filtros', async () => {
    enable();
    const doc = await createDoc();
    const otherDoc = await createDoc(ids.other);
    await save(doc.id, 'Usa tablas para las rúbricas').expect(201);
    await save(otherDoc.id, 'Recordatorio del otro docente', 'other').expect(
      201,
    );
    memory.memories.push({
      id: randomUUID(),
      user_id: `amauti-docente:${ids.teacher}`,
      content:
        'Preferencia del docente para documentos de tipo "Acta" preparados por Amauti: de otra app',
      source_site: 'otra-app',
      metadata: { category: 'Acta', instruction: 'de otra app' },
      created_at: new Date().toISOString(),
    });
    memory.state.mode = 'ignoreFilters';
    const listed = await listOf('teacher');
    expect(
      listed.preferences.map((p: { instruction: string }) => p.instruction),
    ).toEqual(['Usa tablas para las rúbricas']);
    const { body: recalled } = await request(simon.url)
      .get(`/internal/documents/preferences?ownerUserId=${ids.teacher}`)
      .set(key)
      .expect(200);
    expect(
      recalled.preferences.map((p: { instruction: string }) => p.instruction),
    ).toEqual(['Usa tablas para las rúbricas']);
  });

  it('el borrado acepta 204 sin cuerpo y no confirma un rechazo explícito', async () => {
    enable();
    const doc = await createDoc();
    const { body: first } = await save(doc.id, 'Usa letra Arial 12').expect(
      201,
    );
    memory.state.mode = 'deleteRejected';
    const rejected = await request(simon.url)
      .delete(`/documents/preferences/${first.id}`)
      .set(as('teacher'))
      .expect(503);
    expect(rejected.body.message).toMatch(/No pudimos confirmar/);
    memory.state.mode = 'deleteEmpty';
    const empty = await request(simon.url)
      .delete(`/documents/preferences/${first.id}`)
      .set(as('teacher'))
      .expect(503);
    expect(empty.body.message).toMatch(/No pudimos confirmar/);
    memory.state.mode = 'delete204';
    await request(simon.url)
      .delete(`/documents/preferences/${first.id}`)
      .set(as('teacher'))
      .expect(204);
    expect(memory.memories).toHaveLength(0);
  });
});
