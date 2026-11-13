import { useMemo } from 'react'
import { useCart } from '../cart'
import { money, imgUrl, promoInfo } from '../utils'

// Sección destacada de PROMOS (combos). Se oculta sola si no hay promos disponibles.
export default function Promos({ promos, products }) {
  const { dispatch, notify } = useCart()
  const list = useMemo(
    () => promos.filter((p) => p.active !== false).map((p) => ({ p, info: promoInfo(p, products) })).filter((x) => x.info.ok),
    [promos, products]
  )
  if (!list.length) return null

  const add = (p) => {
    dispatch({ type: 'addPromo', promoId: p.id, qty: 1 })
    notify('Promo agregada al pedido ✓')
  }

  return (
    <section className="promos" id="promos" aria-label="Promos">
      <div className="container">
        <div className="promos-head">
          <span className="flame" aria-hidden="true">🔥</span>
          <h2>PROMOS</h2>
          <span className="sub">Combos armados al mejor precio</span>
        </div>
        <div className="promo-scroll">
          {list.map(({ p, info }) => (
            <article className="promo" key={p.id}>
              <div className="ph">
                {p.image ? <img src={imgUrl(p.image, 640)} alt={p.name} loading="lazy" /> : <div className="ph-empty">PROMO</div>}
                <span className="badge gold">PROMO</span>
              </div>
              <div className="body">
                <h3>{p.name}</h3>
                {p.description && <p className="d">{p.description}</p>}
                <ul className="inc">
                  {info.rows.map((r, i) => (
                    <li key={i}><b>{r.qty}×</b> {r.product.name} <span>{r.label}</span></li>
                  ))}
                </ul>
                <div className="pr">
                  <span className="now">{money(p.price)}</span>
                  {info.regular > p.price && <span className="was">{money(info.regular)}</span>}
                </div>
                <button className="cta" onClick={() => add(p)}>Agregar</button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
