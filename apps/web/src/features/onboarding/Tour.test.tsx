import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { findTarget, Tour } from '@/features/onboarding/Tour';
import { stepsFor } from '@/features/onboarding/steps';
import { MascotFigure } from '@/features/mascot/MascotFigure';

describe('stepsFor', () => {
  it('arma un paso por cada acceso del rol, entre la bienvenida y el cierre', () => {
    const steps = stepsFor({ role: 'TEACHER', schoolId: 's' }, 'Rosa Quispe');
    expect(steps.map((s) => s.id)).toEqual([
      'welcome',
      'today',
      'classroom',
      'grades',
      'documents',
      'alerts',
      'plans',
      'visits',
      'amauti',
      'done',
    ]);
    expect(steps[0].title).toBe('¡Hola, Rosa! Soy Amauti');
    expect(steps.find((s) => s.id === 'grades')!.body).toMatch(
      /áreas que dictas/,
    );
  });

  it('adapta el texto al rol: la UGEL revisa reportes, dirección los envía', () => {
    const ugel = stepsFor({ role: 'UGEL_SPECIALIST', ugelId: 'u' }, 'Ana');
    const director = stepsFor({ role: 'DIRECTOR', schoolId: 's' }, 'Ana');
    expect(ugel.find((s) => s.id === 'reports')!.body).toMatch(/Revisa/);
    expect(director.find((s) => s.id === 'reports')!.body).toMatch(/envía/);
  });
});

describe('Tour', () => {
  const steps = stepsFor({ role: 'AUXILIAR', schoolId: 's' }, 'Luis');
  // Cada lectura del reloj avanza 1 s: los clics no caen en la pausa inicial de cada paso.
  beforeEach(() => {
    let now = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => (now += 1000));
  });
  afterEach(() => vi.restoreAllMocks());

  it('ignora la activación inmediata al abrir (el Enter del login)', async () => {
    vi.spyOn(performance, 'now').mockReturnValue(0);
    render(<Tour steps={steps} onFinish={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: /Vamos/ }));
    expect(screen.getByText(`Paso 1 de ${steps.length}`)).toBeInTheDocument();
  });

  it('avanza, retrocede y termina como completado', async () => {
    const onFinish = vi.fn();
    render(<Tour steps={steps} onFinish={onFinish} />);
    expect(
      screen.getByRole('dialog', { name: '¡Hola, Luis! Soy Amauti' }),
    ).toBeInTheDocument();
    expect(screen.getByText(`Paso 1 de ${steps.length}`)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Vamos/ }));
    expect(screen.getByRole('dialog', { name: 'Hoy' })).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole('button', { name: 'Paso anterior' }),
    );
    expect(screen.getByText(`Paso 1 de ${steps.length}`)).toBeInTheDocument();
    for (let i = 1; i < steps.length; i++)
      await userEvent.click(
        screen.getByRole('button', { name: /Vamos|Siguiente/ }),
      );
    await userEvent.click(screen.getByRole('button', { name: 'Empezar' }));
    expect(onFinish).toHaveBeenCalledWith(true);
  });

  it('se puede saltar con el botón o con Escape', async () => {
    const onFinish = vi.fn();
    render(<Tour steps={steps} onFinish={onFinish} />);
    await userEvent.click(
      screen.getByRole('button', { name: 'Saltar el recorrido' }),
    );
    await userEvent.keyboard('{Escape}');
    expect(onFinish).toHaveBeenNthCalledWith(1, false);
    expect(onFinish).toHaveBeenNthCalledWith(2, false);
  });

  it('el botón principal recibe el foco en cada paso', async () => {
    render(<Tour steps={steps} onFinish={vi.fn()} />);
    expect(screen.getByRole('button', { name: /Vamos/ })).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: /Siguiente/ })).toHaveFocus();
  });
});

describe('findTarget', () => {
  afterEach(() => document.body.replaceChildren());
  const box = (tour: string, visible: boolean) => {
    const el = document.createElement('a');
    el.dataset.tour = tour;
    el.getBoundingClientRect = () =>
      ({
        width: visible ? 40 : 0,
        height: visible ? 40 : 0,
        top: 0,
        left: 0,
      }) as DOMRect;
    document.body.append(el);
    return el;
  };

  it('elige la copia visible del acceso', () => {
    box('nav-alerts', false);
    const shown = box('nav-alerts', true);
    expect(findTarget('nav-alerts')).toBe(shown);
  });

  it('en el móvil, lo que está dentro de "Más" señala ese botón', () => {
    box('nav-admin', false);
    const more = box('nav-more', true);
    expect(findTarget('nav-admin')).toBe(more);
    expect(findTarget('amauti')).toBeNull();
  });
});

describe('MascotFigure', () => {
  it('es decorativa: sin título ni IDs repetidos', () => {
    const { container } = render(
      <>
        <MascotFigure />
        <MascotFigure pose="sleeping" />
      </>,
    );
    const svgs = container.querySelectorAll('svg');
    expect(svgs).toHaveLength(2);
    svgs.forEach((svg) => expect(svg).toHaveAttribute('aria-hidden', 'true'));
    expect(container.querySelector('title, [id]')).toBeNull();
  });
});
