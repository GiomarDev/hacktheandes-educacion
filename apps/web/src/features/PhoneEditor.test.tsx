import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PhoneEditor, normalizePhone } from './PhoneEditor';

describe('normalizePhone', () => {
  it('acepta celulares peruanos con o sin +51 y espacios', () => {
    expect(normalizePhone('987 654 321')).toBe('+51987654321');
    expect(normalizePhone('+51 912-345-678')).toBe('+51912345678');
    expect(normalizePhone('812345678')).toBeNull();
    expect(normalizePhone('12345')).toBeNull();
  });
});

describe('PhoneEditor', () => {
  it('muestra el número y lo guarda normalizado', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<PhoneEditor name="Carla" phone="+51900000001" onSave={onSave} />);
    expect(screen.getByText('+51 900 000 001')).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole('button', { name: 'Editar celular de Carla' }),
    );
    const input = screen.getByLabelText('Celular de Carla');
    await userEvent.clear(input);
    await userEvent.type(input, '987 654 321');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(onSave).toHaveBeenCalledWith('+51987654321');
    expect(
      await screen.findByRole('button', { name: 'Editar celular de Carla' }),
    ).toBeInTheDocument();
  });

  it('no envía un número inválido y avisa junto al campo', async () => {
    const onSave = vi.fn();
    render(<PhoneEditor name="Carla" phone={null} onSave={onSave} />);
    expect(screen.getByText('Sin celular')).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole('button', { name: 'Agregar celular de Carla' }),
    );
    await userEvent.type(screen.getByLabelText('Celular de Carla'), '12345');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('9 dígitos');
  });

  it('si el servidor rechaza, conserva lo escrito y muestra el error', async () => {
    const onSave = vi
      .fn()
      .mockRejectedValue(new Error('No administra a esta persona'));
    render(<PhoneEditor name="Carla" phone={null} onSave={onSave} />);
    await userEvent.click(
      screen.getByRole('button', { name: 'Agregar celular de Carla' }),
    );
    await userEvent.type(
      screen.getByLabelText('Celular de Carla'),
      '987654321',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No administra a esta persona',
    );
    expect(screen.getByLabelText('Celular de Carla')).toHaveValue('987654321');
  });
});
