import type { Role } from '../auth/roles';

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

export interface AcademicPeriod {
  id: string;
  schoolId: string;
  year: number;
  type: 'BIMESTER' | 'TRIMESTER';
  number: number;
  startDate: string;
  endDate: string;
}

export interface Competency {
  id: string;
  code: string;
  name: string;
}

export interface SectionArea {
  id: string;
  code: string;
  name: string;
  level: string;
  competencies: Competency[];
  teacherUserIds: string[];
  mine: boolean;
}

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

export type VisitStatus = 'SCHEDULED' | 'DONE' | 'FEEDBACK_GIVEN';
export interface MonitoringVisit {
  id: string;
  schoolId: string;
  sectionId: string;
  observerUserId: string;
  observedTeacherUserId: string;
  visitedAt: string;
  protocolVersion: string;
  observations: string;
  feedback: string;
  improvementCommitment: string;
  status: VisitStatus;
  createdAt: string;
  updatedAt: string;
}

export interface UserRoleGrant {
  id: string;
  role: Role;
  schoolId: string | null;
  ugelId: string | null;
  dreId: string | null;
}
export interface UserAccount {
  id: string;
  documentType: 'DNI' | 'CE' | 'PASSPORT';
  documentNumber: string;
  firstName: string;
  lastName: string;
  email: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'LOCKED';
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  roles: UserRoleGrant[];
}

export interface RiskRule {
  id: string;
  code: string;
  type: string;
  params: Record<string, number>;
  severity: Severity;
  schoolId: string | null;
  isActive: boolean;
  updatedAt: string;
}

export type DocumentStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export interface GeneratedDocument {
  id: string;
  schoolId: string;
  ownerUserId: string;
  title: string;
  category: string | null;
  format: 'WORD' | 'EXCEL';
  source: 'WHATSAPP';
  status: DocumentStatus;
  reviewedAt: string | null;
  correctionFileName: string | null;
  correctionMimeType: string | null;
  correctionSizeBytes: number | null;
  correctionUploadedAt: string | null;
  createdAt: string;
}
