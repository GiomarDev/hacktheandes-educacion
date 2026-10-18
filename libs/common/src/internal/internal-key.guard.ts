import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { timingSafeEqual } from 'node:crypto';
import { requireEnv } from '../config/require-env.js';

// Para llamadas entre servicios. Se usa junto con @Public() porque no lleva JWT de usuario.
@Injectable()
export class InternalKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const given = Buffer.from(String(context.switchToHttp().getRequest().headers['x-internal-key'] ?? ''));
    const expected = Buffer.from(requireEnv('INTERNAL_API_KEY'));
    if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
      throw new UnauthorizedException('Llave interna inválida');
    }
    return true;
  }
}
