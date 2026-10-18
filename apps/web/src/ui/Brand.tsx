export function Flag({ size = 30 }: { size?: number }) {
  return (
    <div
      className="flex overflow-hidden rounded shadow-sm"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <div className="flex-1 bg-peru" />
      <div className="flex-1 bg-white" />
      <div className="flex-1 bg-peru" />
    </div>
  );
}

export function Wordmark({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={
          light
            ? 'text-[15px] font-semibold whitespace-nowrap text-white'
            : 'text-[15px] font-semibold whitespace-nowrap text-ink'
        }
      >
        Centinela Escolar
      </span>
      <span className="hidden rounded bg-peru px-1.5 py-0.5 font-mono min-[400px]:inline text-[9.5px] font-medium tracking-wider text-white">
        PILOTO
      </span>
    </div>
  );
}
