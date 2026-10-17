import { PrismaService } from '../src/prisma.service.js';

describe('esquema Prisma de ms-auth', () => {
  const prisma = new PrismaService();

  beforeAll(async () => {
    await prisma.onModuleInit();
  });

  afterAll(async () => {
    await prisma.onModuleDestroy();
  });

  beforeEach(async () => {
    await prisma.userRole.deleteMany();
    await prisma.user.deleteMany();
  });

  const userData = {
    documentType: 'DNI' as const,
    documentNumber: '70000001',
    firstName: 'Ana',
    lastName: 'Prueba',
    passwordHash: 'x',
  };

  it('crea y lee un usuario por documento', async () => {
    await prisma.user.create({ data: userData });
    const found = await prisma.user.findUnique({
      where: { documentType_documentNumber: { documentType: 'DNI', documentNumber: '70000001' } },
    });
    expect(found?.firstName).toBe('Ana');
    expect(found?.status).toBe('ACTIVE');
  });

  it('rechaza un documento duplicado con P2002', async () => {
    await prisma.user.create({ data: userData });
    await expect(prisma.user.create({ data: userData })).rejects.toMatchObject({ code: 'P2002' });
  });

  it('no permite el mismo rol dos veces aunque el alcance tenga nulos', async () => {
    const user = await prisma.user.create({ data: userData });
    await prisma.userRole.create({ data: { userId: user.id, role: 'MINEDU_ADMIN' } });
    await expect(prisma.userRole.create({ data: { userId: user.id, role: 'MINEDU_ADMIN' } })).rejects.toMatchObject({
      code: 'P2002',
    });
  });

  it('asocia roles al usuario', async () => {
    const user = await prisma.user.create({ data: userData });
    await prisma.userRole.create({
      data: { userId: user.id, role: 'DIRECTOR', schoolId: '019a0000-0000-7000-8000-000000000001' },
    });
    const withRoles = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      include: { roles: true },
    });
    expect(withRoles.roles).toHaveLength(1);
  });
});
