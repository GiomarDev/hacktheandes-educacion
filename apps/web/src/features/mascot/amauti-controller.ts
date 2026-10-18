import { PausableTimers } from '@/features/mascot/amauti-timers';
import { gsap } from 'gsap';
import {
  reachablePoint,
  type Point,
} from '@/features/mascot/amauti-navigation';
import { gaitSpeed } from '@/features/mascot/amauti-gait';
import source from '@/features/mascot/amauti.svg?raw';
import {
  SVGAnimator,
  type State,
  type Animator,
} from '@/features/mascot/amauti-animations';
export const actions = [
  'Caminar a izquierda y derecha',
  'Correr',
  'Saltar',
  'Girar 180°',
  'Subir y bajar',
  'Sentarse sobre tarjeta',
  'Asomarse',
  'Regresar al inicio',
  'Parpadear',
  'Sonreír',
  'Guiñar',
  'Sorprenderse',
  'Pensar',
  'Confundirse',
  'Entristecerse',
  'Celebrar',
  'Seguir el cursor',
  'Saludar',
  'Reaccionar al clic',
  'Acercarse a un botón',
  'Mostrar mensajes',
  'Arrastrar',
  'Despedirse',
  'Bostezar',
  'Sentarse',
  'Dormir',
  'Despertar',
  'Escribir con la punta',
  'Señalar instrucciones',
  'Explicar procedimientos',
  'Mostrar una idea',
  'Revisar tareas',
  'Felicitar',
  'Recomendar recursos',
  'Dar la bienvenida',
  'Procesamiento de IA',
  'Documento generado',
  'Avisar de errores',
  'Alertas pedagógicas',
  'Reporte completado',
  'Acompañar el scroll',
  'Caminar entre secciones',
  'Transiciones',
  'Junto a contenido relevante',
  'Movimiento reducido',
];
export const implemented = new Set([
  1, 2, 3, 8, 9, 11, 12, 13, 16, 17, 18, 19, 21, 22, 23, 26, 27, 31, 33, 35, 36,
  37, 38, 39, 40, 41, 45,
]);
export type PlatformEvent =
  | 'ai:start'
  | 'ai:success'
  | 'ai:error'
  | 'document:generated'
  | 'activity:completed'
  | 'report:completed'
  | 'pedagogy:alert'
  | 'resource:recommended';
export interface AmautiOptions {
  avoid?: string;
  idleMs?: number;
  autoWelcome?: boolean;
  allowDrag?: boolean;
  followCursor?: boolean;
  autoBlink?: boolean;
  allowKeyboardMove?: boolean;
  allowedActions?: number[];
  renderer?: (svg: SVGSVGElement) => Animator;
}
export class AmautiController {
  readonly element: HTMLDivElement;
  private actor: HTMLButtonElement;
  private bubble: HTMLDivElement;
  private animator: Animator;
  private svg: SVGSVGElement;
  private state: State = 'idle';
  private paused = false;
  private hidden = false;
  private media = matchMedia('(prefers-reduced-motion: reduce)');
  private manualReduced = false;
  private abort = new AbortController();
  private idleTimer = 0;
  private actionTimer = 0;
  private blinkTimer = 0;
  private speechTimer = 0;
  private busy = false;
  private position = { x: 0, y: 0 };
  private drag: {
    id: number;
    x: number;
    y: number;
    startX: number;
    startY: number;
    moved: boolean;
    path: Point[];
  } | null = null;
  private motion: gsap.core.Tween | null = null;
  private clickSuppressed = false;
  private utterance: SpeechSynthesisUtterance | null = null;
  private voiceToken = 0;
  private baseSize: {
    width: number;
    height: number;
    actorWidth: number;
    actorHeight: number;
    actorBottom: number;
    bubbleBottom: number;
  } | null = null;
  private sizeMotion: gsap.core.Timeline | null = null;
  private sizeRestore: (() => void) | null = null;
  private layoutFrame = 0;
  private spaceHidden = false;
  private timers = new PausableTimers();
  private sizeFactor = 1;
  constructor(private options: AmautiOptions = {}) {
    this.element = document.createElement('div');
    this.element.className = 'amauti';
    this.element.innerHTML = `<div class="amauti-bubble" role="status" aria-live="polite" hidden></div><button class="amauti-actor" aria-label="Amauti: saludar. Usa las flechas para moverme." >${source}</button><div class="amauti-tools"><button data-tool="pause" aria-pressed="false">Pausar</button><button data-tool="hide">Ocultar</button></div>`;
    document.body.append(this.element);
    this.actor = this.element.querySelector('.amauti-actor')!;
    this.bubble = this.element.querySelector('.amauti-bubble')!;
    this.svg = this.actor.querySelector('svg')!;
    this.svg.setAttribute('aria-hidden', 'true');
    this.animator = options.renderer?.(this.svg) ?? new SVGAnimator(this.svg);
    const listen = (target: EventTarget, event: string, fn: EventListener) =>
      target.addEventListener(event, fn, { signal: this.abort.signal });
    listen(window, 'pointermove', (e) => this.pointer(e as PointerEvent));
    listen(this.actor, 'pointerdown', (e) => this.startDrag(e as PointerEvent));
    listen(this.actor, 'pointerup', (e) => this.endDrag(e as PointerEvent));
    listen(this.actor, 'pointercancel', (e) => this.endDrag(e as PointerEvent));
    listen(this.actor, 'lostpointercapture', (e) =>
      this.endDrag(e as PointerEvent),
    );
    listen(this.actor, 'click', () => {
      if (!this.clickSuppressed) this.act(18);
      this.clickSuppressed = false;
    });
    listen(this.actor, 'keydown', (e) => {
      const k = e as KeyboardEvent;
      const delta: Record<string, number[]> = {
        ArrowLeft: [-25, 0],
        ArrowRight: [25, 0],
        ArrowUp: [0, -25],
        ArrowDown: [0, 25],
      };
      if (delta[k.key] && this.options.allowKeyboardMove !== false) {
        k.preventDefault();
        this.moveTo(
          this.position.x + delta[k.key][0],
          this.position.y + delta[k.key][1],
        );
      }
    });
    const layout = () => {
      if (this.layoutFrame) return;
      this.layoutFrame = requestAnimationFrame(() => {
        this.layoutFrame = 0;
        if (!this.drag && !this.sizeMotion) {
          if (this.hidden && this.spaceHidden) this.show();
          else if (!this.hidden) this.revalidatePosition();
        }
      });
    };
    listen(window, 'resize', () => {
      if (this.drag) {
        this.drag = null;
        this.setState(this.busy ? 'thinking' : 'idle');
      }
      this.refreshSize();
      layout();
    });
    listen(window, 'scroll', layout);
    if (window.visualViewport) {
      listen(window.visualViewport, 'resize', layout);
      listen(window.visualViewport, 'scroll', layout);
    }
    listen(document, 'keydown', () => this.activity());
    listen(document, 'pointerdown', (e) => {
      if (!(e.target instanceof Element) || !e.target.closest('[data-tool]'))
        this.activity();
    });
    listen(this.media, 'change', () => this.setState(this.state));
    listen(document, 'visibilitychange', () => {
      if (document.hidden) this.cancelAudibleSpeech();
      this.syncPause();
    });
    listen(this.element, 'click', (e) => {
      const tool = (e.target as HTMLElement).dataset.tool;
      if (tool === 'pause') this.pause(!this.paused);
      if (tool === 'hide') this.hide();
    });
    listen(window, 'amauti:event', (e) => {
      const d = (e as CustomEvent<{ type: PlatformEvent; message?: string }>)
        .detail;
      if (d?.type) this.handle(d.type, d.message);
    });
    this.home();
    if (!this.hidden) {
      if (options.autoWelcome !== false) {
        this.setState('greeting');
        this.say('¡Hola! Soy Amauti. Aprendamos juntos.');
        this.later(1800);
      } else this.setState('idle');
    }
    this.activity();
    this.blinkTimer = window.setInterval(() => {
      if (
        this.options.autoBlink !== false &&
        !this.isPaused &&
        !this.hidden &&
        !['sleeping', 'idea', 'winking', 'surprised', 'scared'].includes(
          this.state,
        ) &&
        this.animator instanceof SVGAnimator
      )
        this.animator.blink(this.reduced);
    }, 4200);
    this.syncPause();
  }
  get reduced() {
    return this.media.matches || this.manualReduced;
  }
  get currentState() {
    return this.state;
  }
  get isPaused() {
    return this.paused || document.hidden;
  }
  private syncPause() {
    const value = this.isPaused;
    this.timers.pause(value);
    this.animator.pause(value);
    this.sizeMotion?.paused(value);
    this.motion?.paused(value);
  }
  private cancelAudibleSpeech() {
    if (!this.utterance) return;
    const message = this.bubble.textContent ?? '';
    this.stopVoice();
    this.setState(this.busy ? 'thinking' : 'idle');
    if (message) this.say(message);
  }
  wait(ms: number, signal?: AbortSignal): Promise<boolean> {
    return new Promise((resolve) => {
      if (signal?.aborted) {
        resolve(false);
        return;
      }
      const finish = (ok: boolean) => {
        signal?.removeEventListener('abort', abort);
        this.timers.clear(id);
        resolve(ok);
      };
      const abort = () => finish(false);
      const id = this.timers.set(() => finish(true), ms);
      signal?.addEventListener('abort', abort, { once: true });
    });
  }
  waitForRest(signal?: AbortSignal): Promise<boolean> {
    return new Promise((resolve) => {
      const finish = (ok: boolean) => {
        this.element.removeEventListener('amauti:state', check);
        signal?.removeEventListener('abort', abort);
        resolve(ok);
      };
      const abort = () => finish(false);
      const check = () => {
        if (this.hidden) finish(false);
        else if (this.state === 'idle') finish(true);
      };
      if (signal?.aborted) {
        resolve(false);
        return;
      }
      this.element.addEventListener('amauti:state', check);
      signal?.addEventListener('abort', abort, { once: true });
      check();
    });
  }
  private setState(next: State) {
    if (next === 'sleeping') {
      this.timers.clear(this.speechTimer);
      this.bubble.hidden = true;
    }
    this.endSizeGesture();
    this.timers.clear(this.actionTimer);
    if (next !== 'talking') this.stopVoice();
    if (!['walking', 'running'].includes(next)) {
      this.motion?.kill();
      this.motion = null;
    }
    this.state = next;
    this.element.dataset.state = next;
    this.animator.play(next, this.reduced);
    this.animator.pause(this.paused || document.hidden);
    this.element.dispatchEvent(
      new CustomEvent('amauti:state', { detail: { state: next } }),
    );
  }
  private later(ms = 1800) {
    this.timers.clear(this.actionTimer);
    this.actionTimer = this.timers.set(() => {
      if (!this.paused) this.setState(this.busy ? 'thinking' : 'idle');
    }, ms);
  }
  private activity() {
    this.timers.clear(this.idleTimer);
    if (this.state === 'sleeping')
      this.setState(this.busy ? 'thinking' : 'idle');
    if (this.options.idleMs === 0) return;
    this.idleTimer = this.timers.set(() => {
      if (!this.busy && !this.drag && !this.paused && !this.hidden)
        this.setState('sleeping');
    }, this.options.idleMs ?? 45000);
  }
  say(message: string) {
    this.timers.clear(this.speechTimer);
    this.bubble.textContent = message;
    this.bubble.hidden = false;
    this.speechTimer = this.timers.set(() => (this.bubble.hidden = true), 6500);
  }
  private stopVoice() {
    this.voiceToken++;
    if (this.utterance) {
      this.utterance.onend = null;
      this.utterance.onerror = null;
      window.speechSynthesis.cancel();
      this.utterance = null;
    }
  }
  speak(message: string, voice = false) {
    if (this.hidden) this.show();
    if (this.hidden || this.paused) return;
    this.stopVoice();
    this.activity();
    this.say(message);
    this.timers.clear(this.speechTimer);
    const finish = () => {
      this.bubble.hidden = true;
      this.setState(this.busy ? 'thinking' : 'idle');
    };
    if (voice && 'speechSynthesis' in window) {
      this.setState('idle');
      const token = ++this.voiceToken;
      const u = new SpeechSynthesisUtterance(message);
      this.utterance = u;
      u.lang = 'es-PE';
      u.rate = 0.95;
      const spanish =
        window.speechSynthesis
          .getVoices()
          .find((v) => v.lang.toLowerCase() === 'es-pe') ??
        window.speechSynthesis.getVoices().find((v) => v.lang.startsWith('es'));
      if (spanish) u.voice = spanish;
      u.onstart = () => {
        if (token === this.voiceToken) {
          this.setState('talking');
          this.actionTimer = this.timers.set(
            finish,
            Math.max(12000, message.length * 200),
          );
        }
      };
      u.onend = () => {
        if (token === this.voiceToken) finish();
      };
      u.onerror = () => {
        if (token === this.voiceToken) {
          this.setState('talking');
          this.later(Math.max(2200, message.length * 65));
        }
      };
      window.speechSynthesis.speak(u);
      // Speech engines may never fire events: retain readable text and recover safely.
      this.actionTimer = this.timers.set(
        () => {
          if (token === this.voiceToken) finish();
        },
        Math.max(12000, message.length * 200),
      );
    } else {
      this.setState('talking');
      this.actionTimer = this.timers.set(
        finish,
        Math.max(2200, message.length * 65),
      );
    }
  }
  expression(kind: 'surprised' | 'scared') {
    if (this.hidden) this.show();
    if (this.hidden || this.paused) return;
    this.activity();
    this.setState(kind);
    this.say(
      kind === 'surprised'
        ? '¡Oh! ¡Qué descubrimiento!'
        : '¡Uy! Me diste un sustito.',
    );
    this.later(2400);
  }
  setSize(factor: number) {
    this.endSizeGesture();
    if (!Number.isFinite(factor)) return false;
    if (this.hidden) this.show();
    if (this.hidden) return false;
    const root = getComputedStyle(this.element),
      actor = getComputedStyle(this.actor);
    this.baseSize ??= {
      width: parseFloat(root.width),
      height: parseFloat(root.height),
      actorWidth: parseFloat(actor.width),
      actorHeight: parseFloat(actor.height),
      actorBottom: parseFloat(actor.bottom),
      bubbleBottom: parseFloat(getComputedStyle(this.bubble).bottom),
    };
    const old = {
      root: this.element.getAttribute('style'),
      actor: this.actor.getAttribute('style'),
      bubble: this.bubble.getAttribute('style'),
    };
    const size = this.baseSize,
      s = Math.max(0.6, Math.min(1.5, factor));
    this.motion?.kill();
    this.element.style.width = `${size.width * s}px`;
    this.element.style.height = `${size.actorBottom + (size.height - size.actorBottom) * s}px`;
    this.actor.style.width = `${size.actorWidth * s}px`;
    this.actor.style.height = `${size.actorHeight * s}px`;
    this.bubble.style.width = `${size.width * s}px`;
    this.bubble.style.bottom = `${size.actorBottom + (size.bubbleBottom - size.actorBottom) * s}px`;
    this.bubble.style.maxHeight = `${(size.height - size.bubbleBottom) * s}px`;
    const p = this.safe(this.position.x, this.position.y);
    if (!p) {
      for (const [el, value] of [
        [this.element, old.root],
        [this.actor, old.actor],
        [this.bubble, old.bubble],
      ] as const) {
        if (value === null) el.removeAttribute('style');
        else el.setAttribute('style', value);
      }
      this.say('Aquí no tengo espacio para ese tamaño.');
      return false;
    }
    this.sizeFactor = s;
    this.position = p;
    gsap.set(this.element, { x: p.x, y: p.y });
    this.setState(this.busy ? 'thinking' : 'idle');
    return true;
  }
  private refreshSize() {
    this.endSizeGesture();
    this.baseSize = null;
    const factor = this.sizeFactor;
    for (const name of ['width', 'height']) {
      this.element.style.removeProperty(name);
      this.actor.style.removeProperty(name);
    }
    for (const name of ['width', 'bottom', 'max-height'])
      this.bubble.style.removeProperty(name);
    if (this.hidden) {
      this.sizeFactor = 1;
      return;
    }
    if (!this.setSize(factor) && !this.setSize(1)) this.hide(true);
  }
  private endSizeGesture() {
    this.sizeMotion?.kill();
    this.sizeMotion = null;
    const restore = this.sizeRestore;
    this.sizeRestore = null;
    restore?.();
  }
  pulseSize(factor: number) {
    this.endSizeGesture();
    if (this.paused) return false;
    if (this.hidden) this.show();
    if (this.hidden) return false;
    const s = Math.max(0.6, Math.min(1.5, factor));
    if (!Number.isFinite(s)) return false;
    const previous = {
      root: this.element.getAttribute('style'),
      actor: this.actor.getAttribute('style'),
      bubble: this.bubble.getAttribute('style'),
      position: { ...this.position },
      factor: this.sizeFactor,
    };
    // Reserve the largest footprint first, then animate only the drawing inside it.
    const desired = Math.max(0.6, Math.min(1.5, previous.factor * s)),
      reserved = Math.max(previous.factor, desired);
    if (!this.setSize(reserved)) return false;
    const restore = () => {
      this.sizeFactor = previous.factor;
      for (const [el, value] of [
        [this.element, previous.root],
        [this.actor, previous.actor],
        [this.bubble, previous.bubble],
      ] as const) {
        if (value === null) el.removeAttribute('style');
        else el.setAttribute('style', value);
      }
      const valid = this.safe(previous.position.x, previous.position.y);
      if (valid) {
        this.position = valid;
        gsap.set(this.element, { x: valid.x, y: valid.y });
      } else this.hide(true);
    };
    this.sizeRestore = restore;
    if (this.reduced) {
      this.endSizeGesture();
      return true;
    }
    const normal = previous.factor / reserved,
      target = desired / reserved;
    gsap.set(this.actor, { scale: normal, transformOrigin: '50% 100%' });
    this.sizeMotion = gsap
      .timeline({
        onComplete: () => {
          this.sizeMotion = null;
          this.sizeRestore = null;
          restore();
        },
      })
      .to(this.actor, {
        scale: target,
        duration: s > 1 ? 0.7 : 0.55,
        ease: 'sine.inOut',
      })
      .to({}, { duration: s > 1 ? 0.9 : 0.45 })
      .to(this.actor, {
        scale: normal,
        duration: s > 1 ? 0.8 : 0.65,
        ease: 'sine.inOut',
      });
    return true;
  }
  private limits() {
    const viewport = window.visualViewport,
      style = getComputedStyle(this.element);
    const inset = (name: string) =>
      parseFloat(style.getPropertyValue('--amauti-inset-' + name)) || 0;
    const left = (viewport?.offsetLeft ?? 0) + 8 + inset('left'),
      top = (viewport?.offsetTop ?? 0) + 8 + inset('top');
    return {
      left,
      top,
      right:
        (viewport?.offsetLeft ?? 0) +
        (viewport?.width ?? innerWidth) -
        8 -
        inset('right'),
      bottom:
        (viewport?.offsetTop ?? 0) +
        (viewport?.height ?? innerHeight) -
        8 -
        inset('bottom'),
    };
  }
  private safe(x: number, y: number) {
    const style = getComputedStyle(this.element);
    const w = this.element.offsetWidth || parseFloat(style.width) || 120,
      h = this.element.offsetHeight || parseFloat(style.height) || 220;
    const bounds = this.limits();
    if (w > bounds.right - bounds.left || h > bounds.bottom - bounds.top)
      return null;
    const fit = (a: number, b: number) => ({
      x: Math.max(bounds.left, Math.min(a, bounds.right - w)),
      y: Math.max(bounds.top, Math.min(b, bounds.bottom - h)),
    });
    const obstacles = [
      ...document.querySelectorAll(
        this.options.avoid ??
          'input,textarea,select,button,a,[data-amauti-avoid]',
      ),
    ]
      .filter((el) => !this.element.contains(el))
      .map((el) => el.getBoundingClientRect())
      .filter((r) => r.width && r.height);
    const free = (p: { x: number; y: number }) =>
      p.x + w <= bounds.right &&
      p.y + h <= bounds.bottom &&
      !obstacles.some(
        (r) =>
          p.x < r.right + 10 &&
          p.x + w > r.left - 10 &&
          p.y < r.bottom + 10 &&
          p.y + h > r.top - 10,
      );
    const desired = fit(x, y);
    if (free(desired)) return desired;
    const rows = [bounds.top, bounds.bottom - h];
    const cols = [bounds.left, bounds.right - w];
    for (let b = bounds.bottom - h; b >= bounds.top; b -= 25) rows.push(b);
    for (let a = bounds.left; a < bounds.right - w; a += 25) cols.push(a);
    for (const b of rows)
      for (const a of cols) {
        const p = fit(a, b);
        if (free(p)) return p;
      }
    return null;
  }
  private revalidatePosition() {
    const p = this.safe(this.position.x, this.position.y);
    if (!p) {
      this.hide(true);
      return;
    }
    if (
      Math.abs(p.x - this.position.x) < 1 &&
      Math.abs(p.y - this.position.y) < 1
    )
      return;
    this.motion?.kill();
    this.motion = null;
    this.position = p;
    gsap.set(this.element, { x: p.x, y: p.y });
    if (['walking', 'running', 'falling'].includes(this.state))
      this.setState(this.busy ? 'thinking' : 'idle');
  }
  moveTo(x: number, y: number, run = false) {
    if (this.paused || this.hidden) return false;
    this.endSizeGesture();
    this.motion?.kill();
    const width = this.element.offsetWidth,
      height = this.element.offsetHeight;
    const bounds = this.limits();
    const target = {
      x: Math.max(bounds.left, Math.min(x, bounds.right - width)),
      y: Math.max(bounds.top, Math.min(y, bounds.bottom - height)),
    };
    const obstacles = [
      ...document.querySelectorAll(
        this.options.avoid ??
          'input,textarea,select,button,a,[data-amauti-avoid]',
      ),
    ]
      .filter((el) => !this.element.contains(el))
      .map((el) => el.getBoundingClientRect())
      .filter((r) => r.width && r.height);
    const p = reachablePoint(this.position, target, width, height, obstacles);
    const distance = Math.hypot(p.x - this.position.x, p.y - this.position.y);
    if (distance < 3) {
      this.setState(this.busy ? 'thinking' : 'idle');
      return false;
    }
    if (
      this.animator instanceof SVGAnimator &&
      Math.abs(p.x - this.position.x) > 1
    )
      this.animator.face(p.x - this.position.x);
    this.setState(run ? 'running' : 'walking');
    const rect = this.actor.getBoundingClientRect();
    const speed =
      Math.min(rect.width / 240, rect.height / 340) * gaitSpeed(run);
    this.motion = gsap.to(this.element, {
      x: p.x,
      y: p.y,
      duration: this.reduced ? 0 : distance / Math.max(1, speed),
      ease: 'none',
      onUpdate: () => {
        this.position = {
          x: Number(gsap.getProperty(this.element, 'x')),
          y: Number(gsap.getProperty(this.element, 'y')),
        };
      },
      onComplete: () => {
        this.position = p;
        this.setState(this.busy ? 'thinking' : 'idle');
      },
    });
    return true;
  }
  home() {
    this.endSizeGesture();
    const p = this.safe(innerWidth - 195, innerHeight - 350);
    this.motion?.kill();
    if (p) {
      this.position = p;
      gsap.set(this.element, { x: p.x, y: p.y });
      if (['walking', 'running', 'falling'].includes(this.state))
        this.setState(this.busy ? 'thinking' : 'idle');
    } else {
      this.hide(true);
    }
  }
  private pointer(e: PointerEvent) {
    if (this.drag) {
      const d = this.drag;
      if (e.pointerId !== d.id) return;
      d.moved ||= Math.hypot(e.clientX - d.startX, e.clientY - d.startY) > 5;
      const bounds = this.limits();
      const x = Math.max(
        bounds.left,
        Math.min(e.clientX - d.x, bounds.right - this.element.offsetWidth),
      );
      const y = Math.max(
        bounds.top,
        Math.min(e.clientY - d.y, bounds.bottom - this.element.offsetHeight),
      );
      if (!this.reduced && this.animator instanceof SVGAnimator)
        this.animator.dragLean(x - this.position.x);
      this.position = { x, y };
      gsap.set(this.element, { x, y });
      return;
    }
    if (
      e.pointerType === 'touch' ||
      this.options.followCursor === false ||
      this.paused ||
      this.hidden ||
      this.state === 'sleeping' ||
      this.reduced
    )
      return;
    const r = this.actor.getBoundingClientRect();
    if (this.animator instanceof SVGAnimator)
      this.animator.look(
        Math.max(-1, Math.min(1, (e.clientX - r.x - r.width / 2) / 250)),
        Math.max(-1, Math.min(1, (e.clientY - r.y - r.height / 2) / 250)),
      );
  }
  private startDrag(e: PointerEvent) {
    if (
      !e.isPrimary ||
      this.options.allowDrag === false ||
      this.paused ||
      this.hidden ||
      e.button !== 0
    )
      return;
    this.endSizeGesture();
    this.activity();
    this.motion?.kill();
    this.actor.setPointerCapture(e.pointerId);
    this.drag = {
      id: e.pointerId,
      x: e.clientX - this.position.x,
      y: e.clientY - this.position.y,
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
      path: [{ ...this.position }],
    };
    this.setState('dragging');
  }
  private endDrag(e: PointerEvent) {
    if (!this.drag || e.pointerId !== this.drag.id) return;
    const moved = this.drag.moved,
      path = [...this.drag.path, { ...this.position }],
      cancelled = e.type !== 'pointerup';
    this.clickSuppressed = moved || cancelled;
    this.drag = null;
    this.revalidatePosition();
    if (this.hidden) return;
    if (moved && !cancelled) this.drop(path);
    else this.setState(this.busy ? 'thinking' : 'idle');
  }
  private drop(path: Point[]) {
    const obstacles = [
      ...document.querySelectorAll(
        this.options.avoid ??
          'input,textarea,select,button,a,[data-amauti-avoid]',
      ),
    ]
      .filter((el) => !this.element.contains(el))
      .map((el) => el.getBoundingClientRect())
      .filter((r) => r.width && r.height);
    const floor = Math.max(
      this.position.y,
      Math.min(path[0].y, this.limits().bottom - this.element.offsetHeight),
    );
    const end = reachablePoint(
      this.position,
      { x: this.position.x, y: floor },
      this.element.offsetWidth,
      this.element.offsetHeight,
      obstacles,
    );
    const distance = Math.max(0, end.y - this.position.y);
    if (this.reduced) {
      this.position = end;
      gsap.set(this.element, { x: end.x, y: end.y });
      this.setState(this.busy ? 'thinking' : 'idle');
      return;
    }
    if (distance < 1) {
      this.setState('landing');
      this.later(300);
      return;
    }
    const duration = Math.sqrt((2 * distance) / 1400);
    this.setState('falling');
    this.motion = gsap.to(this.element, {
      x: end.x,
      y: end.y,
      duration,
      ease: 'power1.in',
      onUpdate: () => {
        this.position = {
          x: Number(gsap.getProperty(this.element, 'x')),
          y: Number(gsap.getProperty(this.element, 'y')),
        };
      },
      onComplete: () => {
        this.position = end;
        this.setState('landing');
        this.later(300);
      },
    });
  }
  pause(value = true) {
    if (value) this.cancelAudibleSpeech();
    this.paused = value;
    this.syncPause();
    const b = this.element.querySelector('[data-tool="pause"]')!;
    b.textContent = value ? 'Reanudar' : 'Pausar';
    b.setAttribute('aria-pressed', String(value));
  }
  hide(forSpace = false) {
    this.spaceHidden = forSpace;
    this.hidden = true;
    this.motion?.kill();
    this.setState('hidden');
    this.element.hidden = true;
  }
  show() {
    if (!this.hidden) return;
    this.spaceHidden = false;
    this.hidden = false;
    this.element.hidden = false;
    this.element.dataset.state = 'idle';
    this.home();
    if (!this.hidden) {
      this.setState(this.busy ? 'thinking' : 'idle');
      this.activity();
    }
  }
  reducedMotion(value: boolean) {
    this.manualReduced = value;
    if (this.reduced) {
      this.motion?.kill();
      this.home();
    }
    this.setState(this.state);
  }
  act(id: number) {
    if (
      this.options.allowedActions &&
      !this.options.allowedActions.includes(id)
    )
      return;
    if (!implemented.has(id)) {
      this.say('Acción documentada; animación pendiente de producción.');
      return;
    }
    if (this.hidden) this.show();
    if (this.paused || this.hidden) return;
    this.activity();
    if (id === 1 || id === 2) {
      const right = innerWidth - this.element.offsetWidth - 12;
      const left = 12;
      const first = this.position.x > innerWidth / 2 ? left : right;
      if (
        !this.moveTo(first, this.position.y, id === 2) &&
        !this.moveTo(first === left ? right : left, this.position.y, id === 2)
      )
        this.say(
          'Aquí no tengo camino libre. Arrástrame a una zona despejada.',
        );
      return;
    }
    if (id === 8) {
      this.home();
      this.setState('idle');
      return;
    }
    if (id === 9) {
      if (this.animator instanceof SVGAnimator)
        this.animator.blink(this.reduced);
      return;
    }
    if (id === 17) {
      this.say('Mis ojos siguen tu cursor.');
      return;
    }
    if (id === 21) {
      this.say('Vamos paso a paso. ¡Tú puedes!');
      return;
    }
    if (id === 22) {
      this.say('Arrástrame o usa las flechas al enfocarme.');
      return;
    }
    if (id === 41) {
      this.say('Desplaza la página: buscaré un espacio libre.');
      return;
    }
    if (id === 45) {
      this.reducedMotion(!this.manualReduced);
      this.say(
        this.reduced
          ? 'Movimiento reducido activado.'
          : 'Movimiento normal activado.',
      );
      return;
    }
    if (id === 12) {
      this.expression('surprised');
      return;
    }
    const states: Record<number, State> = {
      3: 'jumping',
      11: 'winking',
      13: 'thinking',
      16: 'celebrating',
      18: 'greeting',
      19: 'greeting',
      23: 'greeting',
      26: 'sleeping',
      27: 'idle',
      31: 'idea',
      33: 'celebrating',
      35: 'greeting',
      36: 'thinking',
      37: 'celebrating',
      38: 'thinking',
      39: 'thinking',
      40: 'celebrating',
    };
    this.setState(states[id] ?? 'idle');
    if (id === 31) {
      this.say('¡Tengo una idea! Vamos a probar algo nuevo.');
      this.later(2900);
    } else if (id !== 26) this.later();
  }
  handle(type: PlatformEvent, message?: string) {
    if (type === 'ai:start') {
      this.busy = true;
      this.setState('thinking');
      this.say(message ?? 'Estoy procesando tu solicitud…');
      return;
    }
    this.busy = false;
    if (type === 'ai:error' || type === 'pedagogy:alert') {
      this.setState('thinking');
      this.say(message ?? 'Revisemos este punto. Puedes volver a intentarlo.');
    } else if (type === 'resource:recommended') {
      this.setState('greeting');
      this.say(message ?? 'Hay un recurso recomendado para ti.');
    } else {
      this.setState('celebrating');
      this.say(message ?? '¡Excelente! La plataforma confirmó que terminó.');
    }
    this.later(2600);
  }
  destroy() {
    cancelAnimationFrame(this.layoutFrame);
    this.endSizeGesture();
    this.stopVoice();
    this.abort.abort();
    this.timers.destroy();
    clearInterval(this.blinkTimer);
    this.motion?.kill();
    this.animator.destroy();
    this.element.remove();
  }
}
