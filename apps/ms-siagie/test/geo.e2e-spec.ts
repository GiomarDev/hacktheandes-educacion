import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma.service.js';
import { createSiagieApp } from './helpers/app.js';
import { cleanSiagieTables } from './helpers/db.js';
import { bearer, signTestToken } from './helpers/tokens.js';

const admin = signTestToken({ roles: [{ role: 'MINEDU_ADMIN' }] });

const schoolBody = (ugelId: string, modularCode: string) => ({
  modularCode,
  name: `IE ${modularCode}`,
  level: 'SECONDARY',
  management: 'PUBLIC',
  area: 'URBAN',
  ugelId,
  ubigeo: '250101',
  department: 'Ucayali',
  province: 'Coronel Portillo',
  district: 'Callería',
  attentionGoal: 70,
  hasPsychologist: false,
  directorHasTeachingLoad: true,
});

describe('DRE, UGEL e IE', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const http = () => request(app.getHttpServer());
  let ugelId: string;
  let otherUgelId: string;
  let schoolA: string;
  let schoolB: string;

  beforeAll(async () => {
    ({ app, prisma } = await createSiagieApp());
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await cleanSiagieTables(prisma);
    const dre = await http().post('/dres').set(bearer(admin)).send({ code: 'DRE25', name: 'DRE Ucayali', department: 'Ucayali' }).expect(201);
    ugelId = (await http().post('/ugels').set(bearer(admin)).send({ code: 'UGEL2501', name: 'UGEL Coronel Portillo', dreId: dre.body.id }).expect(201)).body.id;
    otherUgelId = (await http().post('/ugels').set(bearer(admin)).send({ code: 'UGEL2502', name: 'UGEL Atalaya', dreId: dre.body.id }).expect(201)).body.id;
    schoolA = (await http().post('/schools').set(bearer(admin)).send(schoolBody(ugelId, '9999901')).expect(201)).body.id;
    schoolB = (await http().post('/schools').set(bearer(admin)).send(schoolBody(otherUgelId, '9999902')).expect(201)).body.id;
  });

  it('un especialista UGEL crea IEs solo en su UGEL', async () => {
    const specialist = signTestToken({ roles: [{ role: 'UGEL_SPECIALIST', ugelId }] });
    await http().post('/schools').set(bearer(specialist)).send(schoolBody(ugelId, '9999903')).expect(201);
    await http().post('/schools').set(bearer(specialist)).send(schoolBody(otherUgelId, '9999904')).expect(403);
  });

  it('un director no crea DREs', async () => {
    const director = signTestToken({ roles: [{ role: 'DIRECTOR', schoolId: schoolA }] });
    await http().post('/dres').set(bearer(director)).send({ code: 'X', name: 'X', department: 'X' }).expect(403);
  });

  it('un director solo ve su IE', async () => {
    const director = signTestToken({ roles: [{ role: 'DIRECTOR', schoolId: schoolA }] });
    await http().get(`/schools/${schoolA}`).set(bearer(director)).expect(200);
    await http().get(`/schools/${schoolB}`).set(bearer(director)).expect(403);
    const list = await http().get('/schools').set(bearer(director)).expect(200);
    expect(list.body.map((s: { id: string }) => s.id)).toEqual([schoolA]);
  });

  it('un especialista UGEL lista solo las IEs de su UGEL', async () => {
    const specialist = signTestToken({ roles: [{ role: 'UGEL_SPECIALIST', ugelId }] });
    const list = await http().get('/schools').set(bearer(specialist)).expect(200);
    expect(list.body.map((s: { id: string }) => s.id)).toEqual([schoolA]);
  });

  it('una IE inexistente responde 404', async () => {
    await http().get('/schools/019a0000-0000-7000-8000-00000000ffff').set(bearer(admin)).expect(404);
  });

  it('código modular duplicado: 409', async () => {
    await http().post('/schools').set(bearer(admin)).send(schoolBody(ugelId, '9999901')).expect(409);
  });

  describe('API interna', () => {
    const key = () => ({ 'x-internal-key': process.env.INTERNAL_API_KEY! });

    it('sin la llave interna: 401', async () => {
      await http().get(`/internal/schools/${schoolA}`).expect(401);
      await http().get(`/internal/schools/${schoolA}`).set({ 'x-internal-key': 'otra' }).expect(401);
    });

    it('devuelve la IE con su UGEL y DRE', async () => {
      const res = await http().get(`/internal/schools/${schoolA}`).set(key()).expect(200);
      const dre = await prisma.dre.findFirstOrThrow();
      expect(res.body).toEqual({ id: schoolA, ugelId, dreId: dre.id });
      await http().get(`/internal/ugels/${ugelId}`).set(key()).expect(200, { id: ugelId, dreId: dre.id });
      await http().get(`/internal/dres/${dre.id}`).set(key()).expect(200, { id: dre.id });
    });

    it('404 si no existe', async () => {
      await http().get('/internal/schools/019a0000-0000-7000-8000-00000000ffff').set(key()).expect(404);
    });
  });
});
