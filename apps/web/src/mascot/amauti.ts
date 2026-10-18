import { AmautiController } from './amauti-controller';
import './amauti.css';
export const enabledActions = [
  'wave',
  'walk',
  'jump',
  'blink',
  'wink',
  'idea',
  'celebrate',
  'sleep',
  'wake',
  'talk',
  'surprised',
  'scared',
  'grow',
  'shrink',
  'drag',
  'look',
] as const;
export class Amauti {
  private pet = new AmautiController({
    autoBlink: true,
    allowKeyboardMove: true,
    allowedActions: [18, 1, 3, 9, 11, 31, 16, 26, 27, 12],
    autoWelcome: true,
    allowDrag: true,
    followCursor: true,
    idleMs: 45000,
  });
  run(
    action: string,
    message = '¡Hola! Soy Amauti. Aprendamos juntos.',
    voice = false,
  ) {
    if (!(enabledActions as readonly string[]).includes(action))
      throw Error('Acción no incluida en esta exportación: ' + action);
    const ids: Record<string, number> = {
      wave: 18,
      walk: 1,
      jump: 3,
      blink: 9,
      wink: 11,
      idea: 31,
      celebrate: 16,
      sleep: 26,
      wake: 27,
      surprised: 12,
    };
    if (action in ids) this.pet.act(ids[action]);
    else if (action === 'talk') this.pet.speak(message, voice);
    else if (action === 'scared') this.pet.expression('scared');
    else if (action === 'grow' || action === 'shrink')
      return this.pet.pulseSize(action === 'grow' ? 1.5 : 0.75);
    else
      this.pet.say(
        action === 'drag'
          ? 'Puedes arrastrarme.'
          : 'Mis ojos siguen el cursor.',
      );
    return true;
  }
  pause(value = true) {
    this.pet.pause(value);
  }
  show() {
    this.pet.show();
  }
  hide() {
    this.pet.hide();
  }
  destroy() {
    this.pet.destroy();
  }
}
