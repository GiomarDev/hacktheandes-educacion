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
