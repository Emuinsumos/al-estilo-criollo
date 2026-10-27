import { useMemo, useState } from 'react'
import { norm, money, productSummary } from '../utils'
import ProductModal from './ProductModal'

function Card({ p, onOpen }) {
  const s = productSummary(p)
  return (
    <button className="card" onClick={() => onOpen(p)} aria-label={`Ver ${p.name}`}>
      <div className="ph">
        {p.image ? <img src={p.image} alt={p.name} loading="lazy" /> : null}
        {s.isOffer && <span className="badge">-{s.pct}%</span>}
        {p.offer && s.isOffer && <span className="badge gold">OFERTA</span>}
        {p.soldOut && <div className="soldout-mask">Agotado</div>}
      </div>
      <div className="body">
        <h3>{p.name}</h3>
        {p.description && <p className="d">{p.description}</p>}
        <div className="pr">
          {s.multiple && <span className="from">Desde</span>}
          <span className="now">{money(s.price)}</span>
          {s.isOffer && s.regular > s.price && <span className="was">{money(s.regular)}</span>}
        </div>
        <div className="cta">{p.soldOut ? 'No disponible' : 'Elegir'}</div>
      </div>
    </button>
  )
}

export default function Catalog({ categories, products, loading, query, picked, setPicked }) {
  const [cat, setCat] = useState('all')
  const q = norm(query.trim())

  const filtered = useMemo(
    () =>
      products.filter((p) => {
        if (cat !== 'all' && p.categoryId !== cat) return false
        if (!q) return true
        return norm(p.name).includes(q) || norm(p.description).includes(q)
      }),
    [products, cat, q]
  )

  const sections = useMemo(() => {
    if (cat !== 'all' || q) return null
    const secs = categories
      .map((c) => ({ c, items: products.filter((p) => p.categoryId === c.id) }))
      .filter((s) => s.items.length)
    const orphans = products.filter((p) => !categories.some((c) => c.id === p.categoryId))
    if (orphans.length) secs.push({ c: { id: '_', name: 'Otros' }, items: orphans })
    return secs
  }, [cat, q, categories, products])

  return (
    <>
      <div className="cat-bar" id="productos">
        <div className="container cat-scroll" role="tablist" aria-label="Categorías">
          <button className={`cat-chip ${cat === 'all' ? 'on' : ''}`} onClick={() => setCat('all')}>Todo</button>
          {categories.map((c) => (
            <button key={c.id} className={`cat-chip ${cat === c.id ? 'on' : ''}`} onClick={() => setCat(c.id)}>
              {c.name}
            </button>
          ))}
        </div>
      </div>
      <section className="container catalog">
        {loading ? (
          <div className="grid">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton" />)}</div>
        ) : sections ? (
          sections.length ? (
            sections.map(({ c, items }) => (
              <div key={c.id}>
                <h2 className="cat-title">{c.name}</h2>
                <div className="grid">{items.map((p) => <Card key={p.id} p={p} onOpen={setPicked} />)}</div>
              </div>
            ))
          ) : (
            <div className="empty">Pronto vas a ver acá nuestros productos.</div>
          )
        ) : filtered.length ? (
          <div className="grid" style={{ marginTop: 24 }}>{filtered.map((p) => <Card key={p.id} p={p} onOpen={setPicked} />)}</div>
        ) : (
          <div className="empty">No encontramos productos{q ? ` para “${query}”` : ' en esta categoría'}.</div>
        )}
      </section>
      {picked && <ProductModal product={picked} onClose={() => setPicked(null)} />}
    </>
  )
}
