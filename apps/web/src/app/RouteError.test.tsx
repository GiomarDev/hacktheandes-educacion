import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { RouteError } from './RouteError';

const reload = vi.fn();
vi.mock('@/shared/lib/app-version', async (original) => ({
  ...(await original<typeof import('@/shared/lib/app-version')>()),
  reloadForNewVersion: () => reload(),
}));

function renderFailing(error: Error) {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        errorElement: <RouteError />,
        lazy: async () => {
          throw error;
        },
      },
    ],
    { initialEntries: ['/'] },
  );
  return render(<RouterProvider router={router} />);
}

describe('RouteError', () => {
  beforeEach(() => reload.mockReset());

  it('una pantalla de una versión anterior recarga la aplicación', async () => {
    reload.mockReturnValue(true);
    renderFailing(
      new TypeError(
        'Failed to fetch dynamically imported module: https://x/assets/Escuelas-old.js',
      ),
    );
    expect(
      await screen.findByText('Actualizando Amauti a la nueva versión…'),
    ).toBeInTheDocument();
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('si la recarga no resolvió el problema, ofrece reintentar sin entrar en bucle', async () => {
    reload.mockReturnValue(false);
    renderFailing(
      new TypeError(
        'Failed to fetch dynamically imported module: https://x/assets/a.js',
      ),
    );
    expect(
      await screen.findByRole('heading', {
        name: 'No pudimos cargar esta pantalla',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Recargar' }),
    ).toBeInTheDocument();
  });

  it('otros errores muestran un mensaje claro, no el error técnico', async () => {
    renderFailing(new Error('x is undefined'));
    expect(
      await screen.findByRole('heading', {
        name: 'Algo salió mal en esta pantalla',
      }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Hey developer/)).toBeNull();
    expect(reload).not.toHaveBeenCalled();
  });
});
