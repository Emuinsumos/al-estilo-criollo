import { useEffect, useState } from 'react'
import { useCart } from '../cart'
import { money, priceInfo } from '../utils'

export default function ProductModal({ product: p, onClose }) {
  const { dispatch, notify, setOpen } = useCart()
  const first = Math.max(0, p.variants.findIndex((v) => priceInfo(p, v).isOffer))
  const [vi, setVi] = useState(first)
  const [qty, setQty] = useState(1)
  const [note, setNote] = useState('')

  useEffect(() => {
    const f = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', f)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', f)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const info = priceInfo(p, p.variants[vi])

  const add = (goCart) => {
    dispatch({ type: 'add', productId: p.id, vi, qty, note: note.trim() })
    notify('Agregado al pedido ✓')
    onClose()
    if (goCart) setOpen(true)
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={p.name}>
        <button className="x-btn" onClick={onClose} aria-label="Cerrar">×</button>
        <div className="pimg" style={{ position: 'relative' }}>
          {p.image && <img src={p.image} alt={p.name} />}
          {p.offer && p.variants.some((v) => priceInfo(p, v).isOffer) && (
            <span className="badge">OFERTA -{Math.max(...p.variants.map((v) => priceInfo(p, v).pct))}%</span>
          )}
        </div>
        <div className="pbody">
          <h2>{p.name}</h2>
          {p.description && <p className="pd">{p.description}</p>}

          <span className="label-s">Elegí la cantidad</span>
          <div className="opts">
            {p.variants.map((v, idx) => {
              const inf = priceInfo(p, v)
              return (
                <button key={idx} className={`opt ${vi === idx ? 'on' : ''}`} onClick={() => setVi(idx)}>
                  <span className="t">{v.label}</span>
                  <span className="p">
                    {money(inf.price)}
                    {inf.isOffer && <s>{money(inf.regular)}</s>}
                  </span>
                </button>
              )
            })}
          </div>

          <span className="label-s">Indicaciones para el carnicero (opcional)</span>
          <textarea
            className="inp"
            placeholder="Ej: cortado fino, sin hueso, bien picada…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={140}
          />

          <div className="row" style={{ marginTop: 18, justifyContent: 'space-between' }}>
            <div className="stepper">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Menos">−</button>
              <span>{qty}</span>
              <button onClick={() => setQty((q) => q + 1)} aria-label="Más">+</button>
            </div>
            <div className="tot" style={{ gap: 10 }}>
              <span>Subtotal</span>
              <b>{money(info.price * qty)}</b>
            </div>
          </div>
          <div style={{ marginTop: 16, display: 'grid', gap: 10 }}>
            <button className="btn-red" disabled={p.soldOut} onClick={() => add(true)}>
              {p.soldOut ? 'Agotado' : 'Agregar y ver pedido'}
            </button>
            {!p.soldOut && <button className="btn-ghost" onClick={() => add(false)}>Agregar y seguir comprando</button>}
          </div>
        </div>
      </div>
    </div>
  )
}
