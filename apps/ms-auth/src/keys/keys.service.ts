import { Injectable } from '@nestjs/common';
import { createPublicKey, generateKeyPairSync, randomUUID } from 'node:crypto';
import { requireEnv } from '@app/common';
import { PrismaService } from '../prisma.service.js';
import { decryptPrivateKey, encryptPrivateKey } from './key-crypto.js';

// Las llaves rotadas se siguen publicando mientras pueda haber access tokens firmados con ellas.
const ACCESS_TOKEN_TTL_SECONDS = 900;

@Injectable()
export class KeysService {
  private cached?: { kid: string; privateKeyPem: string };

  constructor(private readonly prisma: PrismaService) {}

  async getActiveSigningKey(): Promise<{ kid: string; privateKeyPem: string }> {
    if (this.cached) return this.cached;
    const secret = requireEnv('KEY_ENCRYPTION_SECRET');
    let key = await this.prisma.signingKey.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
    if (!key) {
      const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
      key = await this.prisma.signingKey.create({
        data: {
          kid: randomUUID(),
          publicKey: publicKey.export({ type: 'spki', format: 'pem' }).toString(),
          privateKeyEncrypted: encryptPrivateKey(
            privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(),
            secret,
          ),
        },
      });
    }
    this.cached = { kid: key.kid, privateKeyPem: decryptPrivateKey(key.privateKeyEncrypted, secret) };
    return this.cached;
  }

  async getJwks(): Promise<{ keys: JsonWebKey[] }> {
    await this.getActiveSigningKey();
    const keys = await this.prisma.signingKey.findMany({
      where: { OR: [{ isActive: true }, { rotatedAt: { gte: this.rotationCutoff() } }] },
    });
    return {
      keys: keys.map((k) => ({
        ...createPublicKey(k.publicKey).export({ format: 'jwk' }),
        kid: k.kid,
        alg: 'RS256',
        use: 'sig',
      })),
    };
  }

  async getPublicKeyPem(kid: string): Promise<string | null> {
    const key = await this.prisma.signingKey.findFirst({
      where: { kid, OR: [{ isActive: true }, { rotatedAt: { gte: this.rotationCutoff() } }] },
    });
    return key?.publicKey ?? null;
  }

  private rotationCutoff(): Date {
    return new Date(Date.now() - ACCESS_TOKEN_TTL_SECONDS * 1000);
  }
}
