import { BadRequestException } from '@nestjs/common';
import { dateOnly } from '../time/lima-date.js';

// Fechas civiles de Lima: las marcas de tiempo usan límites UTC -05:00.
export function reportingRange(from: string, to: string) {
  const start = dateOnly(from);
  const end = dateOnly(to);
  if (
    !Number.isFinite(start.getTime()) ||
    !Number.isFinite(end.getTime()) ||
    start.toISOString().slice(0, 10) !== from ||
    end.toISOString().slice(0, 10) !== to ||
    from > to ||
    from.slice(0, 4) !== to.slice(0, 4)
  )
    throw new BadRequestException('Rango de fechas inválido');
  return {
    dates: { gte: start, lte: end },
    timestamps: {
      gte: new Date(`${from}T00:00:00-05:00`),
      lt: new Date(new Date(`${to}T00:00:00-05:00`).getTime() + 86400000),
    },
  };
}
