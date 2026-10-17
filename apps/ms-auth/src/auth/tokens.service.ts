import { Injectable } from '@nestjs/common';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { JWT_ISSUER, RoleClaim } from '@app/common';
import { PrismaService } from '../prisma.service.js';
import { KeysService } from '../keys/keys.service.js';
import type { User, UserRole } from '../generated/prisma/client.js';

export const ACCESS_TOKEN_TTL_SECONDS = 900;
export const REFRESH_TOKEN_TTL_SECONDS = 604800;

export interface RequestMeta {
  ip?: string;
  userAgent?: string;
}

export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function toRoleClaims(roles: UserRole[]): RoleClaim[] {
  return roles
    .filter((r) => r.isActive)
    .map((r) => ({
      role: r.role,
      ...(r.schoolId && { schoolId: r.schoolId }),
      ...(r.ugelId && { ugelId: r.ugelId }),
      ...(r.dreId && { dreId: r.dreId }),
    }));
}

@Injectable()
export class TokensService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly keys: KeysService,
  ) {}

  async issueAccessToken(user: User & { roles: UserRole[] }): Promise<string> {
    const { kid, privateKeyPem } = await this.keys.getActiveSigningKey();
    return jwt.sign(
      { name: `${user.firstName} ${user.lastName}`, roles: toRoleClaims(user.roles) },
      privateKeyPem,
      {
        algorithm: 'RS256',
        keyid: kid,
        subject: user.id,
        issuer: JWT_ISSUER,
        expiresIn: ACCESS_TOKEN_TTL_SECONDS,
      },
    );
  }

  async issueRefreshToken(userId: string, familyId: string | undefined, meta: RequestMeta): Promise<string> {
    const token = randomBytes(32).toString('base64url');
    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: hashRefreshToken(token),
        familyId: familyId ?? randomUUID(),
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000),
        ip: meta.ip,
        userAgent: meta.userAgent?.slice(0, 255),
      },
    });
    return token;
  }
}
