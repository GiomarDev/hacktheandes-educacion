import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { AppModule as AuthModule } from '../../ms-auth/src/app.module.js';
import { loginAs, start } from '../../ms-escale/test/helpers.js';
import type { Started } from '../../ms-escale/test/helpers.js';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma.service.js';

describe('Documentos generados desde WhatsApp', () => {
  let auth: Started, simon: Started, prisma: PrismaService;
  let tokens: Record<string, string>;
  const schoolA = randomUUID(),
    schoolB = randomUUID();
  const ids = {
    teacher: randomUUID(),
    other: randomUUID(),
    director: randomUUID(),
    directorB: randomUUID(),
  };
  const oldJwks = process.env.AUTH_JWKS_URL;
  const key = { 'x-internal-key': process.env.INTERNAL_API_KEY! };
  const as = (who: string) => ({ Authorization: `Bearer ${tokens[who]}` });
  const createDoc = (extra = {}) =>
    request(simon.url)
      .post('/internal/documents')
      .set(key)
      .send({
        schoolId: schoolA,
        ownerUserId: ids.teacher,
        title: 'Sesión de aprendizaje: fracciones',
        category: 'Sesión de aprendizaje',
        format: 'WORD',
        ...extra,
      });

  beforeAll(async () => {
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
        directorB: {
          id: ids.directorB,
          claim: { role: 'DIRECTOR', schoolId: schoolB },
        },
      },
      '7400000',
    );
  }, 120000);
  beforeEach(() =>
    prisma.$executeRawUnsafe('TRUNCATE "simon_test"."generated_documents"'),
  );
  afterAll(async () => {
    await simon?.app.close();
    await auth?.app.close();
    if (oldJwks === undefined) delete process.env.AUTH_JWKS_URL;
    else process.env.AUTH_JWKS_URL = oldJwks;
  });

  it('el agente de WhatsApp registra documentos con la llave interna', async () => {
    await request(simon.url).post('/internal/documents').send({}).expect(401);
    const { body } = await createDoc().expect(201);
    expect(body).toMatchObject({
      status: 'PENDING',
      source: 'WHATSAPP',
      format: 'WORD',
      ownerUserId: ids.teacher,
    });
    await createDoc({ format: 'PDF' }).expect(400);
    await createDoc({ title: '' }).expect(400);
  });

  it('el docente ve sus documentos; dirección ve los de su IE', async () => {
    await createDoc();
    await createDoc({
      ownerUserId: ids.other,
      title: 'Registro auxiliar',
      format: 'EXCEL',
    });
    const titles = async (who: string, query = '') =>
      (
        await request(simon.url)
          .get(`/documents${query}`)
          .set(as(who))
          .expect(200)
      ).body.map((d: { title: string }) => d.title);
    expect(await titles('teacher')).toEqual([
      'Sesión de aprendizaje: fracciones',
    ]);
    expect((await titles('director')).sort()).toEqual([
      'Registro auxiliar',
      'Sesión de aprendizaje: fracciones',
    ]);
    expect(await titles('directorB')).toEqual([]);
    expect(await titles('teacher', '?status=APPROVED')).toEqual([]);
    await request(simon.url)
      .get('/documents?status=OTRO')
      .set(as('teacher'))
      .expect(400);
  });

  it('solo el docente dueño aprueba o rechaza', async () => {
    const { body: doc } = await createDoc().expect(201);
    const review = (who: string, status: string) =>
      request(simon.url)
        .post(`/documents/${doc.id}/review`)
        .set(as(who))
        .send({ status });
    await review('director', 'APPROVED').expect(403);
    await review('other', 'APPROVED').expect(403);
    await review('teacher', 'PENDING').expect(400);
    const { body } = await review('teacher', 'APPROVED').expect(200);
    expect(body).toMatchObject({
      status: 'APPROVED',
      reviewedAt: expect.any(String),
    });
    await review('teacher', 'REJECTED').expect(200);
  });

  it('un documento no aprobado registra la corrección que sube el docente', async () => {
    const { body: doc } = await createDoc().expect(201);
    const correction = (body: object, who = 'teacher') =>
      request(simon.url)
        .post(`/documents/${doc.id}/correction`)
        .set(as(who))
        .send(body);
    const file = {
      fileName: 'sesion-fracciones-corregida.docx',
      mimeType:
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      sizeBytes: 48213,
    };
    await correction(file).expect(409);
    await request(simon.url)
      .post(`/documents/${doc.id}/review`)
      .set(as('teacher'))
      .send({ status: 'REJECTED' })
      .expect(200);
    await correction({ ...file, fileName: 'virus.exe' }).expect(400);
    await correction({ ...file, sizeBytes: 21 * 1024 * 1024 }).expect(400);
    await correction(file, 'other').expect(403);
    const { body } = await correction(file).expect(200);
    expect(body).toMatchObject({
      status: 'REJECTED',
      correctionFileName: 'sesion-fracciones-corregida.docx',
      correctionSizeBytes: 48213,
      correctionUploadedAt: expect.any(String),
    });
  });
});
