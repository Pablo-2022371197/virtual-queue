export const appVersion = import.meta.env.VITE_APP_VERSION

export const siteConfig = {
  name: 'Turnix',
  tagline: 'Tu turno, en tu bolsillo.',
  university: {
    name: 'Universidad Tecnológica de Querétaro',
    shortName: 'UTEQ',
    city: 'Querétaro',
    country: 'México',
  },
  contact: {
    phone: '+52 442 123 4567',
    email: 'contacto@turnix.uteq.edu.mx',
    address: 'Carretera Estatal 200 km 13.5, El Marqués, 76240 Querétaro, México',
  },
  social: {
    facebook: 'https://facebook.com',
    whatsapp: 'https://wa.me/524421234567',
    instagram: 'https://instagram.com',
  },
  mapEmbedUrl:
    'https://www.openstreetmap.org/export/embed.html?bbox=-100.4182%2C20.6422%2C-100.3942%2C20.6662&layer=mapnik&marker=20.654184390801124%2C-100.40616790911903',
}

export const publicNavLinks = [
  { to: '/', label: 'Inicio' },
  { to: '/nosotros', label: 'Nosotros' },
  { to: '/faq', label: 'FAQ' },
  { to: '/contacto', label: 'Contacto' },
]

export const complementaryLinks = [
  { to: '/nosotros', label: 'Nosotros' },
  { to: '/faq', label: 'Preguntas frecuentes' },
  { to: '/contacto', label: 'Contacto' },
  { to: '/privacidad', label: 'Privacidad' },
  { to: '/terminos', label: 'Términos de uso' },
  { to: '/cookies', label: 'Cookies' },
]
