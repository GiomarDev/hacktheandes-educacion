import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service.js';

// La carrera entre dos refresh se cubre en e2e; aquí se simula la petición que espera el candado
// de la familia y, al obtenerlo, encuentra el token ya rotado por la otra.
describe('AuthService.refresh cuando pierde la carrera de rotación', () => {
  it('toma el candado de la familia, la revoca entera y registra la reutilización', async () => {
    const locks: unknown[] = [];
    const updateManyCalls: unknown[] = [];
    const created: unknown[] = [];
    const events: string[] = [];
    const tx = {
      $executeRaw: async (_sql: TemplateStringsArray, ...values: unknown[]) => locks.push(...values),
      refreshToken: {
        findUniqueOrThrow: async () => ({
          id: 't1',
          userId: 'u1',
          familyId: 'fam-1',
          revokedAt: new Date(),
          expiresAt: new Date(Date.now() + 60_000),
          user: { status: 'ACTIVE', roles: [] },
        }),
        updateMany: async (args: { where: unknown }) => {
          updateManyCalls.push(args.where);
          return { count: 1 };
        },
        create: async (args: unknown) => created.push(args),
      },
    };
    const prisma = {
      refreshToken: { findUnique: async () => ({ id: 't1', familyId: 'fam-1' }) },
      $transaction: async (fn: (client: typeof tx) => Promise<unknown>) => fn(tx),
      authEvent: { create: async ({ data }: { data: { type: string } }) => events.push(data.type) },
    };
    const service = new AuthService(prisma as never, {} as never);

    await expect(service.refresh('token', {})).rejects.toBeInstanceOf(UnauthorizedException);
    expect(locks).toEqual(['fam-1']);
    expect(updateManyCalls).toEqual([{ familyId: 'fam-1', revokedAt: null }]);
    expect(created).toEqual([]);
    expect(events).toEqual(['TOKEN_REUSE_DETECTED']);
  });
});
