import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import type { AuthUser } from '@app/common';
import { PrismaService } from '../prisma.service.js';
import { SchoolAccessService } from '../school-access.service.js';
import { AccessEventDto } from './access.dto.js';

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

@Injectable()
export class QrService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: SchoolAccessService,
  ) {}

  // El token se entrega una sola vez (para imprimir el carné); se guarda solo su hash.
  async issue(user: AuthUser, studentId: string): Promise<{ token: string }> {
    await this.access.assertStudent(user, studentId, ['DIRECTOR', 'SECRETARY']);
    const token = randomBytes(32).toString('base64url');
    await this.prisma.$transaction([
      this.prisma.qrCredential.updateMany({ where: { studentId, revokedAt: null }, data: { revokedAt: new Date() } }),
      this.prisma.qrCredential.create({ data: { studentId, tokenHash: hashToken(token) } }),
    ]);
    return { token };
  }

  async registerAccess(user: AuthUser, dto: AccessEventDto) {
    if (!!dto.token === !!dto.studentId) throw new BadRequestException('Envíe token o studentId, no ambos');
    let studentId = dto.studentId;
    if (dto.token) {
      const credential = await this.prisma.qrCredential.findUnique({ where: { tokenHash: hashToken(dto.token) } });
      if (!credential || credential.revokedAt) throw new NotFoundException('Carné no válido');
      studentId = credential.studentId;
    }
    const enrollment = await this.access.assertStudent(user, studentId!, ['AUXILIAR', 'DIRECTOR', 'SECRETARY']);
    const event = await this.prisma.accessEvent.create({
      data: {
        studentId: studentId!,
        schoolId: enrollment.section.schoolId,
        type: dto.type,
        method: dto.token ? 'QR' : 'MANUAL',
        deviceId: dto.deviceId,
        recordedByUserId: user.id,
      },
    });
    return { id: event.id, studentId: event.studentId, type: event.type, occurredAt: event.occurredAt };
  }
}
