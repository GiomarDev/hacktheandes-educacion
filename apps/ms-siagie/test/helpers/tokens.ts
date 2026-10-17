import { createServer, Server } from 'node:http';
import { AddressInfo } from 'node:net';
import { generateKeyPairSync } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { AuthUser, JWT_ISSUER, RoleClaim } from '@app/common';

// Emula a ms-auth en los tests: firma tokens RS256 y publica su JWKS.
const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const KID = 'siagie-test-kid';
let server: Server | undefined;

export async function startTestJwks(): Promise<string> {
  if (!server) {
    const jwk = { ...publicKey.export({ format: 'jwk' }), kid: KID, alg: 'RS256', use: 'sig' };
    server = createServer((_req, res) => {
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ keys: [jwk] }));
    });
    await new Promise<void>((resolve) => server!.listen(0, '127.0.0.1', resolve));
  }
  const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/jwks.json`;
  process.env.AUTH_JWKS_URL = url;
  return url;
}

export function signTestToken(user: Partial<AuthUser> & { roles: RoleClaim[] }): string {
  return jwt.sign({ name: user.name ?? 'Usuario Prueba', roles: user.roles }, privateKey, {
    algorithm: 'RS256',
    keyid: KID,
    subject: user.id ?? '019a0000-0000-7000-8000-0000000000aa',
    issuer: JWT_ISSUER,
    expiresIn: 900,
  });
}

export const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });
