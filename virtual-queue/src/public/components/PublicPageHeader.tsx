interface PublicPageHeaderProps {
  title: string
  description: string
  badge?: string
}

export function PublicPageHeader({ title, description, badge }: PublicPageHeaderProps) {
  return (
    <header className="flex flex-col gap-3">
      {badge && (
        <span className="w-fit rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent-soft-foreground">
          {badge}
        </span>
      )}
      <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
        {title}
      </h1>
      <p className="max-w-2xl text-muted leading-relaxed">{description}</p>
    </header>
  )
}
