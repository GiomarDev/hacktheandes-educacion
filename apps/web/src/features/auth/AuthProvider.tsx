import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiFetch, onSessionExpired, session } from '@/shared/api/client';
import type { AuthUser, RoleClaim } from '@/features/auth/roles';

interface LoginResult {
  accessToken: string;
  refreshToken: string;
  mustChangePassword?: boolean;
}

interface AuthState {
  status: 'loading' | 'anonymous' | 'authenticated';
  user: AuthUser | null;
  active: RoleClaim | null;
  mustChangePassword: boolean;
  login(documentNumber: string, password: string): Promise<void>;
  logout(): Promise<void>;
  selectRole(index: number): void;
  passwordChanged(): void;
}

const AuthContext = createContext<AuthState | null>(null);
const ROLE_KEY = 'centinela.role';

function readRoleIndex(): number {
  try {
    return Number(window.sessionStorage.getItem(ROLE_KEY) ?? 0) || 0;
  } catch {
    return 0;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<AuthState['status']>(
    session.get() ? 'loading' : 'anonymous',
  );
  const [user, setUser] = useState<AuthUser | null>(null);
  const [roleIndex, setRoleIndex] = useState(readRoleIndex);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  const reset = useCallback(() => {
    // La siguiente sesión empieza en su pantalla de inicio, no en la ruta de la anterior.
    window.history.replaceState(null, '', '/');
    setUser(null);
    setStatus('anonymous');
    setMustChangePassword(false);
    queryClient.clear();
  }, [queryClient]);

  useEffect(() => onSessionExpired(reset), [reset]);

  // Al recargar la página: el access token se perdió, el cliente lo renueva con el refresh token.
  useEffect(() => {
    if (!session.get()) return;
    apiFetch<AuthUser>('auth', '/auth/me')
      .then((me) => {
        setUser(me);
        setStatus('authenticated');
      })
      .catch(reset);
  }, [reset]);

  const login = useCallback(
    async (documentNumber: string, password: string) => {
      const result = await apiFetch<LoginResult>('auth', '/auth/login', {
        method: 'POST',
        body: { documentNumber, password },
      });
      session.set(result);
      const me = await apiFetch<AuthUser>('auth', '/auth/me');
      setRoleIndex(0);
      try {
        window.sessionStorage.setItem(ROLE_KEY, '0');
      } catch {
        // Sin sessionStorage se usa el primer rol.
      }
      setMustChangePassword(!!result.mustChangePassword);
      window.history.replaceState(null, '', '/');
      setUser(me);
      setStatus('authenticated');
    },
    [],
  );

  const logout = useCallback(async () => {
    const refreshToken = session.get()?.refreshToken;
    if (refreshToken)
      await apiFetch('auth', '/auth/logout', {
        method: 'POST',
        body: { refreshToken },
      }).catch(() => undefined);
    session.clear();
    reset();
  }, [reset]);

  const selectRole = useCallback((index: number) => {
    window.history.replaceState(null, '', '/');
    setRoleIndex(index);
    try {
      window.sessionStorage.setItem(ROLE_KEY, String(index));
    } catch {
      // Preferencia solo de esta pestaña.
    }
  }, []);

  const value = useMemo<AuthState>(() => {
    const active = user
      ? (user.roles[roleIndex] ?? user.roles[0] ?? null)
      : null;
    return {
      status,
      user,
      active,
      mustChangePassword,
      login,
      logout,
      selectRole,
      passwordChanged: () => setMustChangePassword(false),
    };
  }, [status, user, roleIndex, mustChangePassword, login, logout, selectRole]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth fuera de AuthProvider');
  return value;
}

// Para pantallas dentro del shell: siempre hay usuario y rol activo.
export function useSession() {
  const { user, active, ...rest } = useAuth();
  if (!user || !active) throw new Error('Sin sesión');
  return { user, active, ...rest };
}
