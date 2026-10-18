import { randomBytes } from 'node:crypto';
import { decryptPrivateKey, encryptPrivateKey } from './key-crypto.js';

describe('cifrado de la llave privada', () => {
  const secret = randomBytes(32).toString('base64');
  const pem = '-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----\n';

  it('descifra lo que cifró', () => {
    expect(decryptPrivateKey(encryptPrivateKey(pem, secret), secret)).toBe(pem);
  });

  it('no guarda la llave en claro', () => {
    expect(encryptPrivateKey(pem, secret)).not.toContain('PRIVATE KEY');
  });

  it('falla con otro secreto', () => {
    const other = randomBytes(32).toString('base64');
    expect(() => decryptPrivateKey(encryptPrivateKey(pem, secret), other)).toThrow();
  });
});
