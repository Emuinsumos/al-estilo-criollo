import { useCallback, useEffect, useRef, useState } from 'react'
import { SLIDE_SECONDS } from '../config'
import { useSettings } from '../settings'
import { money, priceInfo } from '../utils'

export default function Carousel({ products, onPick, loading }) {
  const s = useSettings()
  const offers = products.filter((p) => p.offer && p.image && !p.soldOut && p.variants?.some((v) => priceInfo(p, v).isOffer))
  const slides = offers.length
    ? offers
    : [{ id: '_welcome', welcome: true }]
  const [i, setI] = useState(0)
  const [paused, setPaused] = useState(false)
  const touch = useRef(null)
  const n = slides.length

  const go = useCallback((d) => setI((x) => (x + d + n) % n), [n])

  useEffect(() => {
    if (n < 2 || paused) return
    const t = setTimeout(() => go(1), SLIDE_SECONDS * 1000)
    return () => clearTimeout(t)
  }, [i, n, paused, go])

  useEffect(() => { if (i >= n) setI(0) }, [n, i])

  if (loading) return null

  return (
    <section className="hero container" aria-label="Ofertas de la semana">
      <div className="section-kicker">{offers.length ? 'Ofertas de la semana' : 'Bienvenidos'}</div>
      <div
        className={`carousel ${paused ? 'paused' : ''}`}
        style={{ '--slide-ms': `${SLIDE_SECONDS * 1000}ms` }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touch.current == null) return
          const dx = e.changedTouches[0].clientX - touch.current
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1)
          touch.current = null
        }}
      >
        {slides.map((p, idx) => {
          if (p.welcome)
            return (
              <div key={p.id} className="slide active">
                <img className="bg" src={s.logo || '/logo.webp'} alt="" style={{ objectPosition: 'center 40%' }} />
                <div className="copy">
                  <span className="chip-offer">{s.tagline}</span>
                  <h2>El sabor de la parrilla argentina</h2>
                  <p className="desc">Cortes seleccionados, atención de carnicero. Armá tu pedido y retiralo en el local.</p>
                  <a href="#productos" className="btn-gold" style={{ textDecoration: 'none' }}>Ver productos</a>
                </div>
              </div>
            )
          const best = p.variants
            .map((v) => ({ v, info: priceInfo(p, v) }))
            .filter((x) => x.info.isOffer)
            .sort((a, b) => a.info.price - b.info.price)[0]
          const maxPct = Math.max(...p.variants.map((v) => priceInfo(p, v).pct))
          return (
            <div key={p.id} className={`slide ${idx === i ? 'active' : ''}`} aria-hidden={idx !== i}>
              <img className="bg" src={p.image} alt={p.name} loading={idx === 0 ? 'eager' : 'lazy'} />
              <div className="copy">
                <span className="chip-offer">Oferta de la semana</span>
                <h2>{p.name}</h2>
                {p.description && <p className="desc">{p.description}</p>}
                <div className="price-row">
                  <span className="from">{best.v.label} por</span>
                  <span className="now">{money(best.info.price)}</span>
                  <span className="was">{money(best.info.regular)}</span>
                  <span className="pct">-{maxPct}%</span>
                </div>
                <button className="btn-gold" onClick={() => onPick(p)}>Lo quiero</button>
              </div>
            </div>
          )
        })}
        {n > 1 && (
          <>
            <button className="car-arrow l" onClick={() => go(-1)} aria-label="Anterior">‹</button>
            <button className="car-arrow r" onClick={() => go(1)} aria-label="Siguiente">›</button>
            <div className="dots">
              {slides.map((s, idx) => (
                <button key={s.id} className={idx === i ? 'on' : ''} onClick={() => setI(idx)} aria-label={`Ir a oferta ${idx + 1}`} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
