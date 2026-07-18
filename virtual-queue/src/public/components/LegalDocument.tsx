import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Separator } from '@heroui/react'

export interface LegalSection {
  id: string
  title: string
  paragraphs: string[]
  bullets?: string[]
}

interface LegalDocumentProps {
  title: string
  summary: string
  lastUpdated: string
  effectiveDate: string
  sections: LegalSection[]
  footerNote?: ReactNode
}

export function LegalDocument({
  title,
  summary,
  lastUpdated,
  effectiveDate,
  sections,
  footerNote,
}: LegalDocumentProps) {
  return (
    <article className="mx-auto max-w-3xl">
      <header className="border-b border-border pb-8">
        <p className="text-xs font-medium uppercase tracking-wider text-muted">
          Documento legal
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted">{summary}</p>

        <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-medium text-foreground">Última actualización</dt>
            <dd className="mt-0.5 text-muted">{lastUpdated}</dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">Fecha de vigencia</dt>
            <dd className="mt-0.5 text-muted">{effectiveDate}</dd>
          </div>
        </dl>
      </header>

      <nav
        aria-label="Índice del documento"
        className="my-8 rounded-xl border border-border bg-surface-secondary/50 p-5"
      >
        <h2 className="text-sm font-semibold text-foreground">Índice</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-muted">
          {sections.map((section, index) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className="text-foreground transition-colors hover:text-accent"
              >
                {index + 1}. {section.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <Separator className="mb-10" />

      <div className="flex flex-col gap-10">
        {sections.map((section, index) => (
          <section
            key={section.id}
            id={section.id}
            className="scroll-mt-24"
          >
            <h2 className="text-lg font-semibold text-foreground">
              {index + 1}. {section.title}
            </h2>
            <div className="mt-3 space-y-3 text-sm leading-7 text-muted">
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            {section.bullets && section.bullets.length > 0 && (
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-muted">
                {section.bullets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>

      {footerNote && (
        <footer className="mt-12 border-t border-border pt-8 text-sm leading-relaxed text-muted">
          {footerNote}
        </footer>
      )}
    </article>
  )
}

export function LegalDocumentLink({
  to,
  children,
}: {
  to: string
  children: ReactNode
}) {
  return (
    <Link to={to} className="font-medium text-accent hover:underline">
      {children}
    </Link>
  )
}
