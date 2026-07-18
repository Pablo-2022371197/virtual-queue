import { Card, Chip } from '@heroui/react'
import { Clock, Mail, MapPin, Phone } from 'lucide-react'
import { ContactForm } from '@public/components/contact/ContactForm'
import { SocialLinks } from '@public/components/contact/SocialLinks'
import { PublicPageHeader } from '@public/components/PublicPageHeader'
import { siteConfig } from '@lib/siteConfig'

const contactItems = [
  {
    Icon: Phone,
    label: 'Teléfono',
    value: siteConfig.contact.phone,
    href: `tel:${siteConfig.contact.phone}`,
  },
  {
    Icon: Mail,
    label: 'Correo',
    value: siteConfig.contact.email,
    href: `mailto:${siteConfig.contact.email}`,
  },
  {
    Icon: MapPin,
    label: 'Dirección',
    value: siteConfig.contact.address,
  },
  {
    Icon: Clock,
    label: 'Horario de atención',
    value: 'Lunes a viernes · 8:00 – 17:00',
  },
]

export default function ContactPage() {
  return (
    <article className="flex flex-col gap-10">
      <PublicPageHeader
        badge="Soporte"
        title="Contacto"
        description="Estamos aquí para ayudarte con dudas sobre el proyecto, soporte técnico o alianzas con establecimientos."
      />

      <div className="flex flex-wrap gap-2">
        <Chip variant="soft" color="accent">Respuesta en 24–48 h</Chip>
        <Chip variant="soft">Soporte en español</Chip>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <div className="grid gap-3 sm:grid-cols-2">
            {contactItems.map((item) => (
              <Card key={item.label} variant="secondary">
                <Card.Content className="flex gap-3 py-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
                    <item.Icon size={18} strokeWidth={1.75} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground">{item.label}</p>
                    {item.href ? (
                      <a
                        href={item.href}
                        className="mt-0.5 text-sm text-muted hover:text-accent"
                      >
                        {item.value}
                      </a>
                    ) : (
                      <p className="mt-0.5 text-sm text-muted">{item.value}</p>
                    )}
                  </div>
                </Card.Content>
              </Card>
            ))}
          </div>

          <div>
            <p className="mb-3 text-sm font-medium text-foreground">Redes sociales</p>
            <SocialLinks />
          </div>

          <div className="overflow-hidden rounded-xl border border-border">
            <iframe
              src={siteConfig.mapEmbedUrl}
              title="Ubicación UTEQ Querétaro"
              className="h-52 w-full"
              loading="lazy"
            />
          </div>
        </div>

        <Card>
          <Card.Header>
            <Card.Title>Formulario de contacto</Card.Title>
            <Card.Description>
              Completa el formulario y te responderemos pronto.
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <ContactForm />
          </Card.Content>
        </Card>
      </div>
    </article>
  )
}
