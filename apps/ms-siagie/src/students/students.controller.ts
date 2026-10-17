import { Body, Controller, Post } from '@nestjs/common';
import { dateOnly, Roles } from '@app/common';
import { PrismaService } from '../prisma.service.js';
import { CreateStudentDto } from './students.dto.js';

@Controller('students')
export class StudentsController {
  constructor(private readonly prisma: PrismaService) {}

  // El estudiante aún no pertenece a una IE: el alcance se controla al matricularlo.
  @Post()
  @Roles('DIRECTOR', 'SECRETARY')
  create(@Body() dto: CreateStudentDto) {
    const { guardians, birthDate, ...student } = dto;
    return this.prisma.$transaction(async (tx) => {
      const created = await tx.student.create({ data: { ...student, birthDate: dateOnly(birthDate) } });
      for (const g of guardians) {
        const { relationship, isPrimary, receivesAlerts, ...guardian } = g;
        // Un apoderado ya registrado (quizá por otra IE) solo se vincula: no se cambian su teléfono ni su consentimiento.
        const saved =
          (await tx.guardian.findUnique({
            where: { documentType_documentNumber: { documentType: g.documentType, documentNumber: g.documentNumber } },
          })) ?? (await tx.guardian.create({ data: { ...guardian, optInAt: guardian.whatsappOptIn ? new Date() : null } }));
        await tx.studentGuardian.create({
          data: { studentId: created.id, guardianId: saved.id, relationship, isPrimary, receivesAlerts },
        });
      }
      return created;
    });
  }
}
