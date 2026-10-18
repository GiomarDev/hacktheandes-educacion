import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { AmautiController } from './amauti-controller';
import { useIsMobile } from './useIsMobile';
import './amauti.css';
import './amauti-theme.css';

const HIDDEN_KEY = 'centinela.amauti.hidden';

interface MascotApi {
  // En pantallas pequeñas la mascota no se muestra (ni flotante ni su botón).
  available: boolean;
  visible: boolean;
  setVisible(value: boolean): void;
  say(message: string): void;
  celebrate(message: string): void;
  // Durante el recorrido, el compañero flotante se aparta para no tapar el foco.
  suspend(value: boolean): void;
}

const noop: MascotApi = {
  available: false,
  visible: false,
  setVisible: () => undefined,
  say: () => undefined,
  celebrate: () => undefined,
  suspend: () => undefined,
};
const MascotContext = createContext<MascotApi>(noop);

// Preferencia solo de este navegador; en el móvil empieza oculto para no tapar la barra inferior.
function initialVisible(): boolean {
  try {
    const stored = window.localStorage.getItem(HIDDEN_KEY);
    if (stored !== null) return stored !== 'true';
  } catch {
    // Sin localStorage se usa el valor por pantalla.
  }
  return window.innerWidth >= 768;
}

export function MascotProvider({ children }: { children: ReactNode }) {
  const pet = useRef<AmautiController | null>(null);
  // hide() emite el mismo evento que el botón "Ocultar": solo el del botón cambia la preferencia.
  const hidingByCode = useRef(false);
  const hide = (controller: AmautiController) => {
    hidingByCode.current = true;
    controller.hide();
    hidingByCode.current = false;
  };
  const [visible, setVisibleState] = useState(initialVisible);
  const [suspended, setSuspended] = useState(false);
  const mobile = useIsMobile();
  // Estado actual para callbacks programados (p. ej. celebrar justo al cerrar el recorrido).
  const live = useRef({ visible, suspended, mobile });
  live.current = { visible, suspended, mobile };

  useEffect(() => {
    const controller = new AmautiController({
      autoWelcome: false,
      autoBlink: true,
      // La persona no la mueve: ni arrastrándola ni con las flechas del teclado.
      allowDrag: false,
      followCursor: true,
      allowKeyboardMove: false,
      idleMs: 60000,
      // Saludar, caminar, saltar, parpadear, guiñar, sorprenderse, celebrar, dormir, despertar, idea.
      allowedActions: [18, 1, 3, 9, 11, 12, 16, 26, 27, 31],
    });
    pet.current = controller;
    hide(controller);
    // El botón "Ocultar" de la propia mascota también actualiza la preferencia.
    const onState = (e: Event) => {
      const { state } = (e as CustomEvent<{ state: string }>).detail;
      if (state !== 'hidden' || hidingByCode.current) return;
      setVisibleState(false);
      try {
        window.localStorage.setItem(HIDDEN_KEY, 'true');
      } catch {
        // La preferencia dura solo esta visita.
      }
    };
    controller.element.addEventListener('amauti:state', onState);
    return () => {
      controller.element.removeEventListener('amauti:state', onState);
      controller.destroy();
      pet.current = null;
    };
  }, []);

  useEffect(() => {
    const controller = pet.current;
    if (!controller) return;
    if (visible && !suspended && !mobile) {
      // Sin espacio libre, show() vuelve a ocultarla: eso no es una preferencia de la persona.
      hidingByCode.current = true;
      controller.show();
      hidingByCode.current = false;
    } else hide(controller);
  }, [visible, suspended, mobile]);

  const setVisible = useCallback((value: boolean) => {
    setVisibleState(value);
    try {
      window.localStorage.setItem(HIDDEN_KEY, String(!value));
    } catch {
      // La preferencia dura solo esta visita.
    }
  }, []);

  const api = useMemo<MascotApi>(
    () => ({
      available: !mobile,
      visible,
      setVisible,
      say: (message) => {
        if (
          live.current.visible &&
          !live.current.suspended &&
          !live.current.mobile
        )
          pet.current?.say(message);
      },
      celebrate: (message) => {
        if (
          !live.current.visible ||
          live.current.suspended ||
          live.current.mobile
        )
          return;
        pet.current?.act(16);
        pet.current?.say(message);
      },
      suspend: setSuspended,
    }),
    [visible, suspended, mobile, setVisible],
  );

  return (
    <MascotContext.Provider value={api}>{children}</MascotContext.Provider>
  );
}

export const useMascot = () => useContext(MascotContext);
