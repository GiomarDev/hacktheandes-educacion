import { addGait } from '@/features/mascot/amauti-gait';
import { gsap } from 'gsap';
export type State =
  | 'idle'
  | 'walking'
  | 'running'
  | 'jumping'
  | 'greeting'
  | 'thinking'
  | 'working'
  | 'celebrating'
  | 'sleeping'
  | 'dragging'
  | 'falling'
  | 'landing'
  | 'hidden'
  | 'winking'
  | 'idea'
  | 'talking'
  | 'surprised'
  | 'scared';
export interface Animator {
  play(state: State, reduced: boolean): void;
  pause(value: boolean): void;
  destroy(): void;
}
/** Renderer contract: a future Rive adapter can implement Animator without changing the controller. */
export class SVGAnimator implements Animator {
  private timeline = gsap.timeline();
  private facing = 1;
  private previousState: State = 'idle';
  private extras: gsap.core.Tween[] = [];
  private part = (name: string) =>
    this.svg.querySelector(`[data-part="${name}"]`)!;
  constructor(private svg: SVGSVGElement) {}
  face(direction: number) {
    this.facing = direction < 0 ? -1 : 1;
    gsap.set(this.svg, { scaleX: this.facing });
  }
  play(state: State, reduced = false) {
    const settling =
      state === 'idle' &&
      ['walking', 'running'].includes(this.previousState) &&
      !reduced;
    const oldLimbs = settling
      ? ['leg-left', 'leg-right', 'arm-left', 'arm-right'].map((name) => ({
          name,
          d: this.part(name).querySelector('path')!.getAttribute('d')!,
        }))
      : [];
    const oldHands = settling
      ? ['arm-left', 'arm-right'].map((name) => ({
          name,
          cx: this.part(name).querySelector('circle')!.getAttribute('cx')!,
          cy: this.part(name).querySelector('circle')!.getAttribute('cy')!,
        }))
      : [];
    this.previousState = state;
    this.timeline.kill();
    this.extras.forEach((t) => t.kill());
    this.extras = [];
    gsap.killTweensOf(this.svg.querySelectorAll('*'));
    const p = this.part;
    const limb = (name: string) => p(name).querySelector('path')!;
    // Identical path commands let GSAP interpolate every joint continuously.
    const legs = {
      left: 'M103 277 L101 294 L99 311 L85 311',
      right: 'M137 277 L140 294 L143 311 L156 311',
    };
    const arms = {
      left: 'M73 165 Q46 177 36 207',
      right: 'M167 165 Q194 177 204 207',
    };
    gsap.set(limb('leg-left'), { attr: { d: legs.left } });
    gsap.set(limb('leg-right'), { attr: { d: legs.right } });
    gsap.set(limb('arm-left'), { attr: { d: arms.left } });
    gsap.set(limb('arm-right'), { attr: { d: arms.right } });
    gsap.set(p('arm-left').querySelector('circle'), {
      attr: { cx: 36, cy: 207 },
    });
    gsap.set(p('arm-right').querySelector('circle'), {
      attr: { cx: 204, cy: 207 },
    });
    gsap.set(this.svg.querySelectorAll('[data-part]'), {
      clearProps: 'transform,transformOrigin',
    });
    gsap.set(
      [
        p('zzz'),
        p('idea'),
        p('sparkles'),
        p('brows'),
        p('closed-eyes'),
        p('sleep-eyes'),
        p('sleep-mouth'),
      ],
      { opacity: 0 },
    );
    gsap.set([p('eyes'), p('mouth')], { opacity: 1 });
    gsap.set(p('eye-right'), { opacity: 1 });
    gsap.set(p('mouth'), {
      attr: {
        d: 'M108 174 Q120 179 132 174 Q130 192 120 192 Q110 192 108 174Z',
      },
    });
    gsap.set(p('brows').querySelectorAll('path')[0], {
      attr: { d: 'M88 137 L103 132' },
    });
    gsap.set(p('brows').querySelectorAll('path')[1], {
      attr: { d: 'M137 132 L152 137' },
    });
    gsap.set(p('rig'), { svgOrigin: '120 305' });
    gsap.set(p('shadow'), { svgOrigin: '120 318', scaleX: 1, opacity: 0.08 });
    for (const side of ['left', 'right']) {
      gsap.set(p(`arm-${side}`), {
        svgOrigin: `${side === 'left' ? 73 : 167} 165`,
      });
      gsap.set(p(`leg-${side}`), {
        svgOrigin: `${side === 'left' ? 103 : 137} 277`,
      });
    }
    if (state === 'celebrating') {
      gsap.set(p('eyes'), { opacity: 0 });
      gsap.set(p('closed-eyes'), { opacity: 1 });
    }
    if (state === 'sleeping') {
      gsap.set([p('eyes'), p('mouth')], { opacity: 0 });
      gsap.set([p('sleep-eyes'), p('sleep-mouth')], { opacity: 1 });
      gsap.set(p('mouth'), {
        attr: {
          d: 'M117 178 Q120 175 123 178 Q125 185 120 185 Q115 185 117 178Z',
        },
      });
      gsap.set(p('zzz'), { y: 90, opacity: reduced ? 1 : 0 });
      if (reduced) {
        gsap.set(p('rig'), {
          svgOrigin: '120 170',
          rotation: -82,
          scale: 0.62,
          y: 113,
        });
        gsap.set(limb('arm-left'), { attr: { d: 'M73 165 Q90 185 108 180' } });
        gsap.set(limb('arm-right'), {
          attr: { d: 'M167 165 Q150 185 132 180' },
        });
        gsap.set(p('arm-left').querySelector('circle'), {
          attr: { cx: 108, cy: 180 },
        });
        gsap.set(p('arm-right').querySelector('circle'), {
          attr: { cx: 132, cy: 180 },
        });
      }
    }
    if (state === 'thinking') gsap.set([p('idea'), p('brows')], { opacity: 1 });
    if (state === 'celebrating') gsap.set(p('sparkles'), { opacity: 1 });
    if (state === 'winking')
      gsap.set(p('eye-right'), { scaleY: 0.12, transformOrigin: '50% 50%' });
    if (state === 'idea' && reduced) {
      gsap.set(p('idea'), { opacity: 1 });
      gsap.set(limb('arm-right'), { attr: { d: 'M167 165 Q193 150 199 122' } });
      gsap.set(p('arm-right').querySelector('circle'), {
        attr: { cx: 199, cy: 122 },
      });
    }
    if (state === 'surprised' || state === 'scared') {
      gsap.set(p('eyes'), { scaleY: 1.3, svgOrigin: '120 153' });
      gsap.set(p('brows'), { opacity: 1, y: -5 });
      gsap.set(p('mouth'), {
        attr: {
          d: 'M113 179 Q120 172 127 179 Q130 197 120 197 Q110 197 113 179Z',
        },
      });
      gsap.set(p('arm-left'), { rotation: state === 'scared' ? 115 : 55 });
      gsap.set(p('arm-right'), { rotation: state === 'scared' ? -115 : -55 });
      if (state === 'scared')
        gsap.set(p('rig'), { scaleY: 0.95, rotation: -5 });
    }
    if (reduced) return;
    for (const old of oldLimbs) {
      const path = limb(old.name),
        target = path.getAttribute('d')!;
      this.extras.push(
        gsap.fromTo(
          path,
          { attr: { d: old.d } },
          { attr: { d: target }, duration: 0.3, ease: 'sine.out' },
        ),
      );
    }
    for (const old of oldHands) {
      const hand = p(old.name).querySelector('circle')!;
      const target = {
        cx: hand.getAttribute('cx')!,
        cy: hand.getAttribute('cy')!,
      };
      this.extras.push(
        gsap.fromTo(
          hand,
          { attr: { cx: old.cx, cy: old.cy } },
          { attr: target, duration: 0.3, ease: 'sine.out' },
        ),
      );
    }
    const t = (this.timeline = gsap.timeline({ repeat: -1 }));
    if (state === 'talking') {
      gsap.set(p('mouth'), { svgOrigin: '120 179' });
      t.to(p('mouth'), { scaleY: 0.25, scaleX: 0.8, duration: 0.11 })
        .to(p('mouth'), { scaleY: 1.15, scaleX: 1, duration: 0.14 })
        .to(p('mouth'), { scaleY: 0.45, scaleX: 1.1, duration: 0.1 })
        .to(p('mouth'), { scaleY: 0.85, scaleX: 0.75, duration: 0.15 })
        .to(
          p('pencil'),
          { rotation: 1.5, svgOrigin: '120 265', duration: 0.25 },
          0,
        )
        .to(p('pencil'), { rotation: -1, duration: 0.25 }, 0.25);
    } else if (state === 'surprised') {
      t.to(p('rig'), {
        y: -10,
        scaleY: 1.035,
        duration: 0.2,
        ease: 'power2.out',
      })
        .to(p('rig'), { y: 0, scaleY: 1, duration: 0.5, ease: 'bounce.out' })
        .to({}, { duration: 0.7 });
    } else if (state === 'scared') {
      t.to(p('rig'), { x: 2, rotation: -4, duration: 0.08 })
        .to(p('rig'), { x: -2, rotation: -6, duration: 0.08 })
        .to(p('rig'), { x: 0, rotation: -5, duration: 0.08 });
    } else if (state === 'winking') {
      t.to(p('rig'), { rotation: 6, duration: 0.3 })
        .to(p('eye-right'), { scaleY: 1, duration: 0.15 }, 0.75)
        .to(p('rig'), { rotation: 0, duration: 0.3 })
        .to({}, { duration: 1 });
    } else if (state === 'idea') {
      t.repeat(0);
      gsap.set(p('idea'), {
        opacity: 0,
        scale: 0.65,
        svgOrigin: '200 116',
        y: 8,
      });
      gsap.set(p('idea-halo'), { opacity: 0, svgOrigin: '200 83' });
      gsap.set(p('idea-rays'), { opacity: 0 });
      gsap.set(p('eyes'), { svgOrigin: '120 153' });
      // Consider, discover, then point to the lit bulb. One reveal, no flashing loop.
      t.to(
        limb('arm-left'),
        {
          attr: { d: 'M73 165 Q76 180 105 184' },
          duration: 0.32,
          ease: 'sine.inOut',
        },
        0,
      )
        .to(
          p('arm-left').querySelector('circle'),
          { attr: { cx: 105, cy: 184 }, duration: 0.32, ease: 'sine.inOut' },
          0,
        )
        .to(
          p('pencil'),
          {
            rotation: -4,
            svgOrigin: '120 265',
            duration: 0.32,
            ease: 'sine.inOut',
          },
          0,
        )
        .to(p('eyes'), { scaleY: 0.65, duration: 0.25 }, 0)
        .to(p('brows'), { opacity: 1, duration: 0.2 }, 0)
        .to({}, { duration: 0.28 }, 0.32)
        .to(
          p('pencil'),
          { rotation: 1.5, duration: 0.3, ease: 'back.out(1.2)' },
          0.6,
        )
        .to(p('eyes'), { scaleY: 1.18, duration: 0.18 }, 0.6)
        .to(p('brows'), { y: -5, duration: 0.2 }, 0.6)
        .to(
          limb('arm-right'),
          {
            attr: { d: 'M167 165 Q193 150 199 122' },
            duration: 0.38,
            ease: 'power2.out',
          },
          0.62,
        )
        .to(
          p('arm-right').querySelector('circle'),
          { attr: { cx: 199, cy: 122 }, duration: 0.38, ease: 'power2.out' },
          0.62,
        )
        .to(
          p('idea'),
          { opacity: 1, scale: 1, y: 0, duration: 0.38, ease: 'back.out(1.6)' },
          0.75,
        )
        .to(
          p('idea-halo'),
          { opacity: 0.45, scale: 1.1, duration: 0.32, ease: 'sine.out' },
          0.8,
        )
        .to(p('idea-rays'), { opacity: 1, duration: 0.22 }, 0.9)
        .to(p('eyes'), { scaleY: 1, duration: 0.2 }, 1.05)
        .to(p('brows'), { opacity: 0, duration: 0.25 }, 1.05)
        .to(
          p('idea-halo'),
          { opacity: 0.2, scale: 1, duration: 0.4, ease: 'sine.inOut' },
          1.15,
        )
        .to(limb('arm-left'), { attr: { d: arms.left }, duration: 0.35 }, 1.15)
        .to(
          p('arm-left').querySelector('circle'),
          { attr: { cx: 36, cy: 207 }, duration: 0.35 },
          1.15,
        )
        .to(p('pencil'), { rotation: 0, duration: 0.35 }, 1.4)
        .to({}, { duration: 0.7 }, 1.75)
        .to(p('idea'), { opacity: 0, y: -3, duration: 0.3 }, 2.45)
        .to(limb('arm-right'), { attr: { d: arms.right }, duration: 0.3 }, 2.45)
        .to(
          p('arm-right').querySelector('circle'),
          { attr: { cx: 204, cy: 207 }, duration: 0.3 },
          2.45,
        );
    } else if (state === 'walking' || state === 'running') {
      addGait(t, this.svg, state === 'running');
    } else if (state === 'greeting') {
      t.to(p('arm-right'), { rotation: -145, duration: 0.35 })
        .to(p('arm-right'), {
          rotation: -115,
          duration: 0.22,
          repeat: 3,
          yoyo: true,
        })
        .to(p('arm-right'), { rotation: 0, duration: 0.3 });
    } else if (state === 'jumping' || state === 'celebrating') {
      t.to(p('rig'), {
        scaleY: 0.88,
        scaleX: 1.08,
        rotation: -3,
        duration: 0.2,
        ease: 'power2.in',
      })
        .to(p('rig'), {
          y: -65,
          scaleY: 1.08,
          scaleX: 0.94,
          rotation: 3,
          duration: 0.32,
          ease: 'power2.out',
        })
        .to(
          [p('arm-left'), p('arm-right')],
          { rotation: (i: number) => (i ? -145 : 145), duration: 0.26 },
          0.2,
        )
        .to(p('leg-left'), { rotation: 22, duration: 0.3 }, 0.2)
        .to(p('leg-right'), { rotation: -22, duration: 0.3 }, 0.2)
        .to(p('shadow'), { scaleX: 0.55, opacity: 0.035, duration: 0.32 }, 0.2)
        .to(
          p('rig'),
          {
            y: 0,
            scaleY: 0.9,
            scaleX: 1.08,
            rotation: 0,
            duration: 0.3,
            ease: 'power2.in',
          },
          0.52,
        )
        .to(p('shadow'), { scaleX: 1.1, opacity: 0.1, duration: 0.3 }, 0.52)
        .to(
          [p('leg-left'), p('leg-right')],
          { rotation: 0, duration: 0.25 },
          0.57,
        )
        .to(
          p('rig'),
          { scaleX: 1, scaleY: 1, duration: 0.3, ease: 'back.out(2)' },
          0.82,
        )
        .to(p('shadow'), { scaleX: 1, opacity: 0.08, duration: 0.3 }, 0.82)
        .to(
          [p('arm-left'), p('arm-right')],
          { rotation: 0, duration: 0.3 },
          0.82,
        )
        .to({}, { duration: 0.45 });
    } else if (state === 'thinking' || state === 'working') {
      t.to(p('arm-left'), { rotation: 110, duration: 0.5 })
        .to(p('pencil'), {
          rotation: 4,
          transformOrigin: '50% 70%',
          duration: 1,
          yoyo: true,
          repeat: 1,
        })
        .to({}, { duration: 0.5 });
    } else if (state === 'sleeping') {
      t.repeat(0);
      gsap.set(p('rig'), { svgOrigin: '120 170' });
      t.to(
        limb('arm-left'),
        {
          attr: { d: 'M73 165 Q90 185 108 180' },
          duration: 0.35,
          ease: 'sine.inOut',
        },
        0,
      )
        .to(
          p('arm-left').querySelector('circle'),
          { attr: { cx: 108, cy: 180 }, duration: 0.35 },
          0,
        )
        .to(
          limb('arm-right'),
          {
            attr: { d: 'M167 165 Q150 185 132 180' },
            duration: 0.35,
            ease: 'sine.inOut',
          },
          0,
        )
        .to(
          p('arm-right').querySelector('circle'),
          { attr: { cx: 132, cy: 180 }, duration: 0.35 },
          0,
        )
        .to(p('leg-left'), { rotation: 20, duration: 0.35 }, 0)
        .to(p('leg-right'), { rotation: -20, duration: 0.35 }, 0)
        .to(
          p('rig'),
          {
            rotation: -82,
            scale: 0.62,
            y: 113,
            duration: 0.8,
            ease: 'sine.inOut',
          },
          0,
        )
        .to(p('shadow'), { scaleX: 1.35, opacity: 0.09, duration: 0.8 }, 0)
        .to(p('zzz'), { opacity: 1, duration: 0.45 }, 0.55);
      const breathing = gsap.timeline({ repeat: -1 });
      breathing
        .to(
          p('pencil'),
          {
            scaleX: 1.018,
            scaleY: 1.012,
            svgOrigin: '120 170',
            duration: 1.8,
            ease: 'sine.inOut',
          },
          0,
        )
        .to(
          p('sleep-mouth'),
          {
            scale: 1.08,
            svgOrigin: '120 181',
            duration: 1.8,
            ease: 'sine.inOut',
          },
          0,
        )
        .to(
          p('pencil'),
          { scaleX: 1, scaleY: 1, duration: 2, ease: 'sine.inOut' },
          1.8,
        )
        .to(
          p('sleep-mouth'),
          { scale: 1, duration: 2, ease: 'sine.inOut' },
          1.8,
        );
      t.add(breathing, 0.8);
      const letters = gsap.timeline({ repeat: -1 });
      letters
        .fromTo(
          p('zzz').querySelectorAll('text'),
          { y: 5, opacity: 0.3 },
          { y: -7, opacity: 1, stagger: 0.28, duration: 1.4, ease: 'sine.out' },
        )
        .to(p('zzz').querySelectorAll('text'), {
          y: -10,
          opacity: 0.25,
          stagger: 0.22,
          duration: 1.4,
          ease: 'sine.in',
        });
      t.add(letters, 0.8);
    } else if (state === 'dragging') {
      gsap.set(p('rig'), { svgOrigin: '120 65' });
      gsap.set(p('arm-left'), { rotation: 45 });
      gsap.set(p('arm-right'), { rotation: -45 });
      gsap.set(p('shadow'), { opacity: 0.025, scaleX: 0.65 });
      t.to(p('rig'), { rotation: 3, duration: 0.45, ease: 'sine.inOut' })
        .to(p('rig'), { rotation: -3, duration: 0.45, ease: 'sine.inOut' })
        .to(p('leg-left'), { rotation: 14, duration: 0.45 }, 0)
        .to(p('leg-right'), { rotation: -8, duration: 0.45 }, 0)
        .to(p('leg-left'), { rotation: -8, duration: 0.45 }, 0.45)
        .to(p('leg-right'), { rotation: 14, duration: 0.45 }, 0.45);
    } else if (state === 'falling') {
      t.repeat(0);
      gsap.set(p('rig'), { rotation: 0, scale: 1 });
      gsap.set(p('shadow'), { opacity: 0.025, scaleX: 0.55 });
      t.to(p('arm-left'), { rotation: 18, duration: 0.15 })
        .to(p('arm-right'), { rotation: -18, duration: 0.15 }, 0)
        .to(p('shadow'), { opacity: 0.08, scaleX: 1, duration: 0.4 }, 0);
    } else if (state === 'landing') {
      t.repeat(0);
      t.to(p('rig'), {
        scaleY: 0.96,
        scaleX: 1.025,
        duration: 0.09,
        ease: 'power2.out',
      }).to(p('rig'), {
        y: 0,
        scaleY: 1,
        scaleX: 1,
        duration: 0.18,
        ease: 'sine.out',
      });
    } else {
      t.to(p('rig'), {
        y: -3,
        rotation: -2,
        duration: 1.6,
        ease: 'sine.inOut',
      }).to(p('rig'), { y: 0, rotation: 1, duration: 1.6, ease: 'sine.inOut' });
    }
  }
  blink(reduced = false) {
    if (reduced) return;
    this.extras = this.extras.filter((t) => t.isActive() || t.paused());
    this.extras.push(
      gsap.to(this.part('eyes'), {
        scaleY: 0.08,
        transformOrigin: '50% 50%',
        duration: 0.09,
        repeat: 1,
        yoyo: true,
      }),
    );
  }
  look(x: number, y: number) {
    gsap.set(this.part('eyes'), { x: x * 3 * this.facing, y: y * 2 });
  }
  dragLean(delta: number) {
    this.extras = this.extras.filter((t) => t.isActive() || t.paused());
    this.extras.push(
      gsap.to(this.part('pencil'), {
        rotation: Math.max(-10, Math.min(10, -delta * 0.45)),
        svgOrigin: '120 65',
        duration: 0.18,
        ease: 'sine.out',
        overwrite: true,
      }),
    );
  }
  pause(value: boolean) {
    this.timeline.paused(value);
    this.extras.forEach((t) => t.paused(value));
  }
  destroy() {
    this.timeline.kill();
    this.extras.forEach((t) => t.kill());
    this.extras = [];
    gsap.killTweensOf(this.svg.querySelectorAll('*'));
  }
}
