import { pgConnectionFromUrl } from '@app/common';
import { PrismaService } from '../../src/prisma.service.js';

const TABLES = [
  'audit_logs', 'period_grades', 'grade_entries', 'access_events', 'qr_credentials', 'attendance_records',
  'class_sessions', 'enrollments', 'student_guardians', 'guardians', 'students', 'teaching_assignments',
  'competencies', 'curricular_areas', 'sections', 'academic_periods', 'schools', 'ugels', 'dres',
];

// Un solo TRUNCATE (la base remota es lenta). Solo corre contra siagie_test (ver test/test-databases.ts).
export async function cleanSiagieTables(prisma: PrismaService): Promise<void> {
  const { schema } = pgConnectionFromUrl(process.env.SIAGIE_DATABASE_URL!);
  if (!schema.endsWith('_test')) throw new Error(`Se aborta: ${schema} no es un schema de pruebas`);
  await prisma.$executeRawUnsafe(`TRUNCATE ${TABLES.map((t) => `"${schema}"."${t}"`).join(', ')} CASCADE`);
}
