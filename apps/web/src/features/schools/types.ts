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
