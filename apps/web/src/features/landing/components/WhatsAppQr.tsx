import { MessageCircle } from 'lucide-react';
import qr from '@/features/landing/assets/amauti-whatsapp-qr.png';

// Contacto de Amauti en WhatsApp (el QR codifica este mismo enlace).
export const AMAUTI_WHATSAPP = 'https://wa.me/qr/5VWAQAN76DUDO1';

export function WhatsAppQr() {
  return (
    <figure className="w-full max-w-[260px] shrink-0 rounded-xl bg-white p-5 text-center text-[color:var(--l-ink)] shadow-sm">
      <figcaption className="mb-3">
        <span className="l-serif block text-[1.375rem] leading-tight">
          Habla con Amauti
        </span>
        <span className="text-[0.875rem] text-[color:var(--l-ink-2)]">
          Contacto de WhatsApp
        </span>
      </figcaption>
      <img
        src={qr}
        width={420}
        height={420}
        loading="lazy"
        alt="Código QR del contacto de Amauti en WhatsApp"
        className="mx-auto aspect-square w-full max-w-[200px] rounded-md border border-[color:var(--l-line)] p-2"
      />
      <p className="mt-3 text-[0.8125rem] leading-snug text-[color:var(--l-ink-2)]">
        Escanéalo con la cámara de WhatsApp para obtener el número.
      </p>
      <a
        href={AMAUTI_WHATSAPP}
        target="_blank"
        rel="noreferrer"
        className="l-btn mt-3 w-full bg-[#1fa463] text-white hover:bg-[#178a52]"
      >
        <MessageCircle className="size-4" aria-hidden /> Abrir WhatsApp
      </a>
    </figure>
  );
}
