import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import type { CSSProperties } from 'react';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import { MascotFigure } from '../mascot/MascotFigure';
import { Button, cx } from '../ui/kit';
import type { TourStep } from './steps';

const GAP = 14;
const GUTTER = 16;
const CARD_WIDTH = 340;

// Primer elemento visible con ese data-tour (la barra lateral o la inferior, según la pantalla).
// En el móvil, lo que no cabe en la barra inferior vive en "Más": se señala ese botón.
export function findTarget(name: string): HTMLElement | null {
  const visible = (el: Element) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const all = [
    ...document.querySelectorAll<HTMLElement>(`[data-tour="${name}"]`),
  ];
  const found = all.find(visible);
  if (found || !name.startsWith('nav-')) return found ?? null;
  return (
    [...document.querySelectorAll<HTMLElement>('[data-tour="nav-more"]')].find(
      visible,
    ) ?? null
  );
}

type Rect = { top: number; left: number; width: number; height: number };

// Junto al elemento, del lado con más espacio; siempre dentro de la pantalla.
function placeCard(rect: Rect | null, height: number): CSSProperties {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const width = Math.min(CARD_WIDTH, vw - 2 * GUTTER);
  const clampLeft = (x: number) =>
    Math.max(GUTTER, Math.min(x, vw - width - GUTTER));
  const clampTop = (y: number) =>
    Math.max(GUTTER, Math.min(y, vh - height - GUTTER));
  if (!rect)
    return { width, left: (vw - width) / 2, top: clampTop((vh - height) / 2) };
  const right = vw - (rect.left + rect.width);
  const below = vh - (rect.top + rect.height);
  if (right >= width + GAP + GUTTER && rect.left < vw / 3)
    return {
      width,
      left: rect.left + rect.width + GAP,
      top: clampTop(rect.top + rect.height / 2 - height / 2),
    };
  if (rect.top >= height + GAP + GUTTER && rect.top > below)
    return {
      width,
      left: clampLeft(rect.left + rect.width / 2 - width / 2),
      top: rect.top - GAP - height,
    };
  return {
    width,
    left: clampLeft(rect.left + rect.width / 2 - width / 2),
    top: clampTop(rect.top + rect.height + GAP),
  };
}

export function Tour({
  steps,
  onFinish,
}: {
  steps: TourStep[];
  // completed: llegó al final; false si lo saltó. En ambos casos no se vuelve a mostrar solo.
  onFinish: (completed: boolean) => void;
}) {
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [cardHeight, setCardHeight] = useState(240);
  const card = useRef<HTMLDivElement>(null);
  const primary = useRef<HTMLButtonElement>(null);
  const step = steps[index];
  // Un Enter que llega justo al abrir (p. ej. el del login) no debe saltar el paso.
  const readyAt = useRef(0);
  const last = index === steps.length - 1;

  const measure = useCallback(() => {
    const el = step.target ? findTarget(step.target) : null;
    if (!el) return setRect(null);
    const r = el.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [step]);

  useLayoutEffect(() => {
    measure();
    if (card.current) setCardHeight(card.current.offsetHeight);
  }, [measure, index]);

  useEffect(() => {
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [measure]);

  useEffect(() => {
    readyAt.current = performance.now() + 400;
    primary.current?.focus();
  }, [index]);
  const settled = () => performance.now() >= readyAt.current;

  const next = useCallback(() => {
    if (!settled()) return;
    if (last) onFinish(true);
    else setIndex((i) => i + 1);
  }, [last, onFinish]);
  const back = useCallback(() => {
    if (settled()) setIndex((i) => Math.max(0, i - 1));
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFinish(false);
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') back();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, back, onFinish]);

  const pad = 6;
  return (
    <div className="fixed inset-0 z-[1100]" data-amauti-avoid>
      {rect ? (
        <div
          aria-hidden
          className="tour-spotlight pointer-events-none fixed rounded-lg"
          style={{
            top: rect.top - pad,
            left: rect.left - pad,
            width: rect.width + 2 * pad,
            height: rect.height + 2 * pad,
          }}
        />
      ) : (
        <div aria-hidden className="fixed inset-0 bg-ink/55" />
      )}
      <div
        ref={card}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        aria-describedby="tour-body"
        className="tour-card fixed rounded-xl border border-line bg-card p-4 shadow-[0_18px_40px_-12px_rgba(26,35,50,0.35)]"
        style={placeCard(rect, cardHeight)}
      >
        <div className="flex gap-3">
          <MascotFigure
            pose={step.pose}
            className="-mt-1 h-[92px] w-[66px] shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-medium text-faint">
              Paso {index + 1} de {steps.length}
            </div>
            <h2
              id="tour-title"
              className="mt-0.5 text-[16px] leading-snug font-semibold tracking-tight text-ink"
            >
              {step.title}
            </h2>
            <p id="tour-body" className="mt-1.5 text-[13px] text-muted">
              {step.body}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onFinish(false)}
            className="-mt-1 -mr-1 flex size-8 shrink-0 items-center justify-center rounded text-faint hover:bg-soft hover:text-ink"
            aria-label="Saltar el recorrido"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <div className="flex flex-1 gap-1" aria-hidden>
            {steps.map((s, i) => (
              <span
                key={s.id}
                className={cx(
                  'h-1.5 rounded-full transition-all duration-300',
                  i === index ? 'w-5 bg-peru' : 'w-1.5 bg-line',
                )}
              />
            ))}
          </div>
          {index > 0 && (
            <Button variant="ghost" onClick={back} aria-label="Paso anterior">
              <ArrowLeft className="size-3.5" aria-hidden />
            </Button>
          )}
          <Button ref={primary} variant="primary" onClick={next}>
            {last ? 'Empezar' : index === 0 ? 'Vamos' : 'Siguiente'}
            {!last && <ArrowRight className="size-3.5" aria-hidden />}
          </Button>
        </div>
      </div>
    </div>
  );
}
