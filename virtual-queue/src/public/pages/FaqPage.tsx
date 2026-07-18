import { Link } from 'react-router-dom'
import { Button, Card } from '@heroui/react'
import { PublicPageHeader } from '@public/components/PublicPageHeader'

const faqCategories = [
  {
    category: 'Uso general',
    items: [
      {
        q: '¿Cómo tomo un turno?',
        a: 'Inicia sesión, busca un establecimiento en la sección "Establecimientos" y presiona "Ver fila" para unirte a la cola virtual.',
      },
      {
        q: '¿Puedo usar Turnix sin instalar la app?',
        a: 'Sí. El sitio web permite buscar establecimientos, ver tu turno activo y consultar estadísticas desde el navegador.',
      },
      {
        q: '¿Es gratis para usuarios?',
        a: 'Sí, el servicio es gratuito para quienes toman turno en establecimientos afiliados.',
      },
    ],
  },
  {
    category: 'Notificaciones y wearable',
    items: [
      {
        q: '¿Recibiré notificaciones?',
        a: 'Sí. La app envía avisos push a tu teléfono y al reloj Wear OS cuando se acerque tu turno.',
      },
      {
        q: '¿Necesito la app móvil para las alertas?',
        a: 'Las notificaciones push requieren la app Android. En web puedes seguir la fila en tiempo real sin instalar nada.',
      },
    ],
  },
  {
    category: 'Cuenta y soporte',
    items: [
      {
        q: '¿Cómo me registro?',
        a: 'Ve a /registro, completa el formulario y acepta la política de privacidad y los términos de uso. El registro es simulado para la demo del proyecto.',
      },
      {
        q: '¿Qué credenciales uso en la demo?',
        a: 'Usuario: admin · Contraseña: admin',
      },
      {
        q: '¿Puedo cancelar mi turno?',
        a: 'Próximamente podrás cancelar desde "Mi turno". Por ahora contacta al establecimiento o escríbenos.',
      },
      {
        q: '¿Dónde reporto un problema?',
        a: 'Usa el formulario en la página de contacto o escríbenos al correo indicado en el pie de página.',
      },
    ],
  },
]

export default function FaqPage() {
  return (
    <article className="flex flex-col gap-10">
      <PublicPageHeader
        badge="Centro de ayuda"
        title="Preguntas frecuentes"
        description="Respuestas a las dudas más comunes sobre el uso de Turnix, la app móvil y el panel web."
      />

      {faqCategories.map((group) => (
        <section key={group.category} className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-foreground">{group.category}</h2>
          <div className="flex flex-col gap-3">
            {group.items.map((faq) => (
              <Card key={faq.q}>
                <Card.Header>
                  <Card.Title className="text-base">{faq.q}</Card.Title>
                </Card.Header>
                <Card.Content>
                  <p className="text-sm text-muted leading-relaxed">{faq.a}</p>
                </Card.Content>
              </Card>
            ))}
          </div>
        </section>
      ))}

      <Card variant="secondary">
        <Card.Content className="flex flex-col items-start gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium text-foreground">¿No encontraste tu respuesta?</p>
            <p className="mt-1 text-sm text-muted">
              Nuestro equipo puede ayudarte con dudas técnicas o de uso.
            </p>
          </div>
          <Link to="/contacto">
            <Button variant="primary">Ir a contacto</Button>
          </Link>
        </Card.Content>
      </Card>
    </article>
  )
}
