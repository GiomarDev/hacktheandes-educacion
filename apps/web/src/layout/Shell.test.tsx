import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { Shell } from './Shell';
import type { AuthUser } from '../auth/roles';

const state = vi.hoisted(() => ({
  roleIndex: 0,
  selectRole: vi.fn(),
  logout: vi.fn(),
}));
const user: AuthUser = {
  id: 'u1',
  name: 'Rosa Quispe',
  roles: [
    { role: 'DIRECTOR', schoolId: 's1' },
    { role: 'UGEL_SPECIALIST', ugelId: 'g1' },
  ],
};
vi.mock('../auth/AuthProvider', () => ({
  useSession: () => ({
    user,
    active: user.roles[state.roleIndex],
    selectRole: state.selectRole,
    logout: state.logout,
  }),
}));
vi.mock('../api/queries', () => ({
  useAlerts: () => ({ data: [{ id: 'a' }, { id: 'b' }] }),
}));

function renderShell() {
  const router = createMemoryRouter([{ path: '*', element: <Shell /> }], {
    initialEntries: ['/'],
  });
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

describe('Shell', () => {
  it('muestra la navegación del rol activo con el contador de alertas', () => {
    state.roleIndex = 0;
    renderShell();
    const nav = screen.getByRole('navigation', { name: 'Principal' });
    expect(
      within(nav)
        .getAllByRole('link')
        .map((a) => a.getAttribute('href')),
    ).toEqual(['/escuelas/s1', '/docente/aula', '/alertas', '/reportes']);
    expect(within(nav).getByText('2')).toBeInTheDocument();
  });

  it('el selector cambia de rol y la navegación pasa a la del especialista', async () => {
    state.roleIndex = 0;
    const { unmount } = renderShell();
    const select = screen.getAllByRole('combobox')[0];
    await userEvent.selectOptions(select, '1');
    expect(state.selectRole).toHaveBeenCalledWith(1);
    unmount();
    state.roleIndex = 1;
    renderShell();
    const nav = screen.getByRole('navigation', { name: 'Principal' });
    expect(within(nav).getByRole('link', { name: /Panorama/ })).toHaveAttribute(
      'href',
      '/panorama',
    );
    expect(within(nav).queryByRole('link', { name: /Aulas/ })).toBeNull();
  });
});
