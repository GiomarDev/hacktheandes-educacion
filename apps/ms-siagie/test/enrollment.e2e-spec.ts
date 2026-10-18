import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma.service.js';
import { createSiagieApp } from './helpers/app.js';
import { cleanSiagieTables } from './helpers/db.js';
import { createEnrolledStudent, createSchoolFixture, USERS } from './helpers/fixtures.js';
import { bearer, signTestToken } from './helpers/tokens.js';

describe('secciones, estudiantes y matrícula', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let fx: Awaited<ReturnType<typeof createSchoolFixture>>;
  let secretary: string;
  let teacher: string;
  const http = () => request(app.getHttpServer());

  const studentBody = (documentNumber = '81234567') => ({
    studentCode: `C${documentNumber}`,
    documentType: 'DNI',
    documentNumber,
    firstName: 'Rosa',
    paternalLastName: 'Huamán',
    maternalLastName: 'Ríos',
    birthDate: '2013-04-12',
    sex: 'F',
    hasSpecialNeeds: false,
    guardians: [
      { documentType: 'DNI', documentNumber: '40000001', firstName: 'Elena', lastName: 'Ríos', phone: '+51900000001', whatsappOptIn: true, preferredChannel: 'WHATSAPP', relationship: 'MOTHER', isPrimary: true, receivesAlerts: true },
      { documentType: 'DNI', documentNumber: '40000002', firstName: 'Mario', lastName: 'Huamán', phone: '+51900000002', whatsappOptIn: false, preferredChannel: 'CALL', relationship: 'FATHER', isPrimary: false, receivesAlerts: false },
    ],
  });

  beforeAll(async () => {
    ({ app, prisma } = await createSiagieApp());
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await cleanSiagieTables(prisma);
    fx = await createSchoolFixture(prisma);
    secretary = signTestToken({ id: USERS.secretaryA, roles: [{ role: 'SECRETARY', schoolId: fx.schoolA.id }] });
    teacher = signTestToken({ id: USERS.teacherA, roles: [{ role: 'TEACHER', schoolId: fx.schoolA.id }] });
  });

  it('crea una sección en su IE', async () => {
    const res = await http()
      .post('/sections')
      .set(bearer(secretary))
      .send({ schoolId: fx.schoolA.id, year: 2026, grade: 2, name: 'A', shift: 'MORNING', tutorUserId: USERS.tutorA, capacity: 35 })
      .expect(201);
    expect(res.body.grade).toBe(2);
    await http()
      .post('/sections')
      .set(bearer(secretary))
      .send({ schoolId: fx.schoolB.id, year: 2026, grade: 2, name: 'A', shift: 'MORNING', tutorUserId: USERS.tutorA, capacity: 35 })
      .expect(403);
  });

  it('registra a un estudiante con 2 apoderados y lo matricula', async () => {
    const student = await http().post('/students').set(bearer(secretary)).send(studentBody()).expect(201);
    expect(await prisma.studentGuardian.count({ where: { studentId: student.body.id } })).toBe(2);
    const enrollment = await http()
      .post('/enrollments')
      .set(bearer(secretary))
      .send({ studentId: student.body.id, sectionId: fx.sectionA.id, enrolledAt: '2026-03-02' })
      .expect(201);
    expect(enrollment.body).toMatchObject({ year: 2026, status: 'ENROLLED' });
    await http()
      .post('/enrollments')
      .set(bearer(secretary))
      .send({ studentId: student.body.id, sectionId: fx.sectionA2.id, enrolledAt: '2026-03-02' })
      .expect(409);
  });

  it('un apoderado ya registrado no se modifica desde otra matrícula', async () => {
    await http().post('/students').set(bearer(secretary)).send(studentBody('81234567')).expect(201);
    const hijack = studentBody('81234568');
    hijack.guardians[0] = { ...hijack.guardians[0], phone: '+51999999999', firstName: 'Otro' };
    await http().post('/students').set(bearer(secretary)).send(hijack).expect(201);
    const guardian = await prisma.guardian.findFirstOrThrow({ where: { documentNumber: '40000001' } });
    expect(guardian.phone).toBe('+51900000001');
    expect(guardian.firstName).toBe('Elena');
    expect(await prisma.studentGuardian.count({ where: { guardianId: guardian.id } })).toBe(2);
  });

  it('no matricula a un estudiante con matrícula vigente en otra IE', async () => {
    const { student, enrollment } = await createEnrolledStudent(prisma, fx.sectionB.id);
    await prisma.enrollment.update({ where: { id: enrollment.id }, data: { year: 2025 } });
    await http()
      .post('/enrollments')
      .set(bearer(secretary))
      .send({ studentId: student.id, sectionId: fx.sectionA.id, enrolledAt: '2026-03-02' })
      .expect(409);
    await prisma.enrollment.update({ where: { id: enrollment.id }, data: { status: 'TRANSFERRED_OUT', statusReason: 'Traslado' } });
    await http()
      .post('/enrollments')
      .set(bearer(secretary))
      .send({ studentId: student.id, sectionId: fx.sectionA.id, enrolledAt: '2026-03-02' })
      .expect(201);
  });

  it('la baja exige justificación y registra la fecha del cambio', async () => {
    const student = await http().post('/students').set(bearer(secretary)).send(studentBody()).expect(201);
    const { body } = await http()
      .post('/enrollments')
      .set(bearer(secretary))
      .send({ studentId: student.body.id, sectionId: fx.sectionA.id, enrolledAt: '2026-03-02' })
      .expect(201);
    await http().patch(`/enrollments/${body.id}/status`).set(bearer(secretary)).send({ status: 'WITHDRAWN' }).expect(400);
    const res = await http()
      .patch(`/enrollments/${body.id}/status`)
      .set(bearer(secretary))
      .send({ status: 'WITHDRAWN', statusReason: 'Se mudó a otra región' })
      .expect(200);
    expect(res.body.statusReason).toBe('Se mudó a otra región');
    expect(res.body.statusChangedAt).toBeTruthy();
  });

  it('un docente no matricula', async () => {
    const student = await http().post('/students').set(bearer(secretary)).send(studentBody()).expect(201);
    await http()
      .post('/enrollments')
      .set(bearer(teacher))
      .send({ studentId: student.body.id, sectionId: fx.sectionA.id, enrolledAt: '2026-03-02' })
      .expect(403);
  });

  it('lista los estudiantes matriculados de una sección', async () => {
    const student = await http().post('/students').set(bearer(secretary)).send(studentBody()).expect(201);
    await http()
      .post('/enrollments')
      .set(bearer(secretary))
      .send({ studentId: student.body.id, sectionId: fx.sectionA.id, enrolledAt: '2026-03-02' })
      .expect(201);
    // El docente solo lee la nómina de las secciones donde dicta.
    await http().get(`/sections/${fx.sectionA.id}/students`).set(bearer(teacher)).expect(403);
    await prisma.teachingAssignment.create({
      data: { sectionId: fx.sectionA.id, areaId: fx.area.id, teacherUserId: USERS.teacherA, weeklyHours: 4 },
    });
    const res = await http().get(`/sections/${fx.sectionA.id}/students`).set(bearer(teacher)).expect(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].student.firstName).toBe('Rosa');
    const directorB = signTestToken({ id: USERS.directorB, roles: [{ role: 'DIRECTOR', schoolId: fx.schoolB.id }] });
    await http().get(`/sections/${fx.sectionA.id}/students`).set(bearer(directorB)).expect(403);
  });
});
