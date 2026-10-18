import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma.service.js';
import { createSiagieApp } from './helpers/app.js';
import { cleanSiagieTables } from './helpers/db.js';
import { createEnrolledStudent, createSchoolFixture, USERS } from './helpers/fixtures.js';
import { bearer, signTestToken } from './helpers/tokens.js';

const OTHER_TEACHER = '019a0000-0000-7000-8000-0000000000d7';

describe('lectura de periodos, áreas y notas', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let fx: Awaited<ReturnType<typeof createSchoolFixture>>;
  let periodId: string;
  let enrollmentId: string;
  const http = () => request(app.getHttpServer());
  const token = (id: string, role: string, schoolId = fx.schoolA.id) =>
    signTestToken({ id, roles: [{ role: role as 'TEACHER', schoolId }] });
  const sheet = (who: string, query: Record<string, string> = {}) =>
    http()
      .get('/grades')
      .query({ sectionId: fx.sectionA.id, areaId: fx.area.id, periodId, ...query })
      .set(bearer(who));

  beforeAll(async () => {
    ({ app, prisma } = await createSiagieApp());
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await cleanSiagieTables(prisma);
    fx = await createSchoolFixture(prisma);
    await prisma.teachingAssignment.create({
      data: { sectionId: fx.sectionA.id, areaId: fx.area.id, teacherUserId: USERS.teacherA, weeklyHours: 5 },
    });
    const periods = await Promise.all(
      [2, 1].map((number) =>
        prisma.academicPeriod.create({
          data: {
            schoolId: fx.schoolA.id,
            year: 2026,
            type: 'BIMESTER',
            number,
            startDate: new Date(number === 1 ? '2026-03-02' : '2026-05-18'),
            endDate: new Date(number === 1 ? '2026-05-08' : '2026-07-24'),
          },
        }),
      ),
    );
    periodId = periods.find((p) => p.number === 1)!.id;
    await prisma.academicPeriod.create({
      data: { schoolId: fx.schoolA.id, year: 2025, type: 'BIMESTER', number: 1, startDate: new Date('2025-03-03'), endDate: new Date('2025-05-09') },
    });
    enrollmentId = (await createEnrolledStudent(prisma, fx.sectionA.id)).enrollment.id;
    await http()
      .post('/grades/entries')
      .set(bearer(token(USERS.teacherA, 'TEACHER')))
      .send({ enrollmentId, competencyId: fx.competencies[0].id, periodId, columnNumber: 1, value: 'A' })
      .expect(200);
  });

  describe('GET /schools/:id/periods', () => {
    it('lista los periodos del año en orden, para el personal de la IE', async () => {
      const { body } = await http()
        .get(`/schools/${fx.schoolA.id}/periods`)
        .query({ year: 2026 })
        .set(bearer(token(USERS.teacherA, 'TEACHER')))
        .expect(200);
      expect(body.map((p: { number: number }) => p.number)).toEqual([1, 2]);
      expect(body[0]).toMatchObject({ id: periodId, type: 'BIMESTER', year: 2026, startDate: '2026-03-02', endDate: '2026-05-08' });
    });

    it('sin año devuelve todos los años, el más reciente primero', async () => {
      const { body } = await http()
        .get(`/schools/${fx.schoolA.id}/periods`)
        .set(bearer(token(USERS.directorA, 'DIRECTOR')))
        .expect(200);
      expect(body.map((p: { year: number; number: number }) => `${p.year}-${p.number}`)).toEqual(['2026-1', '2026-2', '2025-1']);
    });

    it('otra IE: 403', async () => {
      await http()
        .get(`/schools/${fx.schoolA.id}/periods`)
        .set(bearer(token(USERS.directorB, 'DIRECTOR', fx.schoolB.id)))
        .expect(403);
    });
  });

  describe('GET /sections/:id/areas', () => {
    it('devuelve las áreas que se dictan con sus competencias e indica las propias', async () => {
      const { body } = await http()
        .get(`/sections/${fx.sectionA.id}/areas`)
        .set(bearer(token(USERS.teacherA, 'TEACHER')))
        .expect(200);
      expect(body).toEqual([
        expect.objectContaining({
          id: fx.area.id,
          code: 'MAT',
          name: 'Matemática',
          teacherUserIds: [USERS.teacherA],
          mine: true,
          competencies: [
            expect.objectContaining({ code: 'MAT1' }),
            expect.objectContaining({ code: 'MAT2' }),
          ],
        }),
      ]);
    });

    it('el tutor de la sección también las ve, sin marcarlas como propias', async () => {
      const { body } = await http()
        .get(`/sections/${fx.sectionA.id}/areas`)
        .set(bearer(token(USERS.tutorA, 'TUTOR')))
        .expect(200);
      expect(body[0].mine).toBe(false);
    });

    it('un docente que no dicta en la sección: 403', async () => {
      await http()
        .get(`/sections/${fx.sectionA.id}/areas`)
        .set(bearer(token(OTHER_TEACHER, 'TEACHER')))
        .expect(403);
    });
  });

  describe('GET /grades', () => {
    it('el docente del área lee el registro: columnas y nota del periodo por estudiante', async () => {
      const { body } = await sheet(token(USERS.teacherA, 'TEACHER')).expect(200);
      expect(body.competencies.map((c: { code: string }) => c.code)).toEqual(['MAT1', 'MAT2']);
      expect(body.rows).toHaveLength(1);
      expect(body.rows[0]).toMatchObject({
        enrollmentId,
        student: { firstName: expect.any(String), paternalLastName: expect.any(String) },
        entries: [{ competencyId: fx.competencies[0].id, columnNumber: 1, value: 'A', isCompensatory: false }],
        periodGrades: [{ competencyId: fx.competencies[0].id, value: 'A', calculationMethod: 'MODE_RECENT_TIEBREAK' }],
      });
      // La ficha del registro no expone documentos ni datos de contacto.
      expect(body.rows[0].student.documentNumber).toBeUndefined();
    });

    it('el tutor y la dirección lo leen; otra IE no', async () => {
      await sheet(token(USERS.tutorA, 'TUTOR')).expect(200);
      await sheet(token(USERS.directorA, 'DIRECTOR')).expect(200);
      await sheet(token(USERS.directorB, 'DIRECTOR', fx.schoolB.id)).expect(403);
    });

    it('un docente de la sección que dicta otra área: 403', async () => {
      const other = await prisma.curricularArea.create({ data: { code: 'COM', name: 'Comunicación', level: 'SECONDARY' } });
      await prisma.teachingAssignment.create({
        data: { sectionId: fx.sectionA.id, areaId: other.id, teacherUserId: OTHER_TEACHER, weeklyHours: 4 },
      });
      const res = await sheet(token(OTHER_TEACHER, 'TEACHER')).expect(403);
      expect(res.body.message).toBe('No dicta esta área en la sección');
      await sheet(token(OTHER_TEACHER, 'TEACHER'), { areaId: other.id }).expect(200);
    });

    it('el periodo debe ser de la IE y del año de la sección', async () => {
      const old = await prisma.academicPeriod.findFirstOrThrow({ where: { year: 2025 } });
      await sheet(token(USERS.teacherA, 'TEACHER'), { periodId: old.id }).expect(400);
    });

    it('valida los parámetros', async () => {
      await http().get('/grades').query({ sectionId: fx.sectionA.id }).set(bearer(token(USERS.teacherA, 'TEACHER'))).expect(400);
    });
  });
});
