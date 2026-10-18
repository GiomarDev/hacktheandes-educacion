import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma.service.js';
import { createSiagieApp } from './helpers/app.js';
import { cleanSiagieTables } from './helpers/db.js';
import { createEnrolledStudent, createSchoolFixture, USERS } from './helpers/fixtures.js';
import { bearer, signTestToken } from './helpers/tokens.js';

describe('registro auxiliar de notas', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let fx: Awaited<ReturnType<typeof createSchoolFixture>>;
  let teacher: string;
  let enrollmentId: string;
  let periodId: string;
  const http = () => request(app.getHttpServer());
  const entry = (columnNumber: number, value: string | null, token = teacher) =>
    http()
      .post('/grades/entries')
      .set(bearer(token))
      .send({ enrollmentId, competencyId: fx.competencies[0].id, periodId, columnNumber, value });

  beforeAll(async () => {
    ({ app, prisma } = await createSiagieApp());
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await cleanSiagieTables(prisma);
    fx = await createSchoolFixture(prisma);
    teacher = signTestToken({ id: USERS.teacherA, roles: [{ role: 'TEACHER', schoolId: fx.schoolA.id }] });
    await prisma.teachingAssignment.create({
      data: { sectionId: fx.sectionA.id, areaId: fx.area.id, teacherUserId: USERS.teacherA, weeklyHours: 5 },
    });
    const period = await prisma.academicPeriod.create({
      data: { schoolId: fx.schoolA.id, year: 2026, type: 'BIMESTER', number: 1, startDate: new Date('2026-03-02'), endDate: new Date('2026-05-08') },
    });
    periodId = period.id;
    enrollmentId = (await createEnrolledStudent(prisma, fx.sectionA.id)).enrollment.id;
    await prisma.attendanceRecord.createMany({
      data: [
        { enrollmentId, date: new Date('2026-04-06'), status: 'PRESENT', source: 'MANUAL', recordedByUserId: USERS.auxiliarA },
        { enrollmentId, date: new Date('2026-04-07'), status: 'ABSENT', source: 'MANUAL', recordedByUserId: USERS.auxiliarA },
      ],
    });
  });

  const periodGrade = () =>
    prisma.periodGrade.findUniqueOrThrow({
      where: { enrollmentId_competencyId_periodId: { enrollmentId, competencyId: fx.competencies[0].id, periodId } },
    });

  it('calcula la nota del periodo con la asistencia', async () => {
    await entry(1, 'A').expect(200);
    await entry(2, 'B').expect(200);
    await entry(3, 'A').expect(200);
    const grade = await periodGrade();
    expect(grade.value).toBe('A');
    expect(grade.calculationMethod).toBe('MODE_RECENT_TIEBREAK');
    expect(Number(grade.attendanceRate)).toBe(50);
  });

  it('recalcula al cambiar una columna', async () => {
    await entry(1, 'A').expect(200);
    await entry(2, 'B').expect(200);
    await entry(3, 'A').expect(200);
    await entry(3, 'B').expect(200);
    expect((await periodGrade()).value).toBe('B');
    expect(await prisma.gradeEntry.count()).toBe(3);
  });

  it('un docente sin asignación en el área: 403', async () => {
    const other = signTestToken({ id: USERS.tutorA, roles: [{ role: 'TEACHER', schoolId: fx.schoolA.id }] });
    await entry(1, 'A', other).expect(403);
  });

  it('no acepta un periodo de otro año ni una matrícula retirada', async () => {
    const oldPeriod = await prisma.academicPeriod.create({
      data: { schoolId: fx.schoolA.id, year: 2025, type: 'BIMESTER', number: 1, startDate: new Date('2025-03-03'), endDate: new Date('2025-05-09') },
    });
    await http()
      .post('/grades/entries')
      .set(bearer(teacher))
      .send({ enrollmentId, competencyId: fx.competencies[0].id, periodId: oldPeriod.id, columnNumber: 1, value: 'A' })
      .expect(400);
    await prisma.enrollment.update({ where: { id: enrollmentId }, data: { status: 'WITHDRAWN', statusReason: 'Retiro' } });
    await entry(1, 'A').expect(400);
  });

  it('una nota que no existe: 400', async () => {
    await entry(1, 'D').expect(400);
  });
});
