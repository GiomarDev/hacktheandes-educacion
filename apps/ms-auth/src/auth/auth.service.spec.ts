import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service.js';

// La carrera entre dos refresh no se puede forzar contra la base real:
// se simula que otra petición ya revocó el token entre la lectura y la escritura.
describe('AuthService.refresh cuando pierde la carrera de rotación', () => {
  it('revoca toda la familia y registra la reutilización', async () => {
    const updateManyCalls: unknown[] = [];
    const events: string[] = [];
    const prisma = {
      refreshToken: {
        findUnique: async () => ({
          id: 't1',
          userId: 'u1',
          familyId: 'fam-1',
          revokedAt: null,
          expiresAt: new Date(Date.now() + 60_000),
          user: { status: 'ACTIVE', roles: [] },
        }),
        updateMany: async (args: { where: { id?: string; familyId?: string } }) => {
          updateManyCalls.push(args.where);
          return { count: args.where.id ? 0 : 1 };
        },
      },
      authEvent: { create: async ({ data }: { data: { type: string } }) => events.push(data.type) },
    };
    const service = new AuthService(prisma as never, {} as never);

    await expect(service.refresh('token', {})).rejects.toBeInstanceOf(UnauthorizedException);
    expect(updateManyCalls).toContainEqual({ familyId: 'fam-1', revokedAt: null });
    expect(events).toEqual(['TOKEN_REUSE_DETECTED']);
  });
});
