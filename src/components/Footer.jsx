import { useSettings } from '../settings'
import Socials from './Socials'

export default function Footer() {
  const s = useSettings()
  return (
    <footer className="footer">
      <div className="container">
        <div className="tag">{s.tagline}</div>
        <div className="big">{s.name}</div>
        <Socials />
        <p style={{ marginTop: 12 }}>Retiro en el local · Pedidos online</p>
        <a className="adm" href="#admin">Acceso administrador</a>
      </div>
    </footer>
  )
}
