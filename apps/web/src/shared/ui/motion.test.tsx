import { act, render, screen } from '@testing-library/react';
import { TopProgress } from '@/shared/ui/motion';

describe('TopProgress', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('no aparece en cargas breves para evitar parpadeos', () => {
    const { rerender } = render(<TopProgress active />);
    act(() => vi.advanceTimersByTime(100));
    rerender(<TopProgress active={false} />);
    act(() => vi.advanceTimersByTime(500));
    expect(screen.queryByRole('progressbar')).toBeNull();
  });

  it('se muestra tras 150 ms de carga y se retira al terminar', () => {
    const { rerender } = render(<TopProgress active />);
    act(() => vi.advanceTimersByTime(160));
    expect(
      screen.getByRole('progressbar', { name: 'Cargando datos' }),
    ).toBeInTheDocument();
    rerender(<TopProgress active={false} />);
    act(() => vi.advanceTimersByTime(400));
    expect(screen.queryByRole('progressbar')).toBeNull();
  });
});
