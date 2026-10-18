import type { Competency } from '@/features/schools/types';

export type LiteralGrade = 'AD' | 'A' | 'B' | 'C';

export interface GradeSheetRow {
  enrollmentId: string;
  student: {
    id: string;
    firstName: string;
    paternalLastName: string;
    maternalLastName: string;
  };
  entries: {
    competencyId: string;
    columnNumber: number;
    value: LiteralGrade | null;
    isCompensatory: boolean;
  }[];
  periodGrades: {
    competencyId: string;
    value: LiteralGrade | null;
    calculationMethod: string;
    attendanceRate: number;
  }[];
}

export interface GradeSheet {
  area: { id: string; code: string; name: string };
  period: { id: string; type: string; number: number; year: number };
  competencies: Competency[];
  rows: GradeSheetRow[];
}
