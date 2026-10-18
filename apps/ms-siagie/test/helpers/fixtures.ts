import { PrismaService } from '../../src/prisma.service.js';

export const USERS = {
  directorA: '019a0000-0000-7000-8000-0000000000d1',
  secretaryA: '019a0000-0000-7000-8000-0000000000d2',
  tutorA: '019a0000-0000-7000-8000-0000000000d3',
  teacherA: '019a0000-0000-7000-8000-0000000000d4',
  auxiliarA: '019a0000-0000-7000-8000-0000000000d5',
  auxiliarA2: '019a0000-0000-7000-8000-0000000000d6',
  directorB: '019a0000-0000-7000-8000-0000000000e1',
  auxiliarB: '019a0000-0000-7000-8000-0000000000e5',
};

// Dos IEs (A y B) en la misma UGEL, una sección 1.° A en cada una y un área con dos competencias.
export async function createSchoolFixture(prisma: PrismaService) {
  const dre = await prisma.dre.create({ data: { code: 'DRE25', name: 'DRE Ucayali', department: 'Ucayali' } });
  const ugel = await prisma.ugel.create({ data: { code: 'UGEL2501', name: 'UGEL Coronel Portillo', dreId: dre.id } });
  const schoolData = (modularCode: string) => ({
    modularCode,
    name: `IE ${modularCode}`,
    level: 'SECONDARY' as const,
    management: 'PUBLIC' as const,
    area: 'URBAN' as const,
    ugelId: ugel.id,
    ubigeo: '250101',
    department: 'Ucayali',
    province: 'Coronel Portillo',
    district: 'Callería',
    attentionGoal: 70,
    hasPsychologist: false,
    directorHasTeachingLoad: true,
  });
  const schoolA = await prisma.school.create({ data: schoolData('9999901') });
  const schoolB = await prisma.school.create({ data: schoolData('9999902') });
  const section = (schoolId: string, name: string, auxiliarUserId: string) =>
    prisma.section.create({
      data: { schoolId, year: 2026, grade: 1, name, shift: 'MORNING', tutorUserId: USERS.tutorA, auxiliarUserId, capacity: 35 },
    });
  const sectionA = await section(schoolA.id, 'A', USERS.auxiliarA);
  const sectionA2 = await section(schoolA.id, 'B', USERS.auxiliarA2);
  const sectionB = await section(schoolB.id, 'A', USERS.auxiliarB);
  const area = await prisma.curricularArea.create({ data: { code: 'MAT', name: 'Matemática', level: 'SECONDARY' } });
  const competencies = await Promise.all(
    ['MAT1', 'MAT2'].map((code) => prisma.competency.create({ data: { areaId: area.id, code, name: `Competencia ${code}` } })),
  );
  return { dre, ugel, schoolA, schoolB, sectionA, sectionA2, sectionB, area, competencies };
}

let studentSeq = 0;
export async function createEnrolledStudent(prisma: PrismaService, sectionId: string, status: 'ENROLLED' | 'WITHDRAWN' = 'ENROLLED') {
  studentSeq += 1;
  const n = String(studentSeq).padStart(4, '0');
  const student = await prisma.student.create({
    data: {
      studentCode: `S${Date.now()}${n}`.slice(0, 20),
      documentType: 'DNI',
      documentNumber: `8${String(Date.now()).slice(-3)}${n}`,
      firstName: `Alumno${n}`,
      paternalLastName: 'Prueba',
      maternalLastName: 'Demo',
      birthDate: new Date('2013-05-10'),
      sex: 'F',
      hasSpecialNeeds: false,
    },
  });
  const enrollment = await prisma.enrollment.create({
    data: { studentId: student.id, sectionId, year: 2026, enrolledAt: new Date('2026-03-02'), status },
  });
  return { student, enrollment };
}
