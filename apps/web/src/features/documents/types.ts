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
