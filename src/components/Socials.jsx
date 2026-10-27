import { useSettings } from '../settings'
import { Instagram, Facebook, TikTok, WhatsApp } from './Icons'

export default function Socials() {
  const s = useSettings()
  const items = [
    s.instagram && { href: s.instagram, label: 'Instagram', b: 'instagram', Icon: Instagram },
    s.facebook && { href: s.facebook, label: 'Facebook', b: 'facebook', Icon: Facebook },
    s.tiktok && { href: s.tiktok, label: 'TikTok', b: 'tiktok', Icon: TikTok },
    s.whatsapp && { href: `https://wa.me/${s.whatsapp}`, label: 'WhatsApp', b: 'whatsapp', Icon: WhatsApp },
  ].filter(Boolean)
  if (!items.length) return null
  return (
    <div className="socials">
      {items.map(({ href, label, b, Icon }) => (
        <a key={label} data-b={b} href={href} target="_blank" rel="noreferrer" aria-label={label} title={label}><Icon /></a>
      ))}
    </div>
  )
}
