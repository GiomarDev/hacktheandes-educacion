// IE sintética de demo en Coronel Portillo (Ucayali). Ejecutar: npm run siagie:seed (usa SIAGIE_DATABASE_URL).
import 'dotenv/config';
import { pathToFileURL } from 'node:url';
import { dateOnly } from '@app/common';
import { SEED_IDS, seedRowId } from '@app/fixtures';
import { PrismaService } from '../src/prisma.service.js';

const { users: U } = SEED_IDS;
const YEAR = 2026;
const FIRST_NAMES = [
  'Luis',
  'Rosa',
  'Jhon',
  'Milagros',
  'Kevin',
  'Yesenia',
  'Brayan',
  'Lucero',
  'Piero',
  'Sheyla',
  'Anderson',
  'Nayeli',
  'Josué',
  'Fiorella',
  'Diego',
];
const LAST_NAMES = [
  'Rojas',
  'Vela',
  'Panduro',
  'Ríos',
  'Shuña',
  'Pezo',
  'Tapullima',
  'Ahuanari',
  'Sánchez',
  'Huamán',
  'Flores',
  'Cachique',
];
const BIMESTERS: [string, string][] = [
  ['2026-03-16', '2026-05-15'],
  ['2026-05-25', '2026-07-24'],
  ['2026-08-10', '2026-10-16'],
  ['2026-10-26', '2026-12-18'],
];

export async function seedSiagie(prisma: PrismaService): Promise<void> {
  await prisma.dre.upsert({
    where: { id: SEED_IDS.dreUcayali },
    create: {
      id: SEED_IDS.dreUcayali,
      code: 'DRE-UCA',
      name: 'DRE Ucayali (Demo sintética)',
      department: 'Ucayali',
    },
    update: {},
  });
  await prisma.ugel.upsert({
    where: { id: SEED_IDS.ugelCoronelPortillo },
    create: {
      id: SEED_IDS.ugelCoronelPortillo,
      code: 'UGEL-CP',
      name: 'UGEL Coronel Portillo (Demo sintética)',
      dreId: SEED_IDS.dreUcayali,
    },
    update: {},
  });
  await prisma.school.upsert({
    where: { id: SEED_IDS.school },
    create: {
      id: SEED_IDS.school,
      modularCode: '9999901',
      name: 'IE Sintética Demo (datos ficticios)',
      level: 'SECONDARY',
      management: 'PUBLIC',
      area: 'URBAN',
      ugelId: SEED_IDS.ugelCoronelPortillo,
      ubigeo: '250101',
      department: 'Ucayali',
      province: 'Coronel Portillo',
      district: 'Callería',
      attentionGoal: 70,
      hasPsychologist: true,
      directorHasTeachingLoad: true,
    },
    update: {},
  });
  await prisma.academicPeriod.createMany({
    data: BIMESTERS.map(([start, end], i) => ({
      schoolId: SEED_IDS.school,
      year: YEAR,
      type: 'BIMESTER' as const,
      number: i + 1,
      startDate: dateOnly(start),
      endDate: dateOnly(end),
    })),
    skipDuplicates: true,
  });
  await prisma.section.createMany({
    data: [
      { id: SEED_IDS.sections.a1, name: 'A', tutorUserId: U.tutorA },
      { id: SEED_IDS.sections.b1, name: 'B', tutorUserId: U.tutorB },
    ].map((s) => ({
      ...s,
      schoolId: SEED_IDS.school,
      year: YEAR,
      grade: 1,
      shift: 'MORNING' as const,
      auxiliarUserId: U.auxiliar,
      capacity: 35,
    })),
    skipDuplicates: true,
  });

  const areas = [
    {
      code: 'MAT',
      name: 'Matemática',
      teacher: U.teacherMat,
      competencies: [
        'Resuelve problemas de cantidad',
        'Resuelve problemas de regularidad, equivalencia y cambio',
      ],
    },
    {
      code: 'COM',
      name: 'Comunicación',
      teacher: U.teacherCom,
      competencies: [
        'Lee diversos tipos de textos escritos en su lengua materna',
        'Escribe diversos tipos de textos en su lengua materna',
      ],
    },
  ];
  for (const a of areas) {
    const area = await prisma.curricularArea.upsert({
      where: { code: a.code },
      create: { code: a.code, name: a.name, level: 'SECONDARY' },
      update: {},
    });
    await prisma.competency.createMany({
      data: a.competencies.map((name, i) => ({
        areaId: area.id,
        code: `${a.code}${i + 1}`,
        name,
      })),
      skipDuplicates: true,
    });
    await prisma.teachingAssignment.createMany({
      data: Object.values(SEED_IDS.sections).map((sectionId) => ({
        sectionId,
        areaId: area.id,
        teacherUserId: a.teacher,
        weeklyHours: 5,
      })),
      skipDuplicates: true,
    });
  }

  // 60 estudiantes (30 por sección), cada uno con un apoderado que aceptó recibir WhatsApp.
  const sections = [SEED_IDS.sections.a1, SEED_IDS.sections.b1];
  const rows = Array.from({ length: 60 }, (_, i) => i + 1);
  await prisma.student.createMany({
    data: rows.map((n) => ({
      id: seedRowId(1, n),
      studentCode: `DEMO${String(n).padStart(4, '0')}`,
      documentType: 'DNI' as const,
      documentNumber: `9${String(n).padStart(7, '0')}`,
      firstName: `${FIRST_NAMES[n % FIRST_NAMES.length]} (Demo)`,
      paternalLastName: LAST_NAMES[n % LAST_NAMES.length],
      maternalLastName: LAST_NAMES[(n * 7) % LAST_NAMES.length],
      birthDate: dateOnly(`2013-${String((n % 12) + 1).padStart(2, '0')}-15`),
      sex: n % 2 ? ('F' as const) : ('M' as const),
      motherTongue: 'Castellano',
      hasSpecialNeeds: n % 15 === 0,
    })),
    skipDuplicates: true,
  });
  await prisma.guardian.createMany({
    data: rows.map((n) => ({
      id: seedRowId(2, n),
      documentType: 'DNI' as const,
      documentNumber: `6${String(n).padStart(7, '0')}`,
      firstName: 'Apoderado',
      lastName: `Demo ${n}`,
      phone: `+51900${String(n).padStart(6, '0')}`,
      whatsappOptIn: true,
      optInAt: new Date(),
      preferredChannel: 'WHATSAPP' as const,
    })),
    skipDuplicates: true,
  });
  await prisma.studentGuardian.createMany({
    data: rows.map((n) => ({
      studentId: seedRowId(1, n),
      guardianId: seedRowId(2, n),
      relationship: n % 3 ? ('MOTHER' as const) : ('FATHER' as const),
      isPrimary: true,
      receivesAlerts: true,
    })),
    skipDuplicates: true,
  });
  await prisma.enrollment.createMany({
    data: rows.map((n) => ({
      id: seedRowId(3, n),
      studentId: seedRowId(1, n),
      sectionId: sections[n <= 30 ? 0 : 1],
      year: YEAR,
      enrolledAt: dateOnly('2026-03-02'),
    })),
    skipDuplicates: true,
  });
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const prisma = new PrismaService();
  try {
    await seedSiagie(prisma);
  } finally {
    await prisma.$disconnect();
  }
  console.log('ms-siagie: IE sintética con 2 secciones y 60 estudiantes lista');
}
