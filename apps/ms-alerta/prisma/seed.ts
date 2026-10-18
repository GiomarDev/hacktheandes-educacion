import 'dotenv/config';
import { pathToFileURL } from 'node:url';
import { PrismaService } from '../src/prisma.service.js';
import { DEFAULT_RULES } from '../src/rules/risk-rules.js';

export async function seedRules(prisma: PrismaService) {
  await prisma.riskRule.createMany({
    data: DEFAULT_RULES.map((rule) => ({
      ...rule,
      params: { ...rule.params },
    })),
    skipDuplicates: true,
  });
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const prisma = new PrismaService();
  try {
    await seedRules(prisma);
  } finally {
    await prisma.$disconnect();
  }
  console.log('ms-alerta: reglas iniciales listas');
}
