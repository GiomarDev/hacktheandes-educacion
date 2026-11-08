import {
  Body,
  ConflictException,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  Injectable,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { CurrentUser, InternalKeyGuard, Public } from '@app/common';
import type { AuthUser } from '@app/common';
import { PrismaService } from './prisma.service.js';
import {
  categoryOf,
  DocumentPreferencesService,
  SavePreferenceDto,
} from './document-preferences.js';

// La corrección puede ser un documento de Office o un PDF de hasta 20 MB.
export const CORRECTION_EXTENSIONS = /\.(docx|doc|xlsx|xls|pdf)$/i;
export const MAX_CORRECTION_BYTES = 20 * 1024 * 1024;

export class CreateDocumentDto {
  @IsUUID() schoolId: string;
  @IsUUID() ownerUserId: string;
  @IsString() @Length(1, 200) title: string;
  @IsOptional() @IsString() @Length(1, 80) category?: string;
  @IsIn(['WORD', 'EXCEL']) format: 'WORD' | 'EXCEL';
}
export class DocumentQuery {
  @IsOptional() @IsIn(['PENDING', 'APPROVED', 'REJECTED']) status?:
    'PENDING' | 'APPROVED' | 'REJECTED';
}
export class PreferenceRecallQuery {
  @IsUUID() ownerUserId: string;
  @IsOptional() @IsString() @Length(1, 80) category?: string;
  @IsOptional() @IsString() @Length(1, 200) title?: string;
}
export class ReviewDocumentDto {
  @IsIn(['APPROVED', 'REJECTED']) status: 'APPROVED' | 'REJECTED';
}
export class CorrectionDto {
  @IsString()
  @Length(1, 200)
  @Matches(CORRECTION_EXTENSIONS, {
    message: 'El archivo debe ser .docx, .doc, .xlsx, .xls o .pdf',
  })
  fileName: string;
  @IsString() @Length(1, 120) mimeType: string;
  @IsInt() @Min(1) @Max(MAX_CORRECTION_BYTES) sizeBytes: number;
}

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly preferences: DocumentPreferencesService,
  ) {}

  create(dto: CreateDocumentDto) {
    return this.prisma.generatedDocument.create({ data: dto });
  }

  // El docente ve los suyos; dirección, los de su IE.
  list(user: AuthUser, q: DocumentQuery) {
    const schools = user.roles.flatMap((r) =>
      r.role === 'DIRECTOR' && r.schoolId ? [r.schoolId] : [],
    );
    return this.prisma.generatedDocument.findMany({
      where: {
        OR: [{ ownerUserId: user.id }, { schoolId: { in: schools } }],
        status: q.status,
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      take: 200,
    });
  }

  private async owned(user: AuthUser, id: string) {
    const doc = await this.prisma.generatedDocument.findUnique({
      where: { id },
    });
    if (!doc) throw new NotFoundException('Documento no encontrado');
    if (doc.ownerUserId !== user.id)
      throw new ForbiddenException(
        'Solo el docente del documento puede revisarlo',
      );
    return doc;
  }

  async review(user: AuthUser, id: string, dto: ReviewDocumentDto) {
    await this.owned(user, id);
    return this.prisma.generatedDocument.update({
      where: { id },
      data: { status: dto.status, reviewedAt: new Date() },
    });
  }

  // El dueño del documento guarda un recordatorio para revisar los próximos de ese tipo.
  async savePreference(user: AuthUser, id: string, dto: SavePreferenceDto) {
    const doc = await this.owned(user, id);
    return this.preferences.save(
      user.id,
      categoryOf(doc.category),
      dto.instruction,
    );
  }

  // Aún no se guarda el archivo: solo su nombre, tipo y tamaño.
  async correction(user: AuthUser, id: string, dto: CorrectionDto) {
    const doc = await this.owned(user, id);
    if (doc.status !== 'REJECTED')
      throw new ConflictException(
        'Solo se adjunta una corrección a un documento no aprobado',
      );
    return this.prisma.generatedDocument.update({
      where: { id },
      data: {
        correctionFileName: dto.fileName,
        correctionMimeType: dto.mimeType,
        correctionSizeBytes: dto.sizeBytes,
        correctionUploadedAt: new Date(),
      },
    });
  }
}

@Public()
@UseGuards(InternalKeyGuard)
@Controller('internal/documents')
export class InternalDocumentsController {
  constructor(private readonly documents: DocumentsService) {}
  @Post() create(@Body() dto: CreateDocumentDto) {
    return this.documents.create(dto);
  }
}

// Gancho opcional para un agente externo con la llave interna; ningún consumidor de este repo lo usa aún.
@Public()
@UseGuards(InternalKeyGuard)
@Controller('internal/documents/preferences')
export class InternalDocumentPreferencesController {
  constructor(private readonly preferences: DocumentPreferencesService) {}
  @Get() recall(@Query() q: PreferenceRecallQuery) {
    return this.preferences.recall(
      q.ownerUserId,
      categoryOf(q.category ?? null),
      q.title,
    );
  }
}

@Controller('documents')
export class DocumentsController {
  constructor(
    private readonly documents: DocumentsService,
    private readonly preferences: DocumentPreferencesService,
  ) {}
  @Get() list(@CurrentUser() u: AuthUser, @Query() q: DocumentQuery) {
    return this.documents.list(u, q);
  }
  // Siempre las del usuario del token: no se acepta otro ID.
  @Get('preferences') listPreferences(@CurrentUser() u: AuthUser) {
    return this.preferences.list(u.id);
  }
  @Delete('preferences/:preferenceId') @HttpCode(204) removePreference(
    @CurrentUser() u: AuthUser,
    @Param('preferenceId', ParseUUIDPipe) preferenceId: string,
  ) {
    return this.preferences.remove(u.id, preferenceId);
  }
  @Post(':id/preference') savePreference(
    @CurrentUser() u: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SavePreferenceDto,
  ) {
    return this.documents.savePreference(u, id, dto);
  }
  @Post(':id/review') @HttpCode(200) review(
    @CurrentUser() u: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewDocumentDto,
  ) {
    return this.documents.review(u, id, dto);
  }
  @Post(':id/correction') @HttpCode(200) correction(
    @CurrentUser() u: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CorrectionDto,
  ) {
    return this.documents.correction(u, id, dto);
  }
}
