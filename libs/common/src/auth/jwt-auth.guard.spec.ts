import { createServer, Server } from 'node:http';
import { AddressInfo } from 'node:net';
import { createHmac, generateKeyPairSync, KeyObject } from 'node:crypto';
import { Controller, Get, INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { HttpJwksKeyResolver, JwksKeyResolver } from './jwks-key-resolver.js';
import { CurrentUser } from './current-user.decorator.js';
import { Public, Roles } from './roles.decorator.js';
import { AuthUser, JWT_ISSUER } from './roles.js';

@Controller()
class ProbeController {
  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return user;
  }

  @Get('only-directors')
  @Roles('DIRECTOR')
  onlyDirectors() {
    return { ok: true };
  }

  @Get('open')
  @Public()
  open() {
    return { ok: true };
  }
}

describe('JwtAuthGuard', () => {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const other = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const kid = 'kid-test';
  let jwksServer: Server;
  let app: INestApplication;

  const sign = (opts: { key?: KeyObject; keyid?: string; expiresIn?: number; roles?: unknown[] } = {}) =>
    jwt.sign({ name: 'Ana', roles: opts.roles ?? [{ role: 'DIRECTOR', schoolId: 's1' }] }, opts.key ?? privateKey, {
      algorithm: 'RS256',
      keyid: opts.keyid ?? kid,
      subject: 'user-1',
      issuer: JWT_ISSUER,
      expiresIn: opts.expiresIn ?? 900,
    });
  const get = (path: string, token?: string) => {
    const req = request(app.getHttpServer()).get(path);
    return token ? req.set('Authorization', `Bearer ${token}`) : req;
  };

  beforeAll(async () => {
    const jwk = { ...publicKey.export({ format: 'jwk' }), kid, alg: 'RS256', use: 'sig' };
    jwksServer = createServer((_req, res) => {
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ keys: [jwk] }));
    });
    await new Promise<void>((resolve) => jwksServer.listen(0, resolve));
    const url = `http://127.0.0.1:${(jwksServer.address() as AddressInfo).port}/jwks.json`;

    const moduleRef = await Test.createTestingModule({
      controllers: [ProbeController],
      providers: [
        { provide: JwksKeyResolver, useValue: new HttpJwksKeyResolver(url) },
        { provide: APP_GUARD, useClass: JwtAuthGuard },
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    jwksServer.closeAllConnections();
    jwksServer.close();
  });

  it('token válido: deja el usuario en la petición', async () => {
    const res = await get('/me', sign()).expect(200);
    expect(res.body).toEqual({ id: 'user-1', name: 'Ana', roles: [{ role: 'DIRECTOR', schoolId: 's1' }] });
  });

  it('sin token: 401', async () => {
    await get('/me').expect(401);
  });

  it('firmado con otra llave: 401', async () => {
    await get('/me', sign({ key: other.privateKey })).expect(401);
  });

  it('vencido: 401', async () => {
    await get('/me', sign({ expiresIn: -10 })).expect(401);
  });

  it('kid desconocido: 401', async () => {
    await get('/me', sign({ keyid: 'otro-kid' })).expect(401);
  });

  it('HS256 con la llave pública como secreto: 401', async () => {
    // Ataque clásico: firmar HS256 usando la llave pública como secreto.
    const pem = publicKey.export({ type: 'spki', format: 'pem' }).toString();
    const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
    const body = `${b64({ alg: 'HS256', typ: 'JWT', kid })}.${b64({ sub: 'x', name: 'X', roles: [], iss: JWT_ISSUER, exp: Math.floor(Date.now() / 1000) + 900 })}`;
    const forged = `${body}.${createHmac('sha256', pem).update(body).digest('base64url')}`;
    await get('/me', forged).expect(401);
  });

  it('sin el rol requerido: 403', async () => {
    await get('/only-directors', sign({ roles: [{ role: 'TEACHER', schoolId: 's1' }] })).expect(403);
    await get('/only-directors', sign()).expect(200);
  });

  it('ruta pública: no pide token', async () => {
    await get('/open').expect(200);
  });

  it('con el servidor JWKS caído, la llave en caché sigue verificando', async () => {
    await get('/me', sign()).expect(200);
    jwksServer.closeAllConnections();
    await new Promise<void>((resolve) => jwksServer.close(() => resolve()));
    await get('/me', sign()).expect(200);
  });
});
