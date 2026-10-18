import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

// AES-256-GCM. Formato guardado: iv.tag.ciphertext, cada parte en base64url.
export function encryptPrivateKey(pem: string, secretB64: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', keyFrom(secretB64), iv);
  const ciphertext = Buffer.concat([cipher.update(pem, 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), ciphertext].map((b) => b.toString('base64url')).join('.');
}

export function decryptPrivateKey(blob: string, secretB64: string): string {
  const [iv, tag, ciphertext] = blob.split('.').map((part) => Buffer.from(part, 'base64url'));
  const decipher = createDecipheriv('aes-256-gcm', keyFrom(secretB64), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}

function keyFrom(secretB64: string): Buffer {
  const key = Buffer.from(secretB64, 'base64');
  if (key.length !== 32) throw new Error('KEY_ENCRYPTION_SECRET debe tener 32 bytes en base64');
  return key;
}
