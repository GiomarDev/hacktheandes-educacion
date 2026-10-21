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

// Lo que el docente pidió a Amauti para sus próximos documentos (Atomic Memory, opcional).
export interface DocumentPreference {
  id: string;
  category: string;
  instruction: string;
  savedAt: string | null;
}

export type PreferencesResult =
  | { status: 'disabled' }
  | { status: 'unavailable' }
  | { status: 'available'; preferences: DocumentPreference[] };
