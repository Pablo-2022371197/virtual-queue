import { Link } from 'react-router-dom'
import { Card } from '@heroui/react'
import { PublicPageHeader } from '@public/components/PublicPageHeader'

const cookies = [
  {
    name: 'Sesión (JWT)',
    type: 'Esencial',
    purpose: 'Mantiene tu sesión autenticada en el panel web.',
    duration: 'Hasta cerrar sesión o expirar el token',
  },
  {
    name: 'Preferencias de tema',
    type: 'Funcional',
    purpose: 'Recuerda configuraciones de interfaz si las activas.',
    duration: 'Persistente en el navegador',
  },
  {
    name: 'Firebase / FCM',
    type: 'Técnica',
    purpose: 'Permite el registro del dispositivo para notificaciones push.',
    duration: 'Según política de Google Firebase',
  },
]

export default function CookiesPage() {
  return (
    <article className="flex flex-col gap-10">
      <PublicPageHeader
        badge="Documento legal"
        title="Política de cookies"
        description="Explicación de las cookies y tecnologías similares que utiliza Turnix en el sitio web."
      />

      <Card>
        <Card.Content className="py-2">
          <p className="text-sm text-muted leading-relaxed">
            Las cookies son pequeños archivos que el navegador almacena para
            recordar información sobre tu visita. Turnix usa únicamente las
            necesarias para autenticación y funcionamiento del servicio. Para más
            detalles sobre datos personales consulta nuestra{' '}
            <Link to="/privacidad" className="text-accent hover:underline">
              política de privacidad
            </Link>
            .
          </p>
        </Card.Content>
      </Card>

      <div className="flex flex-col gap-4">
        {cookies.map((cookie) => (
          <Card key={cookie.name}>
            <Card.Header>
              <Card.Title className="text-base">{cookie.name}</Card.Title>
              <Card.Description>{cookie.type}</Card.Description>
            </Card.Header>
            <Card.Content className="flex flex-col gap-2">
              <p className="text-sm text-muted">
                <span className="font-medium text-foreground">Finalidad: </span>
                {cookie.purpose}
              </p>
              <p className="text-sm text-muted">
                <span className="font-medium text-foreground">Duración: </span>
                {cookie.duration}
              </p>
            </Card.Content>
          </Card>
        ))}
      </div>

      <Card variant="secondary">
        <Card.Content className="py-2">
          <p className="text-sm text-muted leading-relaxed">
            Puedes configurar tu navegador para bloquear o eliminar cookies.
            Ten en cuenta que desactivar las cookies esenciales impedirá el
            inicio de sesión en el panel autenticado.
          </p>
        </Card.Content>
      </Card>
    </article>
  )
}
