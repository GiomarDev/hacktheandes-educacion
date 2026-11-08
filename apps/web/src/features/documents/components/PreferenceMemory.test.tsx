import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PreferenceMemory } from '@/features/documents/components/PreferenceMemory';
import { RememberedPreferences } from '@/features/documents/components/RememberedPreferences';
import type { PreferencesResult } from '@/features/documents/types';

const saved: PreferencesResult = {
  status: 'available',
  preferences: [
    {
      id: '11111111-1111-4111-8111-111111111111',
      category: 'Sesión de aprendizaje',
      instruction: 'Pon las competencias del CNEB al inicio',
      savedAt: null,
    },
  ],
};

describe('PreferenceMemory', () => {
  it('sin Atomic Memory configurado no muestra nada', () => {
    const { container } = render(
      <PreferenceMemory
        category="Sesión de aprendizaje"
        result={{ status: 'disabled' }}
        onSave={vi.fn()}
        onForget={vi.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('el docente indica qué cambiar la próxima vez', async () => {
    const onSave = vi.fn().mockResolvedValue({});
    render(
      <PreferenceMemory
        category="Sesión de aprendizaje"
        result={{ status: 'available', preferences: [] }}
        onSave={onSave}
        onForget={vi.fn()}
      />,
    );
    await userEvent.type(
      screen.getByRole('textbox', { name: /qué quieres recordar/i }),
      'Usa letra Arial 12',
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Guardar recordatorio' }),
    );
    expect(onSave).toHaveBeenCalledWith('Usa letra Arial 12');
  });

  it('muestra lo recordado para ese tipo y permite corregirlo u olvidarlo', async () => {
    const onForget = vi.fn();
    render(
      <PreferenceMemory
        category="Sesión de aprendizaje"
        result={saved}
        onSave={vi.fn().mockResolvedValue({})}
        onForget={onForget}
      />,
    );
    expect(
      screen.getByText(/pon las competencias del cneb al inicio/i),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Olvidar' }));
    expect(onForget).toHaveBeenCalledWith(saved.preferences[0].id);
    await userEvent.click(screen.getByRole('button', { name: 'Corregir' }));
    expect(screen.getByRole('textbox')).toHaveValue(
      'Pon las competencias del CNEB al inicio',
    );
  });

  it('si el guardado falla, muestra el error y conserva el texto', async () => {
    const onSave = vi.fn().mockRejectedValue(new Error('x'));
    render(
      <PreferenceMemory
        category="Informe"
        result={{ status: 'available', preferences: [] }}
        onSave={onSave}
        onForget={vi.fn()}
        error={
          new Error(
            'Atomic Memory no está disponible: la preferencia no se guardó',
          )
        }
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent(/no se guardó/);
    await userEvent.type(screen.getByRole('textbox'), 'Más breve');
    await userEvent.click(
      screen.getByRole('button', { name: /guardar recordatorio/i }),
    );
    expect(screen.getByRole('textbox')).toHaveValue('Más breve');
  });

  it('avisa si la memoria no está disponible sin bloquear la revisión', () => {
    render(
      <PreferenceMemory
        category="Informe"
        result={{ status: 'unavailable' }}
        onSave={vi.fn()}
        onForget={vi.fn()}
      />,
    );
    expect(screen.getByRole('status')).toHaveTextContent(/no están disponibles/);
  });
});

describe('RememberedPreferences', () => {
  it('lista lo recordado y permite olvidarlo', async () => {
    const onForget = vi.fn();
    render(<RememberedPreferences result={saved} onForget={onForget} />);
    await userEvent.click(
      screen.getByRole('button', {
        name: 'Olvidar el recordatorio de Sesión de aprendizaje',
      }),
    );
    expect(onForget).toHaveBeenCalledWith(saved.preferences[0].id);
  });

  it('se oculta si la función está apagada', () => {
    const { container } = render(
      <RememberedPreferences
        result={{ status: 'disabled' }}
        onForget={vi.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
