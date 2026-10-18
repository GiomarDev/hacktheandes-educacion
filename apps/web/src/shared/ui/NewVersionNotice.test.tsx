import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NewVersionNotice } from './NewVersionNotice';

describe('NewVersionNotice', () => {
  it('avisa cuando hay una versión publicada distinta y recarga al aceptar', async () => {
    const reload = vi.fn();
    render(
      <NewVersionNotice check={() => Promise.resolve(true)} reload={reload} />,
    );
    await userEvent.click(
      await screen.findByRole('button', { name: 'Actualizar' }),
    );
    expect(reload).toHaveBeenCalled();
    expect(screen.getByRole('status')).toHaveTextContent('nueva versión');
  });

  it('no muestra nada si la versión es la misma', async () => {
    const check = vi.fn().mockResolvedValue(false);
    render(<NewVersionNotice check={check} reload={vi.fn()} />);
    await vi.waitFor(() => expect(check).toHaveBeenCalled());
    expect(screen.queryByRole('status')).toBeNull();
  });
});
