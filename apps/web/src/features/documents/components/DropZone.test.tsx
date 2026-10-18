import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DropZone } from '@/features/documents/components/DropZone';

const file = (name: string, size = 1000) => {
  const f = new File(['x'], name);
  Object.defineProperty(f, 'size', { value: size });
  return f;
};

describe('DropZone', () => {
  it('acepta un documento soltado y lo entrega', () => {
    const onFile = vi.fn();
    render(<DropZone onFile={onFile} />);
    const zone = screen.getByRole('button', { name: /arrastra/i });
    fireEvent.dragOver(zone, { dataTransfer: { files: [] } });
    expect(zone).toHaveAttribute('data-dragging', 'true');
    fireEvent.drop(zone, {
      dataTransfer: { files: [file('sesion-corregida.docx')] },
    });
    expect(onFile).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'sesion-corregida.docx' }),
    );
  });

  it('rechaza otros formatos y archivos de más de 20 MB sin entregarlos', () => {
    const onFile = vi.fn();
    render(<DropZone onFile={onFile} />);
    const zone = screen.getByRole('button', { name: /arrastra/i });
    fireEvent.drop(zone, { dataTransfer: { files: [file('foto.png')] } });
    expect(screen.getByRole('alert')).toHaveTextContent(
      '.docx, .doc, .xlsx, .xls o .pdf',
    );
    fireEvent.drop(zone, {
      dataTransfer: { files: [file('grande.xlsx', 21 * 1024 * 1024)] },
    });
    expect(screen.getByRole('alert')).toHaveTextContent('20 MB');
    expect(onFile).not.toHaveBeenCalled();
  });

  it('también permite elegir el archivo con el teclado', async () => {
    const onFile = vi.fn();
    render(<DropZone onFile={onFile} />);
    const input = screen.getByLabelText(/elegir archivo/i);
    await userEvent.upload(input, file('registro.xlsx'));
    expect(onFile).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'registro.xlsx' }),
    );
  });
});
