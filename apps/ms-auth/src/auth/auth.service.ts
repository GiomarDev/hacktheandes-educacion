import { Injectable, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import argon2 from 'argon2';
import { PrismaService } from '../prisma.service.js';
import { ACCESS_TOKEN_TTL_SECONDS, RequestMeta, TokensService } from './tokens.service.js';
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
      const attempts = user.failedLoginAttempts + 1;
      const lock = attempts >= MAX_FAILED_ATTEMPTS;
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: attempts,
          ...(lock && { status: 'LOCKED', lockedUntil: new Date(now.getTime() + LOCK_MINUTES * 60000) }),
        },
      });
      await this.event(user.id, 'LOGIN_FAILED', meta);
      if (lock) await this.event(user.id, 'LOCKED', meta);
      throw invalidCredentials();
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, status: 'ACTIVE', lockedUntil: null, lastLoginAt: now },
    });
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
}
