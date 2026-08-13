import { TurnixMark } from './TurnixMark'

interface BrandProps {
  className?: string
  /** Hide the wordmark (icon-only, e.g. tight headers). */
  markOnly?: boolean
}

export function Brand({ className, markOnly = false }: BrandProps) {
  return (
    <span
      className={`inline-flex items-center gap-2.5 font-semibold ${className ?? ''}`}
    >
      <TurnixMark size={32} />
      {!markOnly && (
        <span
          className="text-[15px] tracking-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          <span className="text-foreground">Turn</span>
          <span className="text-accent">ix</span>
        </span>
      )}
    </span>
  )
}
