import { PrismaService } from '../../src/prisma.service.js';

// Borra en orden inverso a las dependencias. Solo corre contra siagie_test (ver test/test-databases.ts).
export async function cleanSiagieTables(prisma: PrismaService): Promise<void> {
  await prisma.$transaction([
    prisma.auditLog.deleteMany(),
    prisma.periodGrade.deleteMany(),
    prisma.gradeEntry.deleteMany(),
    prisma.accessEvent.deleteMany(),
    prisma.qrCredential.deleteMany(),
    prisma.attendanceRecord.deleteMany(),
    prisma.classSession.deleteMany(),
    prisma.enrollment.deleteMany(),
    prisma.studentGuardian.deleteMany(),
    prisma.guardian.deleteMany(),
    prisma.student.deleteMany(),
    prisma.teachingAssignment.deleteMany(),
    prisma.competency.deleteMany(),
    prisma.curricularArea.deleteMany(),
    prisma.section.deleteMany(),
    prisma.academicPeriod.deleteMany(),
    prisma.school.deleteMany(),
    prisma.ugel.deleteMany(),
    prisma.dre.deleteMany(),
  ]);
}
