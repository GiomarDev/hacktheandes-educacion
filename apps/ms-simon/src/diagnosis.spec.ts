import { randomBytes } from 'node:crypto';
import { DiagnosisCipher } from './diagnosis.service.js';
const context = {
  id: 'plan',
  schoolId: 'school',
  studentId: 'student',
  year: 2026,
};
describe('diagnóstico cifrado', () => {
  const cipher = new DiagnosisCipher(randomBytes(32));
  it('conserva Unicode y usa un nonce distinto para cada escritura', () => {
    const first = cipher.encrypt('Evaluación sensible: atención', context);
    expect(first).not.toContain('atención');
    expect(cipher.decrypt(first, context)).toBe(
      'Evaluación sensible: atención',
    );
    expect(cipher.encrypt('Evaluación sensible: atención', context)).not.toBe(
      first,
    );
  });
  it('rechaza una clave que no tenga 32 bytes', () =>
    expect(() => new DiagnosisCipher(randomBytes(31))).toThrow('32 bytes'));
  it('no permite copiar el diagnóstico a otro plan, estudiante, IE o año', () => {
    const value = cipher.encrypt('privado', context);
    for (const field of ['id', 'schoolId', 'studentId', 'year']) {
      expect(() =>
        cipher.decrypt(value, {
          ...context,
          [field]: field === 'year' ? 2025 : 'otro',
        }),
      ).toThrow();
    }
  });
  it('detecta un ciphertext alterado y una clave diferente', () => {
    const value = cipher.encrypt('privado', context);
    const parts = value.split('.');
    parts[3] = Buffer.from('alterado').toString('base64url');
    expect(() => cipher.decrypt(parts.join('.'), context)).toThrow();
    expect(() =>
      new DiagnosisCipher(randomBytes(32)).decrypt(value, context),
    ).toThrow();
  });
  it('rechaza versiones y segmentos inválidos', () => {
    for (const value of ['plaintext', 'v2.a.b.c', 'v1.a.b.c.extra', 'v1..b.c'])
      expect(() => cipher.decrypt(value, context)).toThrow();
  });
});
