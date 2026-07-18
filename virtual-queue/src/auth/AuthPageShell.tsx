import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@heroui/react'
import { ChevronLeft } from 'lucide-react'
import { Brand } from '@shared/brand/Brand'
import { siteConfig } from '@lib/siteConfig'

interface AuthPageShellProps {
  children: ReactNode
}

export function AuthPageShell({ children }: AuthPageShellProps) {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-6">
      <Link to="/" className="absolute left-4 top-4 sm:left-6 sm:top-6">
        <Button
          variant="outline"
          size="sm"
          className="border-border/70 bg-surface/80 shadow-sm backdrop-blur-md transition-[background-color,box-shadow,border-color] hover:border-accent/40 hover:bg-accent-soft/50 hover:shadow-md"
        >
          <ChevronLeft size={16} strokeWidth={2.25} aria-hidden />
          Volver al inicio
        </Button>
      </Link>

      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <Brand />
          <p className="mt-1 text-sm text-muted">{siteConfig.tagline}</p>
        </div>

        {children}
      </div>
    </main>
  )
}
