import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, seg } from '@/shared/api/client';
import { qs } from '@/shared/api/query-string';
import type {
  DocumentPreference,
  DocumentStatus,
  GeneratedDocument,
  PreferencesResult,
} from './types';

// DOCUMENTOS (SIMON): papeleo generado desde WhatsApp y su revisión.
export const useDocuments = (status?: DocumentStatus) =>
  useQuery({
    queryKey: ['documents', status],
    queryFn: () =>
      apiFetch<GeneratedDocument[]>('simon', `/documents${qs({ status })}`),
  });

export function useReviewDocument() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: 'APPROVED' | 'REJECTED';
    }) =>
      apiFetch<GeneratedDocument>('simon', `/documents/${seg(id)}/review`, {
        method: 'POST',
        body: { status },
      }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['documents'] }),
  });
}

export function useDocumentCorrection() {
  const client = useQueryClient();
  return useMutation({
    // Aún no se sube el contenido: solo se registran nombre, tipo y tamaño del archivo.
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      apiFetch<GeneratedDocument>('simon', `/documents/${seg(id)}/correction`, {
        method: 'POST',
        body: {
          fileName: file.name,
          mimeType: file.type || 'application/octet-stream',
          sizeBytes: file.size,
        },
      }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['documents'] }),
  });
}

// Preferencias para próximos documentos: siempre las del usuario de la sesión.
export const useDocumentPreferences = () =>
  useQuery({
    queryKey: ['document-preferences'],
    queryFn: () =>
      apiFetch<PreferencesResult>('simon', '/documents/preferences'),
  });

export function useSaveDocumentPreference() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, instruction }: { id: string; instruction: string }) =>
      apiFetch<DocumentPreference>(
        'simon',
        `/documents/${seg(id)}/preference`,
        { method: 'POST', body: { instruction } },
      ),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: ['document-preferences'] }),
  });
}

export function useForgetDocumentPreference() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>('simon', `/documents/preferences/${seg(id)}`, {
        method: 'DELETE',
      }),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: ['document-preferences'] }),
  });
}
