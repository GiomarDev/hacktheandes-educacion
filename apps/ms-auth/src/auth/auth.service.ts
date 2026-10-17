import { Injectable, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import argon2 from 'argon2';
import { PrismaService } from '../prisma.service.js';
import { ACCESS_TOKEN_TTL_SECONDS, hashRefreshToken, RequestMeta, TokensService } from './tokens.service.js';
import { LoginDto } from './dto/login.dto.js';
import type { AuthEventType } from '../generated/prisma/client.js';

export const MAX_FAILED_ATTEMPTS = 5;
export const LOCK_MINUTES = 15;

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export const invalidCredentials = () => new UnauthorizedException('Credenciales inválidas');

@Injectable()
export class AuthService implements OnModuleInit {
  // Se verifica contra este hash cuando el usuario no existe, para no revelar qué DNI están registrados.
  private dummyHash: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokensService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.dummyHash = await argon2.hash('usuario-inexistente', { type: argon2.argon2id });
  }

  async login(dto: LoginDto, meta: RequestMeta): Promise<TokenPair & { mustChangePassword: boolean }> {
    const user = await this.prisma.user.findUnique({
      where: { documentType_documentNumber: { documentType: dto.documentType, documentNumber: dto.documentNumber } },
      include: { roles: true },
    });
    const passwordOk = await argon2.verify(user?.passwordHash ?? this.dummyHash, dto.password);

    if (!user) {
      await this.event(null, 'LOGIN_FAILED', meta);
      throw invalidCredentials();
    }
    const now = new Date();
    const stillLocked = user.status === 'LOCKED' && (!user.lockedUntil || user.lockedUntil > now);
    if (user.status === 'INACTIVE' || stillLocked) {
      await this.event(user.id, 'LOGIN_FAILED', meta);
      throw invalidCredentials();
    }
    if (!passwordOk) {
      // Incremento atómico: los intentos en paralelo se cuentan todos.
      const { failedLoginAttempts } = await this.prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: { increment: 1 } },
        select: { failedLoginAttempts: true },
      });
      await this.event(user.id, 'LOGIN_FAILED', meta);
      if (failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
        // También se vuelve a bloquear si el bloqueo anterior ya venció.
        const locked = await this.prisma.user.updateMany({
          where: {
            id: user.id,
            OR: [{ status: { not: 'LOCKED' } }, { lockedUntil: null }, { lockedUntil: { lte: now } }],
          },
          data: { status: 'LOCKED', lockedUntil: new Date(now.getTime() + LOCK_MINUTES * 60000) },
        });
        if (locked.count > 0) await this.event(user.id, 'LOCKED', meta);
      }
      throw invalidCredentials();
    }

    // Solo se reinicia si nadie bloqueó la cuenta mientras tanto.
    const unlocked = await this.prisma.user.updateMany({
      where: {
        id: user.id,
        OR: [{ status: 'ACTIVE' }, { status: 'LOCKED', lockedUntil: { lte: now } }],
      },
      data: { failedLoginAttempts: 0, status: 'ACTIVE', lockedUntil: null, lastLoginAt: now },
    });
    if (unlocked.count === 0) {
      await this.event(user.id, 'LOGIN_FAILED', meta);
      throw invalidCredentials();
    }
    await this.event(user.id, 'LOGIN_OK', meta);
    return {
      accessToken: await this.tokens.issueAccessToken(user),
      refreshToken: await this.tokens.issueRefreshToken(user.id, undefined, meta),
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
      mustChangePassword: user.mustChangePassword,
    };
  }

  async event(userId: string | null, type: AuthEventType, meta: RequestMeta): Promise<void> {
    await this.prisma.authEvent.create({
      data: { userId, type, ip: meta.ip, userAgent: meta.userAgent?.slice(0, 255) },
    });
  }

  async refresh(refreshToken: string, meta: RequestMeta): Promise<TokenPair> {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: hashRefreshToken(refreshToken) },
      include: { user: { include: { roles: true } } },
    });
    if (!stored) throw invalidCredentials();
    if (stored.revokedAt) {
      // Un token ya rotado se volvió a usar: alguien lo copió. Se corta toda la sesión.
      await this.revokeFamily(stored.familyId);
      await this.event(stored.userId, 'TOKEN_REUSE_DETECTED', meta);
      throw invalidCredentials();
    }
    if (stored.expiresAt <= new Date() || stored.user.status !== 'ACTIVE') throw invalidCredentials();

    const revoked = await this.prisma.refreshToken.updateMany({
      where: { id: stored.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (revoked.count === 0) {
      // Otra petición rotó este mismo token al mismo tiempo: se trata como reutilización.
      await this.revokeFamily(stored.familyId);
      await this.event(stored.userId, 'TOKEN_REUSE_DETECTED', meta);
      throw invalidCredentials();
    }
    await this.event(stored.userId, 'REFRESH', meta);
    return {
      accessToken: await this.tokens.issueAccessToken(stored.user),
      refreshToken: await this.tokens.issueRefreshToken(stored.userId, stored.familyId, meta),
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    };
  }

  async logout(refreshToken: string, meta: RequestMeta): Promise<void> {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: hashRefreshToken(refreshToken) },
    });
    if (!stored) return;
    await this.revokeFamily(stored.familyId);
    await this.event(stored.userId, 'LOGOUT', meta);
  }

  private async revokeFamily(familyId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string, meta: RequestMeta): Promise<void> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!(await argon2.verify(user.passwordHash, currentPassword))) throw invalidCredentials();
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { passwordHash: await argon2.hash(newPassword, { type: argon2.argon2id }), mustChangePassword: false },
      }),
      this.prisma.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } }),
    ]);
    await this.event(userId, 'PASSWORD_CHANGED', meta);
  }
}
