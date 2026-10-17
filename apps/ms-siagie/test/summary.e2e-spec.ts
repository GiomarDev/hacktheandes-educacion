import type { INestApplication } from '@nestjs/common';
import { todayInLima } from '@app/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma.service.js';
import { createSiagieApp } from './helpers/app.js';
import { cleanSiagieTables } from './helpers/db.js';
import {
  createEnrolledStudent,
  createSchoolFixture,
  USERS,
} from './helpers/fixtures.js';
import { bearer, signTestToken } from './helpers/tokens.js';

describe('resumen del estudiante', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let fx: Awaited<ReturnType<typeof createSchoolFixture>>;
  let studentId: string;
  let enrollmentId: string;
  let director: string;
  const year = Number(todayInLima().slice(0, 4));
  const summary = (token = director) =>
    request(app.getHttpServer())
      .get(`/students/${studentId}/summary`)
      .set(bearer(token));

  beforeAll(async () => {
    ({ app, prisma } = await createSiagieApp());
  });

  afterAll(async () => {
    await app?.close();
  });

  beforeEach(async () => {
    await cleanSiagieTables(prisma);
    fx = await createSchoolFixture(prisma);
    const created = await createEnrolledStudent(prisma, fx.sectionA.id);
    studentId = created.student.id;
    enrollmentId = created.enrollment.id;
    await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { year },
    });
    director = signTestToken({
      id: USERS.directorA,
      roles: [{ role: 'DIRECTOR', schoolId: fx.schoolA.id }],
    });
  });

  it('calcula la asistencia diaria, incluye notas y registra la consulta', async () => {
    await prisma.attendanceRecord.createMany({
      data: (
        ['PRESENT', 'ABSENT', 'LATE', 'JUSTIFIED', 'LEFT_EARLY'] as const
      ).map((status, i) => ({
        enrollmentId,
        date: new Date(`${year}-04-0${i + 1}`),
        status,
        source: 'MANUAL',
        recordedByUserId: USERS.directorA,
      })),
    });
    const session = await prisma.classSession.create({
      data: {
        sectionId: fx.sectionA.id,
        date: new Date(`${year}-04-01`),
        periodNumber: 1,
        teacherUserId: USERS.teacherA,
      },
    });
    await prisma.attendanceRecord.create({
      data: {
        enrollmentId,
        date: session.date,
        classSessionId: session.id,
        status: 'ABSENT',
        source: 'MANUAL',
        recordedByUserId: USERS.teacherA,
      },
    });
    const period = await prisma.academicPeriod.create({
      data: {
        schoolId: fx.schoolA.id,
        year,
        type: 'BIMESTER',
        number: 1,
        startDate: new Date(`${year}-03-01`),
        endDate: new Date(`${year}-05-01`),
      },
    });
    await prisma.periodGrade.create({
      data: {
        enrollmentId,
        competencyId: fx.competencies[0].id,
        periodId: period.id,
        value: 'A',
        calculationMethod: 'MODE_RECENT_TIEBREAK',
        attendanceRate: 60,
        calculatedAt: new Date(),
      },
    });
    const { body } = await summary().expect(200);
    expect(body.enrollment.id).toBe(enrollmentId);
    expect(body.attendance).toEqual({
      present: 1,
      absent: 1,
      late: 1,
      justified: 1,
      rate: 60,
    });
    expect(body.periodGrades).toEqual([
      { competencyCode: 'MAT1', periodNumber: 1, value: 'A' },
    ]);
    expect(
      await prisma.auditLog.count({
        where: {
          userId: USERS.directorA,
          action: 'VIEW_STUDENT',
          entity: 'student',
          entityId: studentId,
        },
      }),
    ).toBe(1);
  });

  it('una IE ajena no obtiene el resumen ni genera una consulta exitosa en auditoría', async () => {
    const other = signTestToken({
      id: USERS.directorB,
      roles: [{ role: 'DIRECTOR', schoolId: fx.schoolB.id }],
    });
    await summary(other).expect(403);
    expect(await prisma.auditLog.count()).toBe(0);
  });

  it('no devuelve una matrícula de otro año como resumen actual', async () => {
    for (const otherYear of [year - 1, year + 1]) {
      await prisma.enrollment.update({
        where: { id: enrollmentId },
        data: { year: otherYear },
      });
      await summary().expect(404);
    }
    expect(await prisma.auditLog.count()).toBe(0);
  });
});
