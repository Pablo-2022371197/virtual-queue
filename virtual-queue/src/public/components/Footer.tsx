import { Link } from 'react-router-dom'
import { Brand } from '@shared/brand/Brand'
import { SocialLinks } from './contact/SocialLinks'
import { complementaryLinks, siteConfig } from '@lib/siteConfig'

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-surface/60">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:px-8 md:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-4 lg:col-span-1">
          <Brand />
          <p className="text-sm text-muted">{siteConfig.tagline}</p>
          <SocialLinks />
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold text-foreground">
            Páginas complementarias
          </h3>
          <ul className="flex flex-col gap-2">
            {complementaryLinks.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className="text-sm text-muted transition-colors hover:text-accent"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold text-foreground">
            Datos de contacto
          </h3>
          <ul className="flex flex-col gap-2 text-sm text-muted">
            <li>
              <a href={`tel:${siteConfig.contact.phone}`} className="hover:text-accent">
                {siteConfig.contact.phone}
              </a>
            </li>
            <li>
              <a href={`mailto:${siteConfig.contact.email}`} className="hover:text-accent">
                {siteConfig.contact.email}
              </a>
            </li>
            <li>{siteConfig.contact.address}</li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold text-foreground">
            Mapa de ubicación
          </h3>
          <div className="overflow-hidden rounded-xl border border-border">
            <iframe
              src={siteConfig.mapEmbedUrl}
              title="Ubicación de Turnix"
              className="h-36 w-full"
              loading="lazy"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-separator px-4 py-4 text-center text-xs text-muted sm:px-6">
        © {new Date().getFullYear()} {siteConfig.name} · Todos los derechos reservados
      </div>
    </footer>
  )
}
