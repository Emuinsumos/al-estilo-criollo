import { useSettings } from '../settings'
import { useCart } from '../cart'

export default function TopBar({ query, setQuery }) {
  const { count, setOpen } = useCart()
  const s = useSettings()
  return (
    <div className="topbar">
      <div className="container inner">
        <div className="brand-mini">
          {s.name}
          <small>{s.tagline}</small>
        </div>
        <label className="search">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input
            type="search"
            placeholder="Buscar cortes, achuras, embutidos…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Buscar productos"
          />
        </label>
        <button className="cart-btn" onClick={() => setOpen(true)} aria-label="Abrir carrito">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6h15l-1.5 9h-12z" /><path d="M6 6 5 3H2" /><circle cx="9" cy="20" r="1.5" /><circle cx="18" cy="20" r="1.5" /></svg>
          <span className="label">Mi pedido</span>
          <span className="n">{count}</span>
        </button>
      </div>
    </div>
  )
}
