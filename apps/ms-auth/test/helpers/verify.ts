import { createPublicKey } from 'node:crypto';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { INestApplication } from '@nestjs/common';

// Verifica un access token con la JWKS publicada, como lo haría otro servicio.
export async function verifyWithJwks(app: INestApplication, token: string): Promise<jwt.JwtPayload> {
  const { body } = await request(app.getHttpServer()).get('/.well-known/jwks.json');
  const { header } = jwt.decode(token, { complete: true })!;
  const jwk = body.keys.find((k: { kid: string }) => k.kid === header.kid);
  const pem = createPublicKey({ key: jwk, format: 'jwk' });
  return jwt.verify(token, pem, { algorithms: ['RS256'], issuer: 'hacktheandes-auth' }) as jwt.JwtPayload;
}
