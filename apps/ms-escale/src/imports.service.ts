import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import type { AuthUser } from '@app/common';
import { readCsv } from './datasets/csv.js';
import { DatasetError, parseDataset } from './datasets/parsers.js';
import type { ImportDto } from './api.dto.js';
import { PrismaService } from './prisma.service.js';

function periodFromFileName(fileName: string): string | undefined {
  const match = /(\d{4})[_-](\d{4})/.exec(fileName);
  return match ? `${match[1]}-${match[2]}` : undefined;
}

@Injectable()
export class ImportsService {
  constructor(private readonly prisma: PrismaService) {}

  async import(user: AuthUser, dto: ImportDto) {
    let values;
    try {
      values = parseDataset(dto.dataset, dto.content, {
        period: dto.period ?? periodFromFileName(dto.fileName),
      });
    } catch (error) {
      if (error instanceof DatasetError)
        throw new BadRequestException(error.message);
      throw error;
    }
    const checksum = createHash('sha256').update(dto.content).digest('hex');
    if (await this.prisma.datasetImport.findUnique({ where: { checksum } }))
      throw new ConflictException('Este archivo ya fue importado');
    const definitions = await this.prisma.indicatorDefinition.findMany({
      where: { code: { in: [...new Set(values.map((v) => v.code))] } },
    });
    const idOf = new Map(definitions.map((d) => [d.code, d.id]));
    const periods = [...new Set(values.map((v) => v.periodLabel))];
    // Una importación reemplaza los valores de sus indicadores en los periodos que trae.
    const created = await this.prisma.$transaction(
      async (tx) => {
        const record = await tx.datasetImport.create({
          data: {
            dataset: dto.dataset,
            name: dto.name ?? dto.fileName,
            sourceUrl: dto.sourceUrl,
            fileName: dto.fileName,
            checksum,
            rowCount: readCsv(dto.content).length - 1,
            importedBy: user.id,
          },
        });
        await tx.indicatorValue.deleteMany({
          where: {
            indicatorId: { in: [...idOf.values()] },
            periodLabel: { in: periods },
          },
        });
        await tx.indicatorValue.createMany({
          data: values.map(({ code, ...v }) => {
            const indicatorId = idOf.get(code);
            if (!indicatorId)
              throw new Error(`Indicador sin catálogo: ${code}`);
            return { ...v, indicatorId, importId: record.id };
          }),
        });
        return record;
      },
      { timeout: 30000 },
    );
    return {
      id: created.id,
      dataset: created.dataset,
      fileName: created.fileName,
      rowCount: created.rowCount,
      values: values.length,
    };
  }

  list() {
    return this.prisma.datasetImport.findMany({
      orderBy: { importedAt: 'desc' },
    });
  }
}
