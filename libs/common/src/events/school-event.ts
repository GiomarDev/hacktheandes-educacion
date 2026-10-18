import { IsDateString, IsIn, IsUUID, Matches } from 'class-validator';

export class SchoolEventDto {
  @IsUUID() id: string;
  @IsIn(['ATTENDANCE_RECORDED', 'ACCESS_RECORDED', 'GRADE_RECORDED'])
  type: string;
  @IsUUID() resourceId: string;
  @IsDateString({ strict: true }) @Matches(/^\d{4}-\d{2}-\d{2}$/) date: string;
}

export interface RiskSchool {
  id: string;
  ugelId: string;
  dreId: string;
  hasPsychologist: boolean;
  attentionGoal: number;
}
export interface RiskStudent {
  studentId: string;
  enrollmentId: string;
  attendance: { date: string; status: string; classSessionId: string | null }[];
  grades: {
    id: string;
    value: string | null;
    attendanceRate: number;
    periodId: string;
  }[];
  exits: string[];
}
export interface RiskSection {
  id: string;
  year: number;
  tutorUserId: string;
  auxiliarUserId: string | null;
  school: RiskSchool;
  students: RiskStudent[];
}
export interface ContactContext {
  sectionId: string;
  school: RiskSchool;
  tutorUserId: string;
  auxiliarUserId: string | null;
  guardians: {
    id: string;
    preferredChannel: string;
    whatsappOptIn: boolean;
    receivesAlerts: boolean;
  }[];
}
export interface StaffRef {
  userId: string;
  role: string;
}
