import { LegalDocument, LegalDocumentLink, type LegalSection } from '@public/components/LegalDocument'
import { siteConfig } from '@lib/siteConfig'

const LAST_UPDATED = '2 de julio de 2026'
const EFFECTIVE_DATE = '2 de julio de 2026'

const sections: LegalSection[] = [
  {
    id: 'aceptacion',
    title: 'Aceptación de los términos',
    paragraphs: [
      'Al acceder, registrarte o utilizar Turnix aceptas quedar vinculado por estos Términos de Uso y por nuestra Política de Privacidad. Si no estás de acuerdo con alguna disposición, debes abstenerte de usar el servicio.',
      'Al crear una cuenta confirmas que tienes capacidad legal para contratar y que la información proporcionada es veraz.',
    ],
  },
  {
    id: 'descripcion',
    title: 'Descripción del servicio',
    paragraphs: [
      `${siteConfig.name} es una plataforma digital de gestión de filas virtuales desarrollada en el marco de un proyecto académico de la ${siteConfig.university.name} (${siteConfig.university.shortName}).`,
      'El servicio permite a los usuarios tomar turnos, consultar su posición en la fila y recibir notificaciones, así como a los establecimientos afiliados organizar la atención al público mediante aplicaciones web y móviles.',
    ],
  },
  {
    id: 'elegibilidad',
    title: 'Elegibilidad y registro',
    paragraphs: [
      'Para utilizar las funciones autenticadas debes crear una cuenta con información completa y actualizada. Eres responsable de todas las actividades realizadas bajo tu usuario.',
    ],
    bullets: [
      'Mantener la confidencialidad de tus credenciales de acceso.',
      'Notificar de inmediato cualquier uso no autorizado de tu cuenta.',
      'No compartir tu cuenta con terceros ni suplantar la identidad de otra persona.',
    ],
  },
  {
    id: 'uso-permitido',
    title: 'Uso permitido y restricciones',
    paragraphs: [
      'Te comprometes a utilizar Turnix únicamente con fines lícitos y conforme a estos términos. Queda expresamente prohibido:',
    ],
    bullets: [
      'Interferir con el funcionamiento normal de la plataforma o sus sistemas.',
      'Intentar acceder sin autorización a datos, cuentas o infraestructura.',
      'Utilizar el servicio para fines fraudulentos, abusivos o que perjudiquen a otros usuarios o establecimientos.',
      'Reproducir, modificar o distribuir el software sin autorización expresa.',
    ],
  },
  {
    id: 'establecimientos',
    title: 'Relación con establecimientos afiliados',
    paragraphs: [
      'Los tiempos de espera, criterios de atención y disponibilidad del servicio presencial dependen exclusivamente de cada establecimiento afiliado.',
      `${siteConfig.name} facilita la coordinación de la fila virtual, pero no garantiza tiempos exactos de atención ni la resolución de disputas entre usuarios y establecimientos.`,
    ],
  },
  {
    id: 'propiedad-intelectual',
    title: 'Propiedad intelectual',
    paragraphs: [
      `El software, diseño, marcas, textos y demás contenidos de ${siteConfig.name} son propiedad del proyecto académico de la ${siteConfig.university.shortName} o de sus respectivos titulares.`,
      'Se concede una licencia limitada, no exclusiva e intransferible para usar el servicio conforme a estos términos. Cualquier otro uso requiere autorización previa por escrito.',
    ],
  },
  {
    id: 'privacidad',
    title: 'Privacidad y datos personales',
    paragraphs: [
      'El tratamiento de tus datos personales se rige por nuestra Política de Privacidad, la cual forma parte integrante de estos términos.',
      'Al utilizar el servicio aceptas dicho tratamiento conforme a lo descrito en dicho documento.',
    ],
  },
  {
    id: 'disponibilidad',
    title: 'Disponibilidad y modificaciones del servicio',
    paragraphs: [
      'Nos esforzamos por mantener el servicio operativo, pero no garantizamos disponibilidad ininterrumpida. Podemos realizar mantenimientos, actualizaciones o modificaciones temporales o permanentes sin previo aviso.',
      'En el contexto de un proyecto académico, ciertas funcionalidades pueden encontrarse en fase de demostración o desarrollo.',
    ],
  },
  {
    id: 'limitacion',
    title: 'Limitación de responsabilidad',
    paragraphs: [
      `En la máxima medida permitida por la legislación aplicable, ${siteConfig.name} se proporciona "tal cual" y "según disponibilidad".`,
      'No seremos responsables por daños indirectos, pérdida de datos, lucro cesante o interrupciones derivadas del uso o imposibilidad de uso del servicio, salvo disposición legal en contrario.',
    ],
  },
  {
    id: 'terminacion',
    title: 'Suspensión y terminación',
    paragraphs: [
      'Podemos suspender o cancelar tu acceso al servicio si incumples estos términos o si ello resulta necesario por razones de seguridad, legales o operativas.',
      'Puedes dejar de utilizar el servicio en cualquier momento. Las disposiciones que por su naturaleza deban subsistir continuarán vigentes tras la terminación.',
    ],
  },
  {
    id: 'ley-aplicable',
    title: 'Ley aplicable y contacto',
    paragraphs: [
      `Estos términos se interpretarán conforme a las leyes aplicables en ${siteConfig.university.country}. Cualquier controversia se someterá a los tribunales competentes en ${siteConfig.university.city}, salvo normativa imperativa en contrario.`,
      `Para consultas sobre estos términos puedes contactarnos en ${siteConfig.contact.email} o a través del formulario disponible en la sección de contacto del sitio.`,
    ],
  },
  {
    id: 'modificaciones',
    title: 'Modificaciones de los términos',
    paragraphs: [
      'Podemos actualizar estos Términos de Uso en cualquier momento. Publicaremos la versión vigente en esta página e indicaremos la fecha de última actualización.',
      'El uso continuado del servicio después de la publicación de cambios implica la aceptación de los términos revisados.',
    ],
  },
]

export default function TermsPage() {
  return (
    <LegalDocument
      title="Términos y Condiciones de Uso"
      summary="Condiciones generales que regulan el acceso y uso de la plataforma Turnix por parte de usuarios y establecimientos afiliados."
      lastUpdated={LAST_UPDATED}
      effectiveDate={EFFECTIVE_DATE}
      sections={sections}
      footerNote={
        <>
          Documentos relacionados:{' '}
          <LegalDocumentLink to="/privacidad">Política de Privacidad</LegalDocumentLink>
          {' · '}
          <LegalDocumentLink to="/cookies">Política de Cookies</LegalDocumentLink>
          {' · '}
          <LegalDocumentLink to="/contacto">Contacto</LegalDocumentLink>
        </>
      }
    />
  )
}
