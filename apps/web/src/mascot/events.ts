import type { PlatformEvent } from './amauti-controller';

// Avisa a Amauti de algo que pasó en la plataforma (guardar, generar, aprobar).
// Si la mascota está oculta o no existe, el evento se ignora.
export function notifyMascot(type: PlatformEvent, message?: string) {
  window.dispatchEvent(
    new CustomEvent('amauti:event', { detail: { type, message } }),
  );
}
