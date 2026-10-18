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
