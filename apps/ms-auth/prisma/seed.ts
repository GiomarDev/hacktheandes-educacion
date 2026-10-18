// Usuarios sintéticos de la demo. Ejecutar: npm run auth:seed (usa AUTH_DATABASE_URL y SEED_PASSWORD).
import 'dotenv/config';
import { pathToFileURL } from 'node:url';
import argon2 from 'argon2';
import { SEED_IDS } from '@app/fixtures';
import type { RoleClaim } from '@app/common';
import { PrismaService } from '../src/prisma.service.js';

const { users: U, documents: D, school, ugelCoronelPortillo } = SEED_IDS;

const PEOPLE: {
  key: keyof typeof U;
  firstName: string;
  lastName: string;
  roles: RoleClaim[];
}[] = [
  {
    key: 'admin',
    firstName: 'Admin',
    lastName: 'Minedu Demo',
    roles: [{ role: 'MINEDU_ADMIN' }],
  },
  {
    key: 'ugelSpecialist',
    firstName: 'Especialista',
    lastName: 'UGEL Demo',
    roles: [{ role: 'UGEL_SPECIALIST', ugelId: ugelCoronelPortillo }],
  },
  {
    key: 'director',
    firstName: 'Directora',
    lastName: 'Demo',
    roles: [{ role: 'DIRECTOR', schoolId: school }],
  },
  {
    key: 'secretary',
    firstName: 'Secretaria',
    lastName: 'Demo',
    roles: [{ role: 'SECRETARY', schoolId: school }],
  },
  {
    key: 'tutorA',
    firstName: 'Tutor',
    lastName: '1A Demo',
    roles: [
      { role: 'TUTOR', schoolId: school },
      { role: 'TEACHER', schoolId: school },
    ],
  },
  {
    key: 'tutorB',
    firstName: 'Tutora',
    lastName: '1B Demo',
    roles: [
      { role: 'TUTOR', schoolId: school },
      { role: 'TEACHER', schoolId: school },
    ],
  },
  {
    key: 'teacherMat',
    firstName: 'Docente',
    lastName: 'Matemática Demo',
    roles: [{ role: 'TEACHER', schoolId: school }],
  },
  {
    key: 'teacherCom',
    firstName: 'Docente',
    lastName: 'Comunicación Demo',
    roles: [{ role: 'TEACHER', schoolId: school }],
  },
  {
    key: 'auxiliar',
    firstName: 'Auxiliar',
    lastName: 'Demo',
    roles: [{ role: 'AUXILIAR', schoolId: school }],
  },
  {
    key: 'psychologist',
    firstName: 'Psicóloga',
    lastName: 'Demo',
    roles: [{ role: 'PSYCHOLOGIST', schoolId: school }],
  },
];

export async function seedAuth(
  prisma: PrismaService,
  password: string,
): Promise<void> {
  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
  for (const p of PEOPLE) {
    const data = {
      documentType: 'DNI' as const,
      documentNumber: D[p.key],
      firstName: p.firstName,
      lastName: p.lastName,
    };
    await prisma.user.upsert({
      where: { id: U[p.key] },
      create: { id: U[p.key], ...data, passwordHash },
      // Repetir la demo no restablece contraseñas, bloqueos ni preferencias de cuentas existentes.
      update: {},
    });
    await prisma.userRole.createMany({
      data: p.roles.map((r) => ({ userId: U[p.key], ...r })),
      skipDuplicates: true,
    });
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const password = process.env.SEED_PASSWORD;
  if (!password) throw new Error('Falta la variable de entorno SEED_PASSWORD');
  const prisma = new PrismaService();
  try {
    await seedAuth(prisma, password);
  } finally {
    await prisma.$disconnect();
  }
  console.log(`ms-auth: ${PEOPLE.length} usuarios sintéticos listos`);
}
