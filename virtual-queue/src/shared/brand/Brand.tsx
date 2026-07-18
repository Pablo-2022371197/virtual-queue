interface BrandProps {
  className?: string
}

export function Brand({ className }: BrandProps) {
  return (
    <span
      className={`inline-flex items-center gap-2.5 font-semibold ${className ?? ''}`}
    >
      <span
        className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent text-xs font-bold text-accent-foreground shadow-md shadow-accent/25"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        T
      </span>
      <span
        className="text-[15px] tracking-tight text-foreground"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Turnix
      </span>
    </span>
  )
}
