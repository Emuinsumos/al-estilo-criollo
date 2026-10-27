import { useSettings } from '../settings'

export default function Masthead() {
  const s = useSettings()
  const src = s.logo || '/logo.webp'
  return (
    <header className="masthead">
      <div className="mh-bg" style={{ backgroundImage: `url(${src})` }} aria-hidden="true" />
      <img src={src} alt={`${s.name} — ${s.tagline}`} fetchPriority="high" />
    </header>
  )
}
