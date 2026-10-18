import { HttpException, HttpStatus, Injectable, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import argon2 from 'argon2';
import { PrismaService } from '../prisma.service.js';
import { ACCESS_TOKEN_TTL_SECONDS, hashRefreshToken, RequestMeta, TokensService } from './tokens.service.js';
import { LoginDto } from './dto/login.dto.js';
import type { AuthEventType } from '../generated/prisma/client.js';
import type { Role } from '@app/common';

export const MAX_FAILED_ATTEMPTS = 5;
export const LOCK_MINUTES = 15;

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export const invalidCredentials = () => new UnauthorizedException('Credenciales inválidas');

// Límite por IP, además del bloqueo por cuenta: frena a quien prueba muchos DNI desde la misma conexión.
export const IP_MAX_FAILURES = 20;
export const IP_WINDOW_MS = 15 * 60000;

export class TooManyLoginAttemptsException extends HttpException {
  constructor(readonly retryAfterSeconds: number) {
    super('Demasiados intentos desde esta conexión. Intente más tarde.', HttpStatus.TOO_MANY_REQUESTS);
  }
}

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
    // En paralelo con la búsqueda del usuario: la comprobación de IP no retrasa el resto del login.
    const [retryAfter, user] = await Promise.all([
      this.ipRetryAfter(meta.ip),
      this.prisma.user.findUnique({
        where: { documentType_documentNumber: { documentType: dto.documentType, documentNumber: dto.documentNumber } },
        include: { roles: true },
      }),
    ]);
    if (retryAfter) throw new TooManyLoginAttemptsException(retryAfter);
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
      await this.registerFailedAttempt(user.id, now, meta);
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

  // Segundos hasta que la IP vuelva a tener menos de IP_MAX_FAILURES fallos en la ventana; 0 si puede intentar.
  async ipRetryAfter(ip: string | undefined, now = new Date()): Promise<number> {
    if (!ip) return 0;
    const limiting = await this.prisma.authEvent.findFirst({
      where: { ip, type: 'LOGIN_FAILED', occurredAt: { gt: new Date(now.getTime() - IP_WINDOW_MS) } },
      orderBy: { occurredAt: 'desc' },
      skip: IP_MAX_FAILURES - 1,
      select: { occurredAt: true },
    });
    if (!limiting) return 0;
    return Math.max(1, Math.ceil((limiting.occurredAt.getTime() + IP_WINDOW_MS - now.getTime()) / 1000));
  }

  async onboarding(userId: string): Promise<{ completedRoles: Role[] }> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { onboardedRoles: true } });
    return { completedRoles: user.onboardedRoles };
  }

  // Lectura y escritura bajo un candado por cuenta, para no perder un rol si llegan dos a la vez.
  async setOnboarded(userId: string, role: Role, done: boolean): Promise<{ completedRoles: Role[] }> {
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`onboarding:${userId}`}))`;
      const { onboardedRoles } = await tx.user.findUniqueOrThrow({ where: { id: userId }, select: { onboardedRoles: true } });
      const next = done ? [...new Set([...onboardedRoles, role])] : onboardedRoles.filter((r) => r !== role);
      const saved = await tx.user.update({ where: { id: userId }, data: { onboardedRoles: next }, select: { onboardedRoles: true } });
      return { completedRoles: saved.onboardedRoles };
    });
  }

  async event(userId: string | null, type: AuthEventType, meta: RequestMeta): Promise<void> {
    await this.prisma.authEvent.create({
      data: { userId, type, ip: meta.ip, userAgent: meta.userAgent?.slice(0, 255) },
    });
  }

  async refresh(refreshToken: string, meta: RequestMeta): Promise<TokenPair> {
    const found = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: hashRefreshToken(refreshToken) },
      select: { id: true, familyId: true },
    });
    if (!found) throw invalidCredentials();
    // La rotación de una familia va bajo un candado: si dos peticiones usan el mismo token, la segunda
    // espera a que la primera emita el suyo y, al ver el token ya rotado, revoca también ese.
    const outcome = await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${found.familyId}))`;
      const stored = await tx.refreshToken.findUniqueOrThrow({
        where: { id: found.id },
        include: { user: { include: { roles: true } } },
      });
      if (stored.revokedAt) {
        // Un token ya rotado se volvió a usar: alguien lo copió. Se corta toda la sesión.
        await tx.refreshToken.updateMany({
          where: { familyId: stored.familyId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
        return { kind: 'reused' as const, stored };
      }
      if (stored.expiresAt <= new Date() || stored.user.status !== 'ACTIVE') return { kind: 'invalid' as const, stored };
      await tx.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });
      const token = await this.tokens.issueRefreshToken(stored.userId, stored.familyId, meta, tx);
      return { kind: 'rotated' as const, stored, token };
    });
    if (outcome.kind === 'reused') {
      await this.event(outcome.stored.userId, 'TOKEN_REUSE_DETECTED', meta);
      throw invalidCredentials();
    }
    if (outcome.kind === 'invalid') throw invalidCredentials();
    await this.event(outcome.stored.userId, 'REFRESH', meta);
    return {
      accessToken: await this.tokens.issueAccessToken(outcome.stored.user),
      refreshToken: outcome.token,
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

  private async registerFailedAttempt(userId: string, now: Date, meta: RequestMeta): Promise<void> {
    // Incremento atómico: los intentos en paralelo se cuentan todos.
    const { failedLoginAttempts } = await this.prisma.user.update({
      where: { id: userId },
      data: { failedLoginAttempts: { increment: 1 } },
      select: { failedLoginAttempts: true },
    });
    await this.event(userId, 'LOGIN_FAILED', meta);
    if (failedLoginAttempts < MAX_FAILED_ATTEMPTS) return;
    // También se vuelve a bloquear si el bloqueo anterior ya venció.
    const locked = await this.prisma.user.updateMany({
      where: {
        id: userId,
        OR: [{ status: { not: 'LOCKED' } }, { lockedUntil: null }, { lockedUntil: { lte: now } }],
      },
      data: { status: 'LOCKED', lockedUntil: new Date(now.getTime() + LOCK_MINUTES * 60000) },
    });
    if (locked.count > 0) await this.event(userId, 'LOCKED', meta);
  }

  private async revokeFamily(familyId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string, meta: RequestMeta): Promise<void> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    // Mismo límite de intentos que el login: si no, aquí se podría adivinar la contraseña sin bloqueo.
    if (user.status !== 'ACTIVE') throw invalidCredentials();
    if (!(await argon2.verify(user.passwordHash, currentPassword))) {
      await this.registerFailedAttempt(userId, new Date(), meta);
      throw invalidCredentials();
    }
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
