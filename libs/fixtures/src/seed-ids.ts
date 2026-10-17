// UUID fijos que comparten los seeds de ms-auth y ms-siagie, para que los roles apunten a la IE sembrada.
// Todos los datos sembrados son sintéticos.
const id = (n: number) =>
  `01920000-0000-7000-8000-${n.toString(16).padStart(12, '0')}`;

export const SEED_IDS = {
  dreUcayali: id(0x01),
  ugelCoronelPortillo: id(0x02),
  school: id(0x03),
  sections: { a1: id(0x10), b1: id(0x11) },
  users: {
    admin: id(0x100),
    ugelSpecialist: id(0x101),
    director: id(0x102),
    secretary: id(0x103),
    tutorA: id(0x104),
    tutorB: id(0x105),
    teacherMat: id(0x106),
    teacherCom: id(0x107),
    auxiliar: id(0x108),
    psychologist: id(0x109),
  },
  documents: {
    admin: '70000100',
    ugelSpecialist: '70000101',
    director: '70000102',
    secretary: '70000103',
    tutorA: '70000104',
    tutorB: '70000105',
    teacherMat: '70000106',
    teacherCom: '70000107',
    auxiliar: '70000108',
    psychologist: '70000109',
  },
} as const;

// IDs derivados para filas en lote (estudiantes, apoderados, matrículas).
export const seedRowId = (kind: 1 | 2 | 3 | 4, n: number) =>
  `01920000-0000-7000-800${kind}-${n.toString(16).padStart(12, '0')}`;
