// Formas de respuesta de los microservicios (solo los campos que usa la interfaz).
export interface School {
  id: string;
  modularCode: string;
  name: string;
  level: 'PRIMARY' | 'SECONDARY' | string;
  management: 'PUBLIC' | 'PRIVATE' | string;
  area: 'URBAN' | 'RURAL' | string;
  ugelId: string;
  ubigeo: string;
  department: string;
  province: string;
  district: string;
  attentionGoal: number;
  hasPsychologist: boolean;
  ugel?: { id: string; code: string; name: string; dreId: string };
}

export interface Section {
  id: string;
  schoolId: string;
  year: number;
  grade: number;
  name: string;
  shift: string;
  tutorUserId: string;
  auxiliarUserId: string | null;
  enrolledCount: number;
  school: { id: string; name: string; modularCode: string };
}

export interface Student {
  id: string;
  studentCode: string;
  documentNumber: string;
  firstName: string;
  paternalLastName: string;
  maternalLastName: string;
  birthDate: string;
  sex: 'F' | 'M' | string;
  hasSpecialNeeds: boolean;
}

export interface Enrollment {
  id: string;
  studentId: string;
  sectionId: string;
  year: number;
  status: string;
  student: Student;
}

export type AttendanceStatus =
  'PRESENT' | 'ABSENT' | 'LATE' | 'JUSTIFIED' | 'LEFT_EARLY';

export interface StudentSummary {
  student: Student;
  enrollment: { id: string; sectionId: string; year: number; status: string };
  attendance: {
    present: number;
    absent: number;
    late: number;
    justified: number;
    rate: number;
  };
  periodGrades: {
    competencyCode: string;
    periodNumber: number;
    value: string | null;
  }[];
}

export type Severity = 'LOW' | 'MEDIUM' | 'HIGH';
export type AlertStatus = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED' | 'DISMISSED';
export interface Alert {
  id: string;
  type: string;
  severity: Severity;
  schoolId: string;
  sectionId: string | null;
  studentId: string | null;
  status: AlertStatus;
  data: Record<string, unknown>;
  detectedAt: string;
  caseId: string | null;
}

export type CaseStatus =
  | 'OPEN'
  | 'CONTACTING'
  | 'CONTACTED'
  | 'REFERRED'
  | 'CLOSED_RETURNED'
  | 'CLOSED_TRANSFERRED'
  | 'CLOSED_DROPPED_OUT';
export interface CaseRecord {
  id: string;
  studentId: string;
  schoolId: string;
  sectionId: string;
  status: CaseStatus;
  ownerUserId: string;
  ownerRole: string;
  escalationLevel: number;
  dueAt: string;
  openedAt: string;
  firstContactAt: string | null;
  closedAt: string | null;
  closeReason: string | null;
}
export interface CaseAction {
  id: string;
  type: string;
  notes: string | null;
  performedByUserId: string | null;
  performedAt: string;
}
export interface CaseNotification {
  id: string;
  channel: string;
  status: string;
  createdAt: string;
}
export interface CaseDetail extends CaseRecord {
  alerts: Alert[];
  actions: CaseAction[];
  notifications: CaseNotification[];
  responses: { id: string; receivedAt: string; body?: string | null }[];
}

export interface IndicatorValue {
  code: string;
  name: string;
  unit: string;
  source: 'OFFICIAL' | 'COMPUTED';
  geoLevel: 'NATIONAL' | 'DRE' | 'UGEL' | 'DISTRICT' | 'SCHOOL';
  geoCode: string;
  geoName: string;
  periodLabel: string;
  dimension: string | null;
  dimensionValue: string | null;
  value: number;
  numerator: number | null;
  denominator: number | null;
}

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
