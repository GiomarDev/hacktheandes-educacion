import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { requireEnv } from '@app/common';

export interface DiagnosisContext {
  id: string;
  schoolId: string;
  studentId: string;
  year: number;
}
export class DiagnosisCipher {
  constructor(private readonly key: Buffer) {
    if (key.length !== 32)
      throw new Error('SIMON requiere una clave de cifrado de 32 bytes');
  }
  private aad(c: DiagnosisContext) {
    return Buffer.from(JSON.stringify([c.id, c.schoolId, c.studentId, c.year]));
  }
  encrypt(value: string, context: DiagnosisContext) {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    cipher.setAAD(this.aad(context));
    const ciphertext = Buffer.concat([
      cipher.update(value, 'utf8'),
      cipher.final(),
    ]);
    return [
      'v1',
      iv.toString('base64url'),
      cipher.getAuthTag().toString('base64url'),
      ciphertext.toString('base64url'),
    ].join('.');
  }
  decrypt(value: string, context: DiagnosisContext) {
    const [version, iv, tag, ciphertext, extra] = value.split('.');
    if (
      version !== 'v1' ||
      !iv ||
      !tag ||
      ciphertext === undefined ||
      extra !== undefined
    )
      throw new Error('Formato cifrado inválido');
    const decipher = createDecipheriv(
      'aes-256-gcm',
      this.key,
      Buffer.from(iv, 'base64url'),
    );
    decipher.setAAD(this.aad(context));
    decipher.setAuthTag(Buffer.from(tag, 'base64url'));
    return Buffer.concat([
      decipher.update(Buffer.from(ciphertext, 'base64url')),
      decipher.final(),
    ]).toString('utf8');
  }
}
@Injectable()
export class DiagnosisService extends DiagnosisCipher {
  constructor() {
    super(Buffer.from(requireEnv('SIMON_DATA_ENCRYPTION_SECRET'), 'base64'));
  }
  override decrypt(value: string, context: DiagnosisContext) {
    try {
      return super.decrypt(value, context);
    } catch {
      throw new ServiceUnavailableException(
        'El diagnóstico no está disponible',
      );
    }
  }
}
