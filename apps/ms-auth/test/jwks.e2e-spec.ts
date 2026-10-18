import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma.service.js';
import { createAuthApp } from './helpers/app.js';

describe('GET /.well-known/jwks.json', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    ({ app, prisma } = await createAuthApp());
    await prisma.signingKey.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  it('publica una llave RS256 y no la regenera en cada llamada', async () => {
    const first = await request(app.getHttpServer()).get('/.well-known/jwks.json').expect(200);
    expect(first.body.keys).toHaveLength(1);
    const [key] = first.body.keys;
    expect(key).toMatchObject({ kty: 'RSA', alg: 'RS256', use: 'sig' });
    expect(key.kid).toBeTruthy();
    expect(key.d).toBeUndefined();

    const second = await request(app.getHttpServer()).get('/.well-known/jwks.json').expect(200);
    expect(second.body.keys.map((k: { kid: string }) => k.kid)).toEqual([key.kid]);
  });
});
