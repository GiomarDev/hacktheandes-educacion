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
const UGEL_1 = '019a0000-0000-7000-8000-0000000000c1';
const UGEL_2 = '019a0000-0000-7000-8000-0000000000c2';
const DRE_1 = '019a0000-0000-7000-8000-0000000000b1';

// ms-siagie simulado: dos IEs en la misma UGEL.
const fakeSiagie = {
  getSchool: async (id: string) =>
    [SCHOOL_A, SCHOOL_B].includes(id) ? { id, ugelId: UGEL_1, dreId: DRE_1 } : null,
  getUgel: async (id: string) => ([UGEL_1, UGEL_2].includes(id) ? { id, dreId: DRE_1 } : null),
  getDre: async (id: string) => (id === DRE_1 ? { id } : null),
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

  describe('GET /users', () => {
    const person = async (documentNumber: string, roles: { role: string; schoolId?: string; ugelId?: string; isActive?: boolean }[]) =>
      prisma.user.create({
        data: {
          documentType: 'DNI',
          documentNumber,
          firstName: `Nombre${documentNumber}`,
          lastName: 'Apellido',
          passwordHash: 'x',
          roles: { create: roles as { role: 'TEACHER' }[] },
        },
      });
    const loginAs = async (documentNumber: string) =>
      (await http().post('/auth/login').send({ documentNumber, password: TEST_PASSWORD }).expect(200)).body.accessToken as string;
    const withRole = async (documentNumber: string, role: { role: 'UGEL_SPECIALIST' | 'TEACHER'; ugelId?: string; schoolId?: string }) => {
      const user = await createTestUser(prisma, { documentNumber });
      await prisma.userRole.updateMany({ where: { userId: user.id }, data: { role: role.role, schoolId: role.schoolId ?? null, ugelId: role.ugelId ?? null } });
      return loginAs(documentNumber);
    };

    it('el director ve las cuentas con roles activos en su IE, sin datos de acceso', async () => {
      const teacher = await person('72000001', [{ role: 'TEACHER', schoolId: SCHOOL_A }, { role: 'TUTOR', schoolId: SCHOOL_B }]);
      await person('72000002', [{ role: 'TEACHER', schoolId: SCHOOL_B }]);
      await person('72000003', [{ role: 'TEACHER', schoolId: SCHOOL_A, isActive: false }]);
      const { body } = await asDirector(http().get('/users')).query({ schoolId: SCHOOL_A }).expect(200);
      expect(body.map((u: { documentNumber: string }) => u.documentNumber).sort()).toEqual(['70000001', '72000001']);
      const listed = body.find((u: { id: string }) => u.id === teacher.id);
      expect(listed).toEqual({
        id: teacher.id,
        documentType: 'DNI',
        documentNumber: '72000001',
        firstName: 'Nombre72000001',
        lastName: 'Apellido',
        email: null,
        status: 'ACTIVE',
        mustChangePassword: false,
        lastLoginAt: null,
        // Solo los roles del ámbito consultado.
        roles: [{ id: expect.any(String), role: 'TEACHER', schoolId: SCHOOL_A, ugelId: null, dreId: null }],
      });
    });

    it('el director no lista otra IE ni una UGEL', async () => {
      await asDirector(http().get('/users')).query({ schoolId: SCHOOL_B }).expect(403);
      await asDirector(http().get('/users')).query({ ugelId: UGEL_1 }).expect(403);
    });

    it('el especialista UGEL lista las IEs de su UGEL y a los especialistas de la UGEL', async () => {
      const token = await withRole('70000009', { role: 'UGEL_SPECIALIST', ugelId: UGEL_1 });
      await person('72000002', [{ role: 'TEACHER', schoolId: SCHOOL_B }]);
      const school = await http().get('/users').query({ schoolId: SCHOOL_B }).set('Authorization', `Bearer ${token}`).expect(200);
      expect(school.body.map((u: { documentNumber: string }) => u.documentNumber)).toEqual(['72000002']);
      const ugel = await http().get('/users').query({ ugelId: UGEL_1 }).set('Authorization', `Bearer ${token}`).expect(200);
      expect(ugel.body.map((u: { documentNumber: string }) => u.documentNumber)).toEqual(['70000009']);
      await http().get('/users').query({ ugelId: UGEL_2 }).set('Authorization', `Bearer ${token}`).expect(403);
    });

    it('exige un único ámbito y un rol que administre usuarios', async () => {
      await asDirector(http().get('/users')).expect(400);
      await asDirector(http().get('/users')).query({ schoolId: SCHOOL_A, ugelId: UGEL_1 }).expect(400);
      const teacher = await withRole('70000008', { role: 'TEACHER', schoolId: SCHOOL_A });
      await http().get('/users').query({ schoolId: SCHOOL_A }).set('Authorization', `Bearer ${teacher}`).expect(403);
    });

    it('un ámbito inexistente: 422', async () => {
      await asDirector(http().get('/users')).query({ schoolId: MISSING }).expect(422);
    });
  });
});
