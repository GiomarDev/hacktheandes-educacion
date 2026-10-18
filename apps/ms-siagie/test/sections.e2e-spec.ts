import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { Role } from '@app/common';
import { PrismaService } from '../src/prisma.service.js';
import { createSiagieApp } from './helpers/app.js';
import { cleanSiagieTables } from './helpers/db.js';
import {
  createEnrolledStudent,
  createSchoolFixture,
  USERS,
} from './helpers/fixtures.js';
import { bearer, signTestToken } from './helpers/tokens.js';

describe('secciones a cargo', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let fx: Awaited<ReturnType<typeof createSchoolFixture>>;
  const token = (id: string, role: Role, schoolId = fx.schoolA.id) =>
    signTestToken({ id, roles: [{ role, schoolId }] });
  const list = (t: string, query = '') =>
    request(app.getHttpServer()).get(`/sections${query}`).set(bearer(t));
  const names = (body: { name: string }[]) => body.map((s) => s.name).sort();

  beforeAll(async () => {
    ({ app, prisma } = await createSiagieApp());
  });
  afterAll(async () => {
    await app?.close();
  });
  beforeEach(async () => {
    await cleanSiagieTables(prisma);
    fx = await createSchoolFixture(prisma);
    await createEnrolledStudent(prisma, fx.sectionA.id);
    await createEnrolledStudent(prisma, fx.sectionA.id);
    await createEnrolledStudent(prisma, fx.sectionA.id, 'WITHDRAWN');
  });

  it('dirección ve todas las secciones de su IE con su matrícula activa', async () => {
    const { body } = await list(token(USERS.directorA, 'DIRECTOR')).expect(200);
    expect(names(body)).toEqual(['A', 'B']);
    const a = body.find((s: { id: string }) => s.id === fx.sectionA.id);
    expect(a).toMatchObject({
      grade: 1,
      year: 2026,
      enrolledCount: 2,
      school: {
        id: fx.schoolA.id,
        name: fx.schoolA.name,
        modularCode: '9999901',
      },
    });
  });

  it('el personal de aula solo ve sus secciones', async () => {
    // tutorA es tutor de las tres secciones del fixture; en la IE A tiene A y B.
    expect(
      names((await list(token(USERS.tutorA, 'TUTOR')).expect(200)).body),
    ).toEqual(['A', 'B']);
    expect(
      names((await list(token(USERS.auxiliarA2, 'AUXILIAR')).expect(200)).body),
    ).toEqual(['B']);
    expect(
      (await list(token(USERS.teacherA, 'TEACHER')).expect(200)).body,
    ).toEqual([]);
    await prisma.teachingAssignment.create({
      data: {
        sectionId: fx.sectionA.id,
        areaId: fx.area.id,
        teacherUserId: USERS.teacherA,
        weeklyHours: 4,
      },
    });
    expect(
      names((await list(token(USERS.teacherA, 'TEACHER')).expect(200)).body),
    ).toEqual(['A']);
  });

  it('filtra por IE y año, y no muestra otra IE', async () => {
    const director = token(USERS.directorA, 'DIRECTOR');
    expect((await list(director, '?year=2025').expect(200)).body).toEqual([]);
    expect(
      (await list(director, `?schoolId=${fx.schoolB.id}`).expect(403)).body
        .message,
    ).toBeTruthy();
    await list(director, '?year=abc').expect(400);
  });

  it('la nómina de una sección exige tenerla a cargo', async () => {
    const students = (t: string) =>
      request(app.getHttpServer())
        .get(`/sections/${fx.sectionA.id}/students`)
        .set(bearer(t));
    await students(token(USERS.teacherA, 'TEACHER')).expect(403);
    await students(token(USERS.auxiliarA2, 'AUXILIAR')).expect(403);
    expect(
      (await students(token(USERS.auxiliarA, 'AUXILIAR')).expect(200)).body,
    ).toHaveLength(2);
    expect(
      (await students(token(USERS.directorA, 'DIRECTOR')).expect(200)).body,
    ).toHaveLength(2);
  });
});
