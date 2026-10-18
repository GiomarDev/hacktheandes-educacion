import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import jwt from 'jsonwebtoken';
import { JwksKeyResolver } from './jwks-key-resolver.js';
import { IS_PUBLIC, ROLES } from './roles.decorator.js';
import { AuthUser, JWT_ISSUER, Role, RoleClaim } from './roles.js';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly keys: JwksKeyResolver,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const targets = [context.getHandler(), context.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, targets)) return true;

    const request = context.switchToHttp().getRequest();
    const user = await this.authenticate(request.headers.authorization);
    request.user = user;

    const required = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES, targets);
    if (required?.length && !user.roles.some((claim) => required.includes(claim.role))) {
      throw new ForbiddenException('No tiene permiso para esta acción');
    }
    return true;
  }

  private async authenticate(header: string | undefined): Promise<AuthUser> {
    const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
    if (!token) throw new UnauthorizedException('Falta el token de acceso');
    try {
      const decoded = jwt.decode(token, { complete: true });
      const kid = decoded?.header.kid;
      if (!kid || decoded.header.alg !== 'RS256') throw new Error('cabecera inválida');
      const publicKey = await this.keys.getSigningKey(kid);
      const payload = jwt.verify(token, publicKey, { algorithms: ['RS256'], issuer: JWT_ISSUER }) as jwt.JwtPayload;
      return { id: payload.sub!, name: payload.name, roles: (payload.roles ?? []) as RoleClaim[] };
    } catch {
      throw new UnauthorizedException('Token inválido o vencido');
    }
  }
}
