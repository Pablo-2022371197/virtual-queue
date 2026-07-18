import { siteConfig } from '@lib/siteConfig'
import { FacebookIcon, InstagramIcon, WhatsAppIcon } from '@shared/icons'

interface SocialLinksProps {
  className?: string
}

const links = [
  { href: siteConfig.social.facebook, label: 'Facebook', Icon: FacebookIcon },
  { href: siteConfig.social.whatsapp, label: 'WhatsApp', Icon: WhatsAppIcon },
  { href: siteConfig.social.instagram, label: 'Instagram', Icon: InstagramIcon },
]

export function SocialLinks({ className }: SocialLinksProps) {
  return (
    <div className={`flex items-center gap-2 ${className ?? ''}`}>
      {links.map(({ href, label, Icon }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-muted transition-colors hover:border-accent hover:bg-accent-soft hover:text-accent-soft-foreground"
        >
          <Icon size={16} />
        </a>
      ))}
    </div>
  )
}
