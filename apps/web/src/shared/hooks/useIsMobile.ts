import { useEffect, useState } from 'react';

// Mismo corte que la barra inferior (md de Tailwind): por debajo de 768 px no se muestra la mascota.
const QUERY = '(max-width: 767px)';

export function isMobileNow(): boolean {
  return window.matchMedia?.(QUERY).matches ?? window.innerWidth < 768;
}

export function useIsMobile(): boolean {
  const [mobile, setMobile] = useState(isMobileNow);
  useEffect(() => {
    const mql = window.matchMedia?.(QUERY);
    if (!mql) return;
    const onChange = (e: { matches: boolean }) => setMobile(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);
  return mobile;
}
