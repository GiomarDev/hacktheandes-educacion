import { PrismaService } from '../src/prisma.service.js';
import { cleanSiagieTables } from './helpers/db.js';

const USER = '019a0000-0000-7000-8000-0000000000aa';

describe('esquema Prisma de ms-siagie', () => {
  const prisma = new PrismaService();

  beforeAll(async () => {
    await prisma.onModuleInit();
  });

  afterAll(async () => {
    await prisma.onModuleDestroy();
  });

  beforeEach(async () => {
    await cleanSiagieTables(prisma);
  });

  async function seedChain() {
    const dre = await prisma.dre.create({ data: { code: 'DRE25', name: 'DRE Ucayali', department: 'Ucayali' } });
    const ugel = await prisma.ugel.create({ data: { code: 'UGEL2501', name: 'UGEL Coronel Portillo', dreId: dre.id } });
    const school = await prisma.school.create({
      data: {
        modularCode: '9999901',
        name: 'IE Prueba',
        level: 'SECONDARY',
        management: 'PUBLIC',
        area: 'URBAN',
        ugelId: ugel.id,
        ubigeo: '250101',
        department: 'Ucayali',
        province: 'Coronel Portillo',
        district: 'Callería',
        attentionGoal: 70,
        hasPsychologist: false,
        directorHasTeachingLoad: true,
      },
    });
    const section = await prisma.section.create({
      data: { schoolId: school.id, year: 2026, grade: 1, name: 'A', shift: 'MORNING', tutorUserId: USER, capacity: 35 },
    });
    const student = await prisma.student.create({
      data: {
        studentCode: 'S0001',
        documentType: 'DNI',
        documentNumber: '80000001',
        firstName: 'Luis',
        paternalLastName: 'Rojas',
        maternalLastName: 'Vela',
        birthDate: new Date('2013-03-01'),
        sex: 'M',
        hasSpecialNeeds: false,
      },
    });
    const enrollment = await prisma.enrollment.create({
      data: { studentId: student.id, sectionId: section.id, year: 2026, enrolledAt: new Date('2026-03-01') },
    });
    return { dre, ugel, school, section, student, enrollment };
  }

  it('crea la cadena DRE → UGEL → IE → sección → matrícula', async () => {
    const { enrollment } = await seedChain();
    const found = await prisma.enrollment.findUniqueOrThrow({
      where: { id: enrollment.id },
      include: { student: true, section: { include: { school: { include: { ugel: { include: { dre: true } } } } } } },
    });
    expect(found.status).toBe('ENROLLED');
    expect(found.section.school.ugel.dre.name).toBe('DRE Ucayali');
  });

  it('una sola matrícula por estudiante y año', async () => {
    const { student, section } = await seedChain();
    await expect(
      prisma.enrollment.create({ data: { studentId: student.id, sectionId: section.id, year: 2026, enrolledAt: new Date() } }),
    ).rejects.toMatchObject({ code: 'P2002' });
  });

  it('un registro de asistencia por matrícula, fecha y hora', async () => {
    const { enrollment } = await seedChain();
    const record = { enrollmentId: enrollment.id, date: new Date('2026-04-06'), status: 'PRESENT' as const, source: 'MANUAL' as const, recordedByUserId: USER };
    await prisma.attendanceRecord.create({ data: record });
    await expect(prisma.attendanceRecord.create({ data: record })).rejects.toMatchObject({ code: 'P2002' });
  });

  it('el código modular es único', async () => {
    const { school } = await seedChain();
    await expect(
      prisma.school.create({ data: { ...school, id: undefined, createdAt: undefined, updatedAt: undefined } }),
    ).rejects.toMatchObject({ code: 'P2002' });
  });
});
