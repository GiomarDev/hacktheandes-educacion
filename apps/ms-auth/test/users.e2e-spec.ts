import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma.service.js';
import { SiagieClient } from '../src/siagie/siagie.client.js';
import { cleanAuthTables, createTestUser, TEST_PASSWORD } from './helpers/app.js';

const SCHOOL_A = '019a0000-0000-7000-8000-00000000000a';
const SCHOOL_B = '019a0000-0000-7000-8000-00000000000b';
const MISSING = '019a0000-0000-7000-8000-00000000ffff';

// ms-siagie simulado: dos IEs en la misma UGEL.
const fakeSiagie = {
  getSchool: async (id: string) =>
    [SCHOOL_A, SCHOOL_B].includes(id) ? { id, ugelId: 'ugel-1', dreId: 'dre-1' } : null,
  getUgel: async (id: string) => (id === 'ugel-1' ? { id, dreId: 'dre-1' } : null),
  getDre: async (id: string) => (id === 'dre-1' ? { id } : null),
};

describe('alta de usuarios y roles', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let directorToken: string;
  const http = () => request(app.getHttpServer());
  const newTeacher = (documentNumber = '71111111') => ({
    documentType: 'DNI',
    documentNumber,
    firstName: 'Carla',
    lastName: 'Docente',
    temporaryPassword: 'Temporal-2026',
  });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(SiagieClient)
      .useValue(fakeSiagie)
      .compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await cleanAuthTables(prisma);
    const director = await createTestUser(prisma);
    await prisma.userRole.updateMany({ where: { userId: director.id }, data: { schoolId: SCHOOL_A } });
    directorToken = (await http().post('/auth/login').send({ documentNumber: '70000001', password: TEST_PASSWORD })).body.accessToken;
  });

  const asDirector = (req: request.Test) => req.set('Authorization', `Bearer ${directorToken}`);

  it('el director crea un docente y le da TEACHER en su IE', async () => {
    const { body } = await asDirector(http().post('/users')).send(newTeacher()).expect(201);
    const user = await prisma.user.findUniqueOrThrow({ where: { id: body.id } });
    expect(user.mustChangePassword).toBe(true);
    await asDirector(http().post(`/users/${body.id}/roles`)).send({ role: 'TEACHER', schoolId: SCHOOL_A }).expect(201);
    const login = await http().post('/auth/login').send({ documentNumber: '71111111', password: 'Temporal-2026' }).expect(200);
    expect(login.body.mustChangePassword).toBe(true);
  });

  it('el director no puede otorgar DIRECTOR', async () => {
    const { body } = await asDirector(http().post('/users')).send(newTeacher()).expect(201);
    await asDirector(http().post(`/users/${body.id}/roles`)).send({ role: 'DIRECTOR', schoolId: SCHOOL_A }).expect(403);
  });

  it('el director no puede otorgar roles en otra IE', async () => {
    const { body } = await asDirector(http().post('/users')).send(newTeacher()).expect(201);
    await asDirector(http().post(`/users/${body.id}/roles`)).send({ role: 'TEACHER', schoolId: SCHOOL_B }).expect(403);
  });

  it('IE inexistente: 422', async () => {
    const { body } = await asDirector(http().post('/users')).send(newTeacher()).expect(201);
    await asDirector(http().post(`/users/${body.id}/roles`)).send({ role: 'TEACHER', schoolId: MISSING }).expect(422);
  });

  it('rol de IE sin schoolId: 400', async () => {
    const { body } = await asDirector(http().post('/users')).send(newTeacher()).expect(201);
    await asDirector(http().post(`/users/${body.id}/roles`)).send({ role: 'TEACHER' }).expect(400);
  });

  it('nadie se otorga roles a sí mismo', async () => {
    const me = await prisma.user.findFirstOrThrow({ where: { documentNumber: '70000001' } });
    await asDirector(http().post(`/users/${me.id}/roles`)).send({ role: 'SECRETARY', schoolId: SCHOOL_A }).expect(403);
  });

  it('documento duplicado: 409', async () => {
    await asDirector(http().post('/users')).send(newTeacher()).expect(201);
    await asDirector(http().post('/users')).send(newTeacher()).expect(409);
  });

  it('desactiva un rol', async () => {
    const { body } = await asDirector(http().post('/users')).send(newTeacher()).expect(201);
    const role = await asDirector(http().post(`/users/${body.id}/roles`)).send({ role: 'TEACHER', schoolId: SCHOOL_A }).expect(201);
    await asDirector(http().delete(`/users/${body.id}/roles/${role.body.id}`)).expect(204);
    const stored = await prisma.userRole.findUniqueOrThrow({ where: { id: role.body.id } });
    expect(stored.isActive).toBe(false);
  });
});
