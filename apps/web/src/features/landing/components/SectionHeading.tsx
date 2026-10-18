import type { ReactNode } from 'react';

// Encabezado editorial: kicker, título serif, subtítulo y la barra ámbar de 36 × 3 px.
export function SectionHeading({
  kicker,
  title,
  subtitle,
  as: Tag = 'h2',
  className = '',
}: {
  kicker: string;
  title: ReactNode;
  subtitle?: ReactNode;
  as?: 'h2' | 'h3';
  className?: string;
}) {
  return (
    <header className={className}>
      <p className="l-kicker">{kicker}</p>
      <Tag className="l-serif mt-2 max-w-[24ch] text-[clamp(1.875rem,1.4rem+1.6vw,2.75rem)] leading-[1.12] text-[color:var(--l-ink)]">
        {title}
      </Tag>
      {subtitle && (
        <p className="l-sub mt-4 max-w-[68ch] text-[1.0625rem]">{subtitle}</p>
      )}
      <div className="l-bar mt-5" aria-hidden />
    </header>
  );
}
