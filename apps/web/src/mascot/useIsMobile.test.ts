import { act, renderHook } from '@testing-library/react';
import { useIsMobile } from './useIsMobile';

function mockMatchMedia(initial: boolean) {
  let listener: ((e: { matches: boolean }) => void) | null = null;
  const mql = {
    matches: initial,
    addEventListener: (_: string, fn: (e: { matches: boolean }) => void) =>
      (listener = fn),
    removeEventListener: () => (listener = null),
  };
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => mql),
  );
  return (matches: boolean) => {
    mql.matches = matches;
    listener?.({ matches });
  };
}

describe('useIsMobile', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('detecta pantallas de menos de 768 px y reacciona al cambiar de tamaño', () => {
    const change = mockMatchMedia(true);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
    expect(window.matchMedia).toHaveBeenCalledWith('(max-width: 767px)');
    act(() => change(false));
    expect(result.current).toBe(false);
  });
});
