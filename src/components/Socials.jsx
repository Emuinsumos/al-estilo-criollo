import { useSettings } from '../settings'
import { Instagram, Facebook, TikTok, WhatsApp } from './Icons'

export default function Socials() {
  const s = useSettings()
  const items = [
    s.instagram && { href: s.instagram, label: 'Instagram', Icon: Instagram },
    s.facebook && { href: s.facebook, label: 'Facebook', Icon: Facebook },
    s.tiktok && { href: s.tiktok, label: 'TikTok', Icon: TikTok },
    s.whatsapp && { href: `https://wa.me/${s.whatsapp}`, label: 'WhatsApp', Icon: WhatsApp },
  ].filter(Boolean)
  if (!items.length) return null
  return (
    <div className="socials">
      {items.map(({ href, label, Icon }) => (
        <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label} title={label}><Icon /></a>
      ))}
    </div>
  )
}
