import { ForbiddenException, Injectable } from '@nestjs/common';
import { canAccessSchool } from '@app/common';
import type { AuthUser, Role } from '@app/common';
import { SiagieClient } from './clients.js';

// Ven todos los casos y alertas de su ámbito. Tutores, docentes y auxiliares solo los de sus secciones.
const FULL_READERS: Role[] = [
  'MINEDU_ADMIN',
  'DRE_SPECIALIST',
  'UGEL_SPECIALIST',
  'DIRECTOR',
  'PSYCHOLOGIST',
];
const SECTION_STAFF: Role[] = ['TUTOR', 'TEACHER', 'AUXILIAR'];

@Injectable()
export class ScopeService {
  constructor(private readonly siagie: SiagieClient) {}
  async assertSchool(user: AuthUser, schoolId: string) {
    const school = await this.siagie.school(schoolId);
    if (!canAccessSchool(user, school))
      throw new ForbiddenException('No tiene acceso a esta IE');
    return school;
  }
  // IEs del ámbito de los roles dados (sin restricción de sección).
  async schoolFilter(
    user: AuthUser,
    roles?: Role[],
  ): Promise<{ schoolId?: { in: string[] } }> {
    const claims = user.roles.filter((r) => !roles || roles.includes(r.role));
    if (claims.some((r) => r.role === 'MINEDU_ADMIN')) return {};
    const ids = new Set(
      claims.flatMap((r) => (r.schoolId ? [r.schoolId] : [])),
    );
    for (const claim of claims) {
      const query =
        claim.role === 'UGEL_SPECIALIST' && claim.ugelId
          ? `ugelId=${claim.ugelId}`
          : claim.role === 'DRE_SPECIALIST' && claim.dreId
            ? `dreId=${claim.dreId}`
            : null;
      if (query)
        for (const school of await this.siagie.schoolIds(query))
          ids.add(school.id);
    }
    return { schoolId: { in: [...ids] } };
  }

  // Filtro de lectura de casos (kind 'case') y alertas (kind 'alert').
  async filter(user: AuthUser, kind: 'case' | 'alert') {
    const full = await this.schoolFilter(user, FULL_READERS);
    if (!full.schoolId) return {};
    const staffSchools = user.roles
      .filter((r) => SECTION_STAFF.includes(r.role) && r.schoolId)
      .map((r) => r.schoolId!);
    const sections = staffSchools.length
      ? await this.siagie.staffSections(user.id)
      : [];
    return {
      OR: [
        full,
        {
          schoolId: { in: staffSchools },
          sectionId: { in: sections },
        },
        ...(kind === 'case' ? [{ ownerUserId: user.id }] : []),
      ],
    };
  }

  async assertRead(
    user: AuthUser,
    record: { schoolId: string; sectionId: string | null; ownerUserId: string },
  ) {
    const school = await this.assertSchool(user, record.schoolId);
    if (canAccessSchool(user, school, FULL_READERS)) return;
    if (record.ownerUserId === user.id) return;
    if (
      record.sectionId &&
      user.roles.some(
        (r) => SECTION_STAFF.includes(r.role) && r.schoolId === record.schoolId,
      ) &&
      (await this.siagie.staffSections(user.id)).includes(record.sectionId)
    )
      return;
    throw new ForbiddenException('No tiene a cargo la sección de este caso');
  }

  async assertManage(
    user: AuthUser,
    record: { schoolId: string; ownerUserId: string },
  ) {
    const school = await this.assertSchool(user, record.schoolId);
    if (
      record.ownerUserId === user.id ||
      user.roles.some(
        (r) =>
          r.role === 'MINEDU_ADMIN' ||
          (r.role === 'DIRECTOR' && r.schoolId === record.schoolId) ||
          (r.role === 'UGEL_SPECIALIST' && r.ugelId === school.ugelId) ||
          (r.role === 'DRE_SPECIALIST' && r.dreId === school.dreId),
      )
    )
      return;
    throw new ForbiddenException(
      'Solo el responsable o la autoridad de su ámbito puede gestionar el caso',
    );
  }
}
