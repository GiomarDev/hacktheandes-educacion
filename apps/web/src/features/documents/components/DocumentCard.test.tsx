import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DocumentCard } from '@/features/documents/components/DocumentCard';
import type { GeneratedDocument } from '@/features/documents/types';
import * as officeFiles from '@/features/documents/lib/officeFiles';

const base: GeneratedDocument = {
  id: 'd1',
  schoolId: 's1',
  ownerUserId: 'u1',
  title: 'Sesión de aprendizaje: fracciones',
  category: 'Sesión de aprendizaje',
  format: 'WORD',
  source: 'WHATSAPP',
  status: 'PENDING',
  reviewedAt: null,
  correctionFileName: null,
  correctionMimeType: null,
  correctionSizeBytes: null,
  correctionUploadedAt: null,
  createdAt: '2026-10-16T15:00:00.000Z',
};

describe('DocumentCard', () => {
  it('el docente dueño aprueba o rechaza un documento pendiente', async () => {
    const onReview = vi.fn();
    render(
      <DocumentCard
        doc={base}
        canReview
        onReview={onReview}
        onCorrection={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Aprobado' }));
    expect(onReview).toHaveBeenCalledWith('APPROVED');
    await userEvent.click(screen.getByRole('button', { name: 'No aprobado' }));
    expect(onReview).toHaveBeenCalledWith('REJECTED');
    expect(screen.queryByRole('button', { name: /arrastra/i })).toBeNull();
  });

  it('un documento no aprobado ofrece descargas en Word y la zona para subir la corrección', () => {
    const onCorrection = vi.fn();
    render(
      <DocumentCard
        doc={{ ...base, status: 'REJECTED' }}
        canReview
        onReview={vi.fn()}
        onCorrection={onCorrection}
      />,
    );
    expect(screen.getByRole('button', { name: /\.docx/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /\.doc$/ })).toBeInTheDocument();
    expect(
      screen.getByText(/puedes subir otro documento o tus correcciones/i),
    ).toBeInTheDocument();
    fireEvent.drop(screen.getByRole('button', { name: /arrastra/i }), {
      dataTransfer: { files: [new File(['x'], 'sesion-corregida.docx')] },
    });
    expect(onCorrection).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'sesion-corregida.docx' }),
    );
  });

  it('un Excel no aprobado se descarga como .xlsx y muestra la corrección registrada', () => {
    render(
      <DocumentCard
        doc={{
          ...base,
          format: 'EXCEL',
          status: 'REJECTED',
          correctionFileName: 'registro-v2.xlsx',
          correctionSizeBytes: 20480,
          correctionUploadedAt: '2026-10-17T10:00:00.000Z',
        }}
        canReview
        onReview={vi.fn()}
        onCorrection={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /\.xlsx/ })).toBeInTheDocument();
    expect(screen.getByText(/registro-v2\.xlsx/)).toBeInTheDocument();
    expect(screen.getByText(/20 KB/)).toBeInTheDocument();
  });

  it('dirección solo consulta: sin botones de revisión ni carga', () => {
    render(
      <DocumentCard
        doc={{ ...base, status: 'REJECTED' }}
        canReview={false}
        onReview={vi.fn()}
        onCorrection={vi.fn()}
      />,
    );
    expect(screen.queryByRole('button', { name: 'Aprobado' })).toBeNull();
    expect(screen.queryByRole('button', { name: /arrastra/i })).toBeNull();
    expect(screen.getByText('No aprobado')).toBeInTheDocument();
  });

  it('el recordatorio guardado se muestra al revisar y viaja en la plantilla descargada', async () => {
    const reminder = 'Pon las competencias del CNEB al inicio';
    const { unmount } = render(
      <DocumentCard
        doc={base}
        canReview
        reminder={reminder}
        onReview={vi.fn()}
        onCorrection={vi.fn()}
      />,
    );
    expect(screen.getByText(reminder)).toBeInTheDocument();
    expect(
      screen.getByText(/no se aplicó al contenido generado/),
    ).toBeInTheDocument();
    unmount();

    const download = vi
      .spyOn(officeFiles, 'downloadBytes')
      .mockImplementation(() => undefined);
    render(
      <DocumentCard
        doc={{ ...base, status: 'REJECTED' }}
        canReview
        reminder={reminder}
        onReview={vi.fn()}
        onCorrection={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /\.doc$/ }));
    const [bytes, name] = download.mock.calls[0];
    expect(name).toBe('sesion-de-aprendizaje-fracciones.doc');
    expect(new TextDecoder().decode(bytes)).toContain(reminder);
    download.mockRestore();
  });
});
