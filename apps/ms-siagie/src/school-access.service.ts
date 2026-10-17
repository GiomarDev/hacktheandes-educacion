import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { canAccessSchool } from '@app/common';
import type { AuthUser, Role } from '@app/common';
import { PrismaService } from './prisma.service.js';

// Punto único donde se decide si un usuario puede tocar los datos de una IE.
@Injectable()
export class SchoolAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async assertSchool(user: AuthUser, schoolId: string, roles?: Role[]) {
    const school = await this.prisma.school.findUnique({ where: { id: schoolId }, include: { ugel: true } });
    if (!school) throw new NotFoundException('IE no encontrada');
    this.check(user, { id: school.id, ugelId: school.ugelId, dreId: school.ugel.dreId }, roles);
    return school;
  }

  async assertSection(user: AuthUser, sectionId: string, roles?: Role[]) {
    const section = await this.prisma.section.findUnique({
      where: { id: sectionId },
      include: { school: { include: { ugel: true } } },
    });
    if (!section) throw new NotFoundException('Sección no encontrada');
    this.check(user, { id: section.schoolId, ugelId: section.school.ugelId, dreId: section.school.ugel.dreId }, roles);
    return section;
  }

  async assertEnrollment(user: AuthUser, enrollmentId: string, roles?: Role[]) {
    const enrollment = await this.prisma.enrollment.findUnique({ where: { id: enrollmentId } });
    if (!enrollment) throw new NotFoundException('Matrícula no encontrada');
    const section = await this.assertSection(user, enrollment.sectionId, roles);
    return { ...enrollment, section };
  }

  async assertStudent(user: AuthUser, studentId: string, roles?: Role[]) {
    const enrollment = await this.currentEnrollment(studentId);
    if (!enrollment) throw new NotFoundException('El estudiante no tiene matrícula vigente');
    return this.assertEnrollment(user, enrollment.id, roles);
  }

  currentEnrollment(studentId: string) {
    return this.prisma.enrollment.findFirst({ where: { studentId }, orderBy: { year: 'desc' } });
  }

  private check(user: AuthUser, school: { id: string; ugelId: string; dreId: string }, roles?: Role[]): void {
    if (!canAccessSchool(user, school, roles)) throw new ForbiddenException('No tiene acceso a esta IE');
  }
}
