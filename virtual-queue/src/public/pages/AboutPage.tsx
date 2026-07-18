import { Card } from '@heroui/react'
import { Building2, Globe, Smartphone, Watch } from 'lucide-react'
import { PublicPageHeader } from '@public/components/PublicPageHeader'

import { siteConfig } from '@lib/siteConfig'

const { university } = siteConfig

const pillars = [
  {
    title: 'Misión',
    text: 'Digitalizar la experiencia de espera en establecimientos de servicios mediante turnos virtuales accesibles desde web y móvil.',
  },
  {
    title: 'Visión',
    text: `Ser la plataforma de referencia en gestión de filas para instituciones educativas y comercios en ${university.country}.`,
  },
  {
    title: 'Valores',
    text: 'Transparencia en tiempos de espera, accesibilidad multiplataforma y respeto por la privacidad del usuario.',
  },
]

const stats = [
  { value: '24/7', label: 'Disponibilidad' },
  { value: '< 1 min', label: 'Para tomar turno' },
  { value: 'Real time', label: 'Actualizaciones' },
]

const ecosystem = [
  {
    Icon: Globe,
    title: 'Frontend web',
    text: 'Sitio público y panel autenticado con React, HeroUI y actualizaciones STOMP.',
  },
  {
    Icon: Building2,
    title: 'Backend',
    text: 'API REST y WebSockets con Spring Boot para filas, turnos y estadísticas.',
  },
  {
    Icon: Smartphone,
    title: 'App móvil',
    text: 'Cliente Flutter para Android con notificaciones push y gestión de turnos.',
  },
  {
    Icon: Watch,
    title: 'Wear OS',
    text: 'Reloj inteligente sincronizado para consultar posición sin sacar el teléfono.',
  },
]

const team = [
  { role: 'Desarrollo web', name: 'Equipo frontend UTEQ' },
  { role: 'Backend & APIs', name: 'Equipo backend UTEQ' },
  { role: 'Móvil & wearable', name: 'Equipo dispositivos UTEQ' },
]

export default function AboutPage() {
  return (
    <article className="flex flex-col gap-10">
      <PublicPageHeader
        badge="Proyecto académico UTEQ"
        title="Nosotros"
        description="Conoce la misión, el equipo y la arquitectura detrás de Turnix, una solución integral para filas digitales."
      />

      <Card>
        <Card.Content className="flex flex-col gap-4 py-2">
          <p className="text-muted leading-relaxed">
            Turnix nació como proyecto de desarrollo de dispositivos en la
            {university.name} ({university.shortName}), en {university.city},{' '}
            {university.country}, para resolver un problema cotidiano: las largas
            filas en bancos, clínicas y oficinas de atención al público.
          </p>
          <p className="text-muted leading-relaxed">
            Combinamos una aplicación web, un backend en tiempo real con
            WebSockets y una app móvil Flutter para ofrecer una experiencia
            completa: tomar turno, recibir notificaciones y consultar
            estadísticas en vivo desde cualquier dispositivo.
          </p>
        </Card.Content>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {pillars.map((pillar) => (
          <Card key={pillar.title} variant="secondary">
            <Card.Header>
              <Card.Title className="text-base">{pillar.title}</Card.Title>
            </Card.Header>
            <Card.Content>
              <p className="text-sm text-muted leading-relaxed">{pillar.text}</p>
            </Card.Content>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label} variant="secondary">
            <Card.Content className="py-6 text-center">
              <p className="text-2xl font-bold text-accent">{stat.value}</p>
              <p className="mt-1 text-sm text-muted">{stat.label}</p>
            </Card.Content>
          </Card>
        ))}
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-foreground">Ecosistema tecnológico</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {ecosystem.map(({ Icon, title, text }) => (
            <Card key={title}>
              <Card.Content className="flex gap-4 py-2">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
                  <Icon size={20} strokeWidth={1.75} />
                </div>
                <div>
                  <p className="font-medium text-foreground">{title}</p>
                  <p className="mt-1 text-sm text-muted">{text}</p>
                </div>
              </Card.Content>
            </Card>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-foreground">Equipo del proyecto</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {team.map((member) => (
            <Card key={member.role} variant="secondary">
              <Card.Header>
                <Card.Title className="text-base">{member.role}</Card.Title>
                <Card.Description>{member.name}</Card.Description>
              </Card.Header>
            </Card>
          ))}
        </div>
      </section>
    </article>
  )
}
