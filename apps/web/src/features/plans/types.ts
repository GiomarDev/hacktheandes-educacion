export type PlanStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

export interface SupportPlan {
  id: string;
  studentId: string;
  schoolId: string;
  year: number;
  tutorUserId: string;
  status: PlanStatus;
  barriers: string;
  strengths: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SupportPlanVersion {
  id: string;
  planId: string;
  periodId: string;
  version: number;
  goals: string[];
  adjustments: string[];
  strategies: string[];
  progressNotes: string | null;
  generatedBy: 'HUMAN' | 'AI_ASSISTED';
  approvedByUserId: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// "diagnosis" solo llega a quien puede leerlo (tutor asignado, psicología, dirección).
export interface SupportPlanDetail extends SupportPlan {
  diagnosis?: string | null;
  versions: SupportPlanVersion[];
}
