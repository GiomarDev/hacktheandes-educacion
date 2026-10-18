export function LandingFooter() {
  return (
    <footer className="border-t border-[color:var(--l-line)] bg-[color:var(--l-band)]">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 px-4 py-6 text-[0.875rem] text-[color:var(--l-ink-2)] lg:px-8">
        <p>
          <span className="font-semibold text-[color:var(--l-ink)]">
            SIAGIE · Alerta · SIMON · ESCALE
          </span>
          <span className="mx-2" aria-hidden>
            ·
          </span>
          Microdatos abiertos oficiales MINEDU
        </p>
        <p className="tabular-nums">
          Amauti · Piloto educativo · Hack the Andes · v0.1.0 · piloto
        </p>
      </div>
    </footer>
  );
}
