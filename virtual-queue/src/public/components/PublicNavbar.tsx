import { useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { Button } from '@heroui/react'
import { Menu, X } from 'lucide-react'
import { Brand } from '@shared/brand/Brand'
import { publicNavLinks } from '@lib/siteConfig'
import { isAuthenticated } from '@lib/auth'

export function PublicNavbar() {
  const [open, setOpen] = useState(false)
  const authenticated = isAuthenticated()

  return (
    <header
      className="fixed inset-x-0 top-0 z-30 backdrop-blur-lg from-black to-transparent bg-linear-to-b"
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 'var(--space-md) clamp(1rem, 4vw, 1.5rem)',
      }}
    >
      <NavLink to="/" onClick={() => setOpen(false)}>
        <Brand />
      </NavLink>

      <div className="flex items-center gap-3">
        <div className="hidden md:block">
          {authenticated ? (
            <Link to="/home">
              <Button variant="primary" size="sm">
                Ir al panel
              </Button>
            </Link>
          ) : (
            <Link to="/login">
              <Button variant="primary" size="sm">
                Entrar
              </Button>
            </Link>
          )}
        </div>

        <button
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:text-foreground md:hidden"
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <nav
          className="absolute top-full left-0 right-0 border-b border-separator md:hidden"
          style={{ background: 'var(--color-paper)' }}
        >
          <div className="flex flex-col gap-1 px-4 py-3">
            {publicNavLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:text-foreground"
              >
                {link.label}
              </NavLink>
            ))}
            <div className="mt-2 border-t border-separator pt-3">
              {authenticated ? (
                <Link to="/home" onClick={() => setOpen(false)}>
                  <Button variant="primary" fullWidth>
                    Ir al panel
                  </Button>
                </Link>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link to="/registro" onClick={() => setOpen(false)}>
                    <Button variant="outline" fullWidth>
                      Registrarse
                    </Button>
                  </Link>
                  <Link to="/login" onClick={() => setOpen(false)}>
                    <Button variant="primary" fullWidth>
                      Iniciar sesión
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </nav>
      )}
    </header>
  )
}
