import {
  IsDateString,
  IsInt,
  IsOptional,
  IsUUID,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ReportingRangeQuery {
  @IsUUID() schoolId: string;
  @IsDateString({ strict: true }) @Matches(/^\d{4}-\d{2}-\d{2}$/) from: string;
  @IsDateString({ strict: true }) @Matches(/^\d{4}-\d{2}-\d{2}$/) to: string;
}
export class SchoolYearQuery {
  @IsUUID() schoolId: string;
  @Type(() => Number) @IsInt() @Min(1900) @Max(2100) year: number;
}
export class SchoolReportQuery extends ReportingRangeQuery {
  @Type(() => Number) @IsInt() @Min(1900) @Max(2100) year: number;
  @IsOptional() @IsUUID() periodId?: string;
}
export interface PlanStudentContext {
  studentId: string;
  schoolId: string;
  year: number;
  enrollmentId: string;
  status: string;
  sectionId: string;
  tutorUserId: string;
  teacherUserIds: string[];
}
export interface PeriodRef {
  id: string;
  schoolId: string;
  year: number;
  type: string;
  number: number;
  startDate: string;
  endDate: string;
}
export interface SectionRef {
  id: string;
  schoolId: string;
  year: number;
  tutorUserId: string;
  teacherUserIds: string[];
}
export interface SchoolReportSnapshot {
  schoolId: string;
  from: string;
  to: string;
  snapshotAt: string;
  totalEnrollments: number;
  activeEnrollments: number;
  attentionGoal: number;
  sectionsTotal: number;
  reportedSectionDays: number;
  attendance: {
    present: number;
    absent: number;
    late: number;
    justified: number;
    leftEarly: number;
    observedEnrollmentDays: number;
    attendedEnrollmentDays: number;
    rate: number;
  };
  exits: Record<string, number>;
  exitsWithReason: number;
  exitsWithoutReason: number;
  grades: Record<string, number>;
}
export interface AlertReportSnapshot {
  schoolId: string;
  from: string;
  to: string;
  snapshotAt: string;
  alertsDetected: number;
  casesOpened: number;
  currentlyOpenCases: number;
  firstContacts: number;
  averageDaysToFirstContact: number | null;
  casesByStatus: Record<string, number>;
  actionsByType: Record<string, number>;
  notificationsByStatus: Record<string, number>;
  guardianResponses: number;
}
