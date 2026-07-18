import { Link } from 'react-router-dom'
import { Button, Card, Chip } from '@heroui/react'
import {
  Ticket,
  Smartphone,
  Bell,
  Clock,
  BarChart3,
  ChevronRight,
} from 'lucide-react'
import { ContactForm } from '@public/components/contact/ContactForm'
import { SocialLinks } from '@public/components/contact/SocialLinks'
import { siteConfig } from '@lib/siteConfig'

const workflowStages = [
  {
    num: '01',
    title: 'Registrate',
    body: 'Crea tu cuenta en segundos. Sin papeleo, sin filas.',
  },
  {
    num: '02',
    title: 'Busca tu lugar',
    body: 'Encuentra el establecimiento y únete a su cola virtual.',
  },
  {
    num: '03',
    title: 'Toma tu turno',
    body: 'Turnix asigna tu número y te muestra tu posición en la fila.',
  },
  {
    num: '04',
    title: 'Recibe avisos',
    body: 'Notificaciones push te avisan cuando se acerca tu momento.',
  },
  {
    num: '05',
    title: 'Te llaman',
    body: 'Llega cuando tu turno esté listo. Sin esperas innecesarias.',
  },
]

const benefits = [
  {
    Icon: Clock,
    title: 'Sin esperas innecesarias',
    text: 'Toma tu turno desde el móvil y recibe avisos cuando se acerque tu momento.',
  },
  {
    Icon: Smartphone,
    title: 'Notificaciones en tiempo real',
    text: 'Integración con Firebase y wearables para que nunca pierdas tu turno.',
  },
  {
    Icon: BarChart3,
    title: 'Filas organizadas',
    text: 'Los establecimientos gestionan su cola virtual de forma eficiente y transparente.',
  },
]

export default function LandingPage() {
  return (
    <div className="flex flex-col gap-24">
      {/* ── Hero ── */}
      <section className="mt-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between lg:gap-16">
          <div className="flex max-w-2xl flex-col gap-6">
            <h1
              className="text-foreground"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--text-display)',
                fontWeight: 700,
                lineHeight: 1.08,
                letterSpacing: '-0.03em',
              }}
            >
              Sin filas.
              <br />
              <span className="text-accent">Sin esperas.</span>
            </h1>
            <p
              className="max-w-md text-muted"
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-md)',
                lineHeight: 1.6,
              }}
            >
              {siteConfig.tagline} Toma tu número, sigue el avance en tiempo
              real y recibe alertas antes de que te llamen.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/registro">
                <Button variant="primary" size="lg">
                  Registrarse
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="ghost" size="lg">
                  Iniciar sesión
                </Button>
              </Link>
            </div>
          </div>

          <div
            className="flex gap-6 text-muted"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-sm)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            <span className="flex items-center gap-2">
              <Ticket size={16} strokeWidth={1.5} className="text-accent" />
              Turno digital
            </span>
            <span className="flex items-center gap-2">
              <Bell size={16} strokeWidth={1.5} className="text-accent" />
              Alertas
            </span>
          </div>
        </div>
      </section>

      {/* ── Workflow: how Turnix works ── */}
      <section>
        <h2
          className="mb-10 text-muted"
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-xs)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          Cómo funciona
        </h2>
        <ol className="flex flex-col" style={{ gap: 0 }}>
          {workflowStages.map((stage, i) => (
            <li
              key={stage.num}
              className="grid gap-6 py-8"
              style={{
                gridTemplateColumns: 'auto 1fr',
                borderTop:
                  i === 0
                    ? '2px solid var(--color-ink)'
                    : '1px solid var(--color-rule)',
              }}
            >
              <span
                className="text-accent"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'var(--text-3xl)',
                  fontWeight: 700,
                  lineHeight: 1,
                  minWidth: '4rem',
                }}
              >
                {stage.num}
              </span>
              <div className="flex flex-col gap-2">
                <h3
                  className="text-foreground"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'var(--text-lg)',
                    fontWeight: 600,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {stage.title}
                </h3>
                <p
                  className="max-w-md text-muted"
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 'var(--text-base)',
                    lineHeight: 1.6,
                  }}
                >
                  {stage.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Benefits ── */}
      <section>
        <h2
          className="mb-8 text-foreground"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-2xl)',
            fontWeight: 700,
            letterSpacing: '-0.02em',
          }}
        >
          Por qué Turnix
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {benefits.map(({ Icon, title, text }, i) => (
            <Card
              key={title}
              className="p-0"
              style={{
                borderTop: i === 0 ? '2px solid var(--color-accent)' : 'none',
              }}
            >
              <Card.Content className="flex flex-col gap-4 py-6 px-5">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent-soft-foreground"
                >
                  <Icon size={20} strokeWidth={1.75} />
                </div>
                <p
                  className="text-foreground"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'var(--text-md)',
                    fontWeight: 600,
                  }}
                >
                  {title}
                </p>
                <p
                  className="text-muted"
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 'var(--text-sm)',
                    lineHeight: 1.6,
                  }}
                >
                  {text}
                </p>
              </Card.Content>
            </Card>
          ))}
        </div>
      </section>

      {/* ── Contact ── */}
      <section className="grid gap-12 lg:grid-cols-2">
        <div>
          <h2
            className="mb-3 text-foreground"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-2xl)',
              fontWeight: 700,
              letterSpacing: '-0.02em',
            }}
          >
            Contáctanos
          </h2>
          <p
            className="mb-8 text-muted"
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-base)',
              lineHeight: 1.6,
            }}
          >
            ¿Tienes dudas? Escríbenos o visita nuestras redes sociales.
          </p>

          <ul className="mb-8 flex flex-col gap-3 text-muted">
            <li>
              <span className="font-medium text-foreground">Teléfono: </span>
              <a
                href={`tel:${siteConfig.contact.phone}`}
                className="transition-colors hover:text-accent"
              >
                {siteConfig.contact.phone}
              </a>
            </li>
            <li>
              <span className="font-medium text-foreground">Correo: </span>
              <a
                href={`mailto:${siteConfig.contact.email}`}
                className="transition-colors hover:text-accent"
              >
                {siteConfig.contact.email}
              </a>
            </li>
            <li>
              <span className="font-medium text-foreground">Dirección: </span>
              {siteConfig.contact.address}
            </li>
          </ul>

          <SocialLinks />
        </div>

        <Card>
          <Card.Header>
            <Card.Title
              style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}
            >
              Formulario de contacto
            </Card.Title>
            <Card.Description>
              Envíanos un mensaje y te responderemos a la brevedad.
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <ContactForm compact />
          </Card.Content>
        </Card>
      </section>

      {/* ── CTA ── */}
      <section
        className="rounded-2xl px-8 py-12 text-center text-accent-foreground"
        style={{ backgroundColor: 'var(--color-accent)' }}
      >
        <h2
          className="text-foreground"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-2xl)',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: 'var(--color-accent-ink)',
          }}
        >
          ¿Listo para tu turno digital?
        </h2>
        <p
          className="mx-auto mt-3 max-w-md text-sm opacity-90 lg:text-base"
          style={{ color: 'var(--color-accent-ink)' }}
        >
          Regístrate, busca un establecimiento y únete a la fila en segundos.
        </p>
        <Link to="/registro" className="mt-7 inline-block">
          <Button variant="secondary" size="lg">
            Regístrate gratis
          </Button>
        </Link>
      </section>
    </div>
  )
}
