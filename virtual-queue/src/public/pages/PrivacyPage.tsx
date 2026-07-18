import { Card } from '@heroui/react'
import { PublicPageHeader } from '@public/components/PublicPageHeader'
import { siteConfig } from '@lib/siteConfig'

const sections = [
  {
    title: 'Responsable del tratamiento',
    text: `Turnix es un proyecto académico de la ${siteConfig.university.name} (${siteConfig.university.shortName}). Para consultas sobre privacidad escríbenos a ${siteConfig.contact.email}.`,
  },
  {
    title: 'Datos que recopilamos',
    text: 'Recopilamos información de cuenta (usuario), tokens de notificación push (Firebase Cloud Messaging), datos de turno (número, posición, establecimiento) y datos técnicos de sesión necesarios para el servicio.',
  },
  {
    title: 'Uso de la información',
    text: 'Los datos se utilizan exclusivamente para gestionar filas virtuales, enviar notificaciones de turno, mostrar estadísticas en tiempo real y mejorar la experiencia del usuario dentro de la plataforma.',
  },
  {
    title: 'Base legal',
    text: 'El tratamiento se basa en la ejecución del servicio solicitado por el usuario y, cuando aplique, en el consentimiento para notificaciones push y cookies analíticas.',
  },
  {
    title: 'Almacenamiento y seguridad',
    text: 'La información se almacena en servidores del backend con acceso restringido. Los tokens de sesión JWT se guardan localmente en tu navegador o dispositivo móvil.',
  },
  {
    title: 'Compartición con terceros',
    text: 'Utilizamos Firebase (Google) únicamente para el envío de notificaciones push. No vendemos ni cedemos datos personales a terceros con fines comerciales.',
  },
  {
    title: 'Tus derechos',
    text: 'Puedes solicitar acceso, rectificación o eliminación de tus datos contactándonos a través del formulario de contacto o por correo electrónico.',
  },
  {
    title: 'Conservación',
    text: 'Los datos de turno se conservan mientras el servicio esté activo y durante el periodo necesario para fines académicos y de auditoría del proyecto.',
  },
]

export default function PrivacyPage() {
  return (
    <article className="flex flex-col gap-10">
      <PublicPageHeader
        badge="Documento legal"
        title="Política de privacidad"
        description="Información sobre cómo recopilamos, usamos y protegemos tus datos personales al utilizar Turnix."
      />

      <p className="text-sm text-muted">
        Última actualización: julio {new Date().getFullYear()}
      </p>

      <div className="flex flex-col gap-4">
        {sections.map((section, index) => (
          <Card key={section.title}>
            <Card.Header>
              <Card.Title className="text-base">
                {index + 1}. {section.title}
              </Card.Title>
            </Card.Header>
            <Card.Content>
              <p className="text-sm text-muted leading-relaxed">{section.text}</p>
            </Card.Content>
          </Card>
        ))}
      </div>
    </article>
  )
}
