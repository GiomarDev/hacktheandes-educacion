export function Flag({ size = 30 }: { size?: number }) {
  return (
    <div
      className="flex overflow-hidden rounded-sm"
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
            ? 'wordmark whitespace-nowrap text-white'
            : 'wordmark whitespace-nowrap text-ink'
        }
      >
        Amauti
      </span>
      <span className="hidden rounded border border-line bg-card px-2 py-1 min-[400px]:inline text-[0.75rem] font-medium text-muted">
        Piloto
      </span>
    </div>
  );
}
