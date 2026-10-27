import { useSettings } from '../settings'
import Socials from './Socials'
import BrandName from './BrandName'
import { Pin } from './Icons'

const NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const order = [1, 2, 3, 4, 5, 6, 0]

export default function Visit() {
  const s = useSettings()
  const MAP_QUERY = s.mapQuery
  const HOURS = s.hours
  const q = encodeURIComponent(MAP_QUERY)
  return (
    <section className="container visit" id="ubicacion">
      <div className="section-kicker">Dónde encontrarnos</div>
      <div className={`visit-grid ${MAP_QUERY ? '' : 'solo'}`}>
        <div className="visit-info">
          <h3><BrandName name={s.name} stacked /></h3>
          {(s.address || MAP_QUERY) && <p className="addr"><Pin /> {s.address || MAP_QUERY}</p>}
          {s.phone && <p className="addr">📞 <a href={`tel:${s.phone}`} style={{ color: 'inherit' }}>{s.phone}</a></p>}
          <div className="hrs">
            {order.map((d) => (
              <span key={d} style={{ display: 'contents' }}>
                <span>{NAMES[d]}</span>
                <span>{HOURS[d] ? `${HOURS[d][0]} a ${HOURS[d][1]} hs` : 'Cerrado'}</span>
              </span>
            ))}
          </div>
          <Socials />
          {MAP_QUERY && (
            <a className="btn-gold" style={{ textDecoration: 'none', display: 'inline-block', marginTop: 16 }} href={`https://www.google.com/maps/search/?api=1&query=${q}`} target="_blank" rel="noreferrer">Cómo llegar</a>
          )}
        </div>
        {MAP_QUERY && (
          <div className="map">
            <iframe title="Mapa del local" src={`https://www.google.com/maps?q=${q}&output=embed`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
          </div>
        )}
      </div>
    </section>
  )
}
