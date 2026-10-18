import { ArgumentsHost, Catch, ConflictException, ExceptionFilter, HttpException, NotFoundException } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';

// Traduce errores conocidos de Prisma a respuestas HTTP. Cada servicio tiene su propio cliente,
// así que se reconocen por el código y no por la clase.
@Catch()
export class PrismaErrorFilter extends BaseExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const code = (exception as { code?: string })?.code;
    if (!(exception instanceof HttpException) && code === 'P2002') {
      return super.catch(new ConflictException('Ya existe un registro con esos datos'), host);
    }
    if (!(exception instanceof HttpException) && code === 'P2025') {
      return super.catch(new NotFoundException('Registro no encontrado'), host);
    }
    super.catch(exception, host);
  }
}
