export interface Report {
  id: string;
  schoolId: string;
  periodId: string | null;
  year: number;
  month: number | null;
  type:
    | 'MONTHLY_FOLLOWUP'
    | 'BIMESTER_ATTENDANCE'
    | 'ATTENTION_GOAL'
    | 'DROPOUT_JUSTIFICATION';
  status: 'DRAFT' | 'SUBMITTED' | 'REVIEWED' | 'OBSERVED';
  revision: number;
  payload: Record<string, unknown>;
  generatedAt?: string;
  submittedAt: string | null;
  reviewedAt: string | null;
  reviewNotes: string | null;
  createdAt: string;
}
