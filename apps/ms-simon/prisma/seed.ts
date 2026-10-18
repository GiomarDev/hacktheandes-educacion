// Documentos de demo que la plataforma "generó" desde WhatsApp para los docentes sintéticos.
// Ejecutar: npm run simon:seed (usa SIMON_DATABASE_URL). Repetirlo no duplica ni cambia revisiones.
import 'dotenv/config';
import { pathToFileURL } from 'node:url';
import { SEED_IDS } from '@app/fixtures';
import { PrismaService } from '../src/prisma.service.js';

const { users: U, school } = SEED_IDS;
const docId = (n: number) =>
  `01920000-0000-7000-8005-${n.toString(16).padStart(12, '0')}`;

const DOCUMENTS = [
  [
    U.tutorA,
    'Sesión de aprendizaje: fracciones equivalentes (1.° A)',
    'Sesión de aprendizaje',
    'WORD',
  ],
  [
    U.tutorA,
    'Informe de tutoría de octubre (1.° A)',
    'Informe de tutoría',
    'WORD',
  ],
  [
    U.tutorA,
    'Registro de asistencia semanal (1.° A)',
    'Registro auxiliar',
    'EXCEL',
  ],
  [U.tutorB, 'Acta de reunión con familias (1.° B)', 'Acta', 'WORD'],
  [U.tutorB, 'Registro de incidencias (1.° B)', 'Registro auxiliar', 'EXCEL'],
  [
    U.teacherMat,
    'Evaluación diagnóstica de Matemática',
    'Instrumento de evaluación',
    'WORD',
  ],
  [
    U.teacherMat,
    'Consolidado de notas del bimestre (Matemática)',
    'Consolidado de notas',
    'EXCEL',
  ],
  [
    U.teacherCom,
    'Sesión de aprendizaje: textos narrativos',
    'Sesión de aprendizaje',
    'WORD',
  ],
  [
    U.teacherCom,
    'Lista de cotejo de comprensión lectora',
    'Instrumento de evaluación',
    'EXCEL',
  ],
  [U.auxiliar, 'Parte diario de asistencia', 'Registro auxiliar', 'EXCEL'],
] as const;

export async function seedDocuments(prisma: PrismaService): Promise<void> {
  await prisma.generatedDocument.createMany({
    data: DOCUMENTS.map(([ownerUserId, title, category, format], i) => ({
      id: docId(i + 1),
      schoolId: school,
      ownerUserId,
      title,
      category,
      format,
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
    await seedDocuments(prisma);
  } finally {
    await prisma.$disconnect();
  }
  console.log(`ms-simon: ${DOCUMENTS.length} documentos de demo listos`);
}
