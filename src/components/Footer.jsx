import { useSettings } from '../settings'
import Socials from './Socials'
import BrandName from './BrandName'

export default function Footer() {
  const s = useSettings()
  return (
    <footer className="footer">
      <div className="container">
        <div className="tag">{s.tagline}</div>
        <div className="big"><BrandName name={s.name} stacked /></div>
        <Socials />
        <p style={{ marginTop: 12 }}>Retiro en el local · Pedidos online</p>
      </div>
    </footer>
  )
}
