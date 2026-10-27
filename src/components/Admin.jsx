import { useEffect, useRef, useState } from 'react'
import { ADMIN, DEFAULT_BOT } from '../config'
import { useSettings } from '../settings'
import { IS_DEMO, setValue, removeValue, newId } from '../store'
import { useBotItems, useCategories, useNode, useOrders, useProducts, useReviews } from '../hooks'
import { beep, fmtDate, fmtDateTime, money, priceInfo, readyMessage, waLink, waPhone } from '../utils'
import ImageCropper from './ImageCropper'

const SESSION = 'criollo-admin'

export default function Admin() {
  const s = useSettings()
  const [ok, setOk] = useState(() => sessionStorage.getItem(SESSION) === '1')
  const [u, setU] = useState('')
  const [p, setP] = useState('')
  const [err, setErr] = useState('')

  if (!ok)
    return (
      <div className="login">
        <form
          className="box"
          onSubmit={(e) => {
            e.preventDefault()
            if (u.trim() === (s.adminUser || ADMIN.user) && p === (s.adminPass || ADMIN.pass)) {
              sessionStorage.setItem(SESSION, '1')
              setOk(true)
            } else setErr('Usuario o contraseña incorrectos')
          }}
        >
          <h1>{s.name}</h1>
          <p className="hint" style={{ marginBottom: 18 }}>Panel de administración</p>
          <div className="field"><label>Usuario</label><input className="inp" value={u} onChange={(e) => setU(e.target.value)} autoCapitalize="none" /></div>
          <div className="field"><label>Contraseña</label><input className="inp" type="password" value={p} onChange={(e) => setP(e.target.value)} /></div>
          {err && <div className="err">{err}</div>}
          <button className="btn-red" type="submit">Entrar</button>
          <a href="#" className="hint" style={{ display: 'block', textAlign: 'center', marginTop: 14 }}>← Volver a la web</a>
        </form>
      </div>
    )
  return <Panel onExit={() => { sessionStorage.removeItem(SESSION); setOk(false) }} />
}

function Panel({ onExit }) {
  const s = useSettings()
  const [tab, setTab] = useState('orders')
  const { orders } = useOrders()
  const pending = orders.filter((o) => o.status === 'pending').length
  const prev = useRef(null)

  // aviso sonoro cuando entra un pedido nuevo
  useEffect(() => {
    if (prev.current !== null && orders.length > prev.current) {
      beep()
      document.title = '🔔 Nuevo pedido'
      setTimeout(() => (document.title = `${s.name} | ${s.tagline}`), 6000)
    }
    prev.current = orders.length
  }, [orders.length])

  return (
    <div className="adm-wrap">
      {IS_DEMO && <div className="demo-banner">Modo demo: los datos se guardan solo en este navegador. Falta configurar Firebase.</div>}
      <div className="adm-top">
        <div className="container inner">
          <h1>Panel · {s.name}</h1>
          <a className="btn-ghost" href="#" style={{ textDecoration: 'none' }}>Ver web</a>
          <button className="btn-ghost" onClick={onExit}>Salir</button>
        </div>
      </div>
      <div className="container">
        <div className="tabs">
          <button className={`tab ${tab === 'orders' ? 'on' : ''}`} onClick={() => setTab('orders')}>Pedidos {pending > 0 && <span className="n">{pending}</span>}</button>
          <button className={`tab ${tab === 'products' ? 'on' : ''}`} onClick={() => setTab('products')}>Productos</button>
          <button className={`tab ${tab === 'cats' ? 'on' : ''}`} onClick={() => setTab('cats')}>Categorías</button>
          <button className={`tab ${tab === 'reviews' ? 'on' : ''}`} onClick={() => setTab('reviews')}>Reseñas</button>
          <button className={`tab ${tab === 'bot' ? 'on' : ''}`} onClick={() => setTab('bot')}>Bot</button>
          <button className={`tab ${tab === 'biz' ? 'on' : ''}`} onClick={() => setTab('biz')}>Negocio {!s.phone && <span className="n">!</span>}</button>
        </div>
        <div className="adm-body">
          {tab === 'orders' && <Orders orders={orders} />}
          {tab === 'products' && <Products />}
          {tab === 'cats' && <Categories />}
          {tab === 'reviews' && <ReviewsAdmin />}
          {tab === 'bot' && <BotAdmin />}
          {tab === 'biz' && <BusinessAdmin />}
        </div>
      </div>
    </div>
  )
}

/* ---------------- Pedidos ---------------- */
const STATUS = { pending: 'Pendiente', completed: 'Completado', cancelled: 'Cancelado' }

function Orders({ orders }) {
  const st = useSettings()
  const [f, setF] = useState('pending')
  const list = f === 'all' ? orders : orders.filter((o) => o.status === f)
  const count = (s) => orders.filter((o) => o.status === s).length

  const setStatus = (o, status) => {
    setValue(`orders/${o.id}/status`, status)
    setValue(`track/${o.code}/status`, status)
    // al completar: abre WhatsApp con el aviso listo para enviar
    if (status === 'completed') window.open(waLink(waPhone(o.phone), readyMessage(o, st.name)), '_blank')
  }
  const del = (o) => {
    if (confirm(`¿Borrar definitivamente el pedido ${o.code}?`)) { removeValue(`orders/${o.id}`); removeValue(`track/${o.code}`) }
  }

  return (
    <>
      <div className="tabs" style={{ paddingTop: 0 }}>
        {['pending', 'completed', 'cancelled', 'all'].map((s) => (
          <button key={s} className={`tab ${f === s ? 'on' : ''}`} onClick={() => setF(s)}>
            {s === 'all' ? 'Todos' : STATUS[s] + 's'}
            {s !== 'all' && <span className="n">{count(s)}</span>}
          </button>
        ))}
      </div>
      {!list.length && <div className="empty">No hay pedidos en esta lista.</div>}
      {list.map((o) => (
        <div key={o.id} className={`ocard ${o.status}`}>
          <div className="head">
            <div>
              <div className="code">{o.code}</div>
              <div className="meta">Recibido {fmtDateTime(o.createdAt)}</div>
            </div>
            <span className={`pill ${o.status}`}>{STATUS[o.status]}</span>
          </div>
          <div><b>{o.name} {o.lastName}</b> · <a href={`tel:${o.phone}`} style={{ color: 'var(--gold2)' }}>{o.phone}</a></div>
          <div className="meta">Retira: <b style={{ color: 'var(--cream)' }}>{fmtDate(o.pickupDate)} · {o.pickupTime} hs</b></div>
          <ul>
            {o.items.map((i, k) => (
              <li key={k}>
                {i.qty} × {i.name} — {i.variant} <span style={{ color: 'var(--muted)' }}>({money(i.price * i.qty)})</span>
                {i.note && <i>“{i.note}”</i>}
              </li>
            ))}
          </ul>
          <div className="tot"><span>Total estimado</span><b style={{ fontSize: 22 }}>{money(o.total)}</b></div>
          <div className="actions">
            {o.status !== 'completed' && <button className="act ok" onClick={() => setStatus(o, 'completed')}>✓ Completado + avisar</button>}
            {o.status === 'completed' && <a className="act wa" href={waLink(waPhone(o.phone), readyMessage(o, st.name))} target="_blank" rel="noreferrer">Reenviar aviso por WhatsApp</a>}
            {o.status !== 'pending' && <button className="act warn" onClick={() => setStatus(o, 'pending')}>Volver a pendiente</button>}
            {o.status !== 'cancelled' && <button className="act bad" onClick={() => setStatus(o, 'cancelled')}>Cancelar</button>}
            <button className="act" onClick={() => del(o)}>🗑</button>
          </div>
        </div>
      ))}
    </>
  )
}

/* ---------------- Categorías ---------------- */
function Categories() {
  const { categories } = useCategories()
  const { products } = useProducts()
  const [name, setName] = useState('')

  const add = () => {
    const n = name.trim()
    if (!n) return
    const order = categories.length ? Math.max(...categories.map((c) => c.order || 0)) + 1 : 1
    setValue(`categories/${newId()}`, { name: n, order })
    setName('')
  }
  const rename = (c) => {
    const n = prompt('Nuevo nombre', c.name)
    if (n && n.trim()) setValue(`categories/${c.id}/name`, n.trim())
  }
  const del = (c) => {
    const used = products.filter((p) => p.categoryId === c.id).length
    if (confirm(used ? `La categoría tiene ${used} producto(s). Van a quedar en "Otros". ¿Borrar igual?` : `¿Borrar "${c.name}"?`))
      removeValue(`categories/${c.id}`)
  }
  const move = (idx, d) => {
    const a = categories[idx]
    const b = categories[idx + d]
    if (!a || !b) return
    setValue(`categories/${a.id}/order`, b.order ?? idx + d)
    setValue(`categories/${b.id}/order`, a.order ?? idx)
  }

  return (
    <>
      <div className="row" style={{ marginBottom: 16 }}>
        <input className="inp" placeholder="Nueva categoría (ej: Vacuno)" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} />
        <button className="btn-red" style={{ width: 'auto', padding: '12px 22px' }} onClick={add}>Agregar</button>
      </div>
      <div className="alist">
        {categories.map((c, i) => (
          <div className="arow" key={c.id}>
            <div className="info"><b>{c.name}</b><span>{products.filter((p) => p.categoryId === c.id).length} productos</span></div>
            <button className="mini" onClick={() => move(i, -1)} disabled={i === 0}>↑</button>
            <button className="mini" onClick={() => move(i, 1)} disabled={i === categories.length - 1}>↓</button>
            <button className="mini" onClick={() => rename(c)}>Editar</button>
            <button className="mini del" onClick={() => del(c)}>Borrar</button>
          </div>
        ))}
        {!categories.length && <div className="empty">Creá tu primera categoría para empezar.</div>}
      </div>
    </>
  )
}

/* ---------------- Productos ---------------- */
function Products() {
  const { products } = useProducts()
  const { categories } = useCategories()
  const [edit, setEdit] = useState(null)
  const [bulk, setBulk] = useState(false)
  const backup = useNode('backup/lastIncrease')

  const undo = () => {
    if (!backup?.items || !confirm('¿Deshacer el último aumento masivo y volver a los precios anteriores?')) return
    Object.entries(backup.items).forEach(([id, variants]) => {
      if (products.some((p) => p.id === id)) setValue(`products/${id}/variants`, variants)
    })
    removeValue('backup/lastIncrease')
  }

  const blank = () => ({
    id: newId(), name: '', description: '', categoryId: categories[0]?.id || '', image: '',
    variants: [{ label: '1 kg', price: '', offerPrice: '' }], offer: false, soldOut: false, createdAt: Date.now(),
  })

  return (
    <>
      <div className="bar-actions">
        <span className="hint">{products.length} productos · {products.filter((p) => p.offer).length} en oferta</span>
        <div className="row" style={{ flexWrap: 'wrap' }}>
          <button className="btn-ghost" onClick={() => setBulk(true)}>% Aumento masivo</button>
          <button className="btn-red" style={{ width: 'auto', padding: '11px 22px' }} onClick={() => (categories.length ? setEdit(blank()) : alert('Primero creá al menos una categoría.'))}>+ Nuevo producto</button>
        </div>
      </div>
      {backup?.items && (
        <div className="ocard" style={{ borderLeftColor: 'var(--gold)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span>Último aumento: <b>{backup.pct > 0 ? '+' : ''}{backup.pct}%</b> en {Object.keys(backup.items).length} productos · {fmtDateTime(backup.ts)}</span>
          <button className="act warn" onClick={undo}>↶ Deshacer</button>
        </div>
      )}
      <div className="alist">
        {products.map((p) => (
          <div className="arow" key={p.id}>
            {p.image ? <img src={p.image} alt="" /> : <img alt="" />}
            <div className="info">
              <b>{p.name}</b>
              <span>
                {categories.find((c) => c.id === p.categoryId)?.name || 'Sin categoría'} · {p.variants?.length || 0} precios
                {p.offer ? ' · 🔥 OFERTA' : ''}{p.soldOut ? ' · AGOTADO' : ''}
              </span>
            </div>
            <button className="mini" onClick={() => setEdit({ ...p, variants: p.variants.map((v) => ({ ...v })) })}>Editar</button>
            <button className="mini del" onClick={() => confirm(`¿Borrar "${p.name}"?`) && removeValue(`products/${p.id}`)}>Borrar</button>
          </div>
        ))}
        {!products.length && <div className="empty">Todavía no cargaste productos.</div>}
      </div>
      {edit && <ProductForm initial={edit} categories={categories} onClose={() => setEdit(null)} />}
      {bulk && <BulkIncrease products={products} categories={categories} onClose={() => setBulk(false)} />}
    </>
  )
}

function ProductForm({ initial, categories, onClose }) {
  const [p, setP] = useState(initial)
  const [file, setFile] = useState(null)
  const [err, setErr] = useState('')
  const set = (k, v) => setP((x) => ({ ...x, [k]: v }))
  const setVar = (i, k, v) => setP((x) => ({ ...x, variants: x.variants.map((r, j) => (j === i ? { ...r, [k]: v } : r)) }))

  const save = async () => {
    const variants = p.variants
      .filter((v) => String(v.label).trim() && Number(v.price) > 0)
      .map((v) => ({ label: String(v.label).trim(), price: Number(v.price), ...(Number(v.offerPrice) > 0 ? { offerPrice: Number(v.offerPrice) } : {}) }))
    if (!p.name.trim()) return setErr('Poné un nombre.')
    if (!p.categoryId) return setErr('Elegí una categoría.')
    if (!variants.length) return setErr('Cargá al menos un precio (ej: 1 kg · 5000).')
    if (p.offer && !variants.some((v) => priceInfo({ offer: true }, v).isOffer))
      return setErr('Para que sea oferta, el precio de oferta tiene que ser menor al precio normal.')
    setErr('')
    await setValue(`products/${p.id}`, { ...p, name: p.name.trim(), description: p.description.trim(), variants })
    onClose()
  }

  return (
    <div className="overlay">
      <div className="modal wide" style={{ padding: 0 }}>
        <div style={{ padding: '20px 22px 4px' }}>
          <h2 style={{ fontFamily: 'var(--font-title)' }}>{initial.name ? 'Editar producto' : 'Nuevo producto'}</h2>
          <div className="field" style={{ marginTop: 14 }}><label>Nombre</label><input className="inp" value={p.name} onChange={(e) => set('name', e.target.value)} /></div>
          <div className="field"><label>Descripción (opcional)</label><textarea className="inp" value={p.description} onChange={(e) => set('description', e.target.value)} /></div>
          <div className="field">
            <label>Categoría</label>
            <select className="inp" value={p.categoryId} onChange={(e) => set('categoryId', e.target.value)}>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="field">
            <label>Foto</label>
            <div className="imgpick">
              {p.image && <img src={p.image} alt="" />}
              <label className="btn-ghost" style={{ cursor: 'pointer', textAlign: 'center' }}>
                {p.image ? 'Cambiar / recortar' : 'Subir foto'}
                <input type="file" accept="image/*" hidden onChange={(e) => { setFile(e.target.files[0] || null); e.target.value = '' }} />
              </label>
            </div>
          </div>

          <div className="field">
            <label>Precios por cantidad</label>
            <div className="hint" style={{ marginBottom: 8 }}>Ej: “1 kg” · 5000 · y si está en oferta, el precio de oferta.</div>
            {p.variants.map((v, i) => (
              <div className="vrow" key={i}>
                <input className="inp" placeholder="1 kg" value={v.label} onChange={(e) => setVar(i, 'label', e.target.value)} />
                <input className="inp" type="number" inputMode="numeric" placeholder="Precio" value={v.price} onChange={(e) => setVar(i, 'price', e.target.value)} />
                <input className="inp" type="number" inputMode="numeric" placeholder="Oferta" value={v.offerPrice ?? ''} onChange={(e) => setVar(i, 'offerPrice', e.target.value)} />
                <button className="mini del" onClick={() => set('variants', p.variants.filter((_, j) => j !== i))} disabled={p.variants.length === 1}>✕</button>
              </div>
            ))}
            <button className="btn-ghost" onClick={() => set('variants', [...p.variants, { label: '', price: '', offerPrice: '' }])}>+ Agregar otra cantidad</button>
          </div>

          <div style={{ display: 'grid', gap: 10, marginBottom: 16 }}>
            <label className="switch"><input type="checkbox" checked={!!p.offer} onChange={(e) => set('offer', e.target.checked)} /><span><b>🔥 Oferta semanal</b><br /><span className="hint">Aparece en el carrusel. Muestra el precio normal tachado y el cartel de descuento (solo si el precio de oferta es menor).</span></span></label>
            <label className="switch"><input type="checkbox" checked={!!p.soldOut} onChange={(e) => set('soldOut', e.target.checked)} /><span><b>Agotado</b><br /><span className="hint">Se ve en la web pero no se puede pedir.</span></span></label>
          </div>
          {err && <div className="err">{err}</div>}
        </div>
        <div className="sticky-save">
          <button className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn-red" onClick={save}>Guardar producto</button>
        </div>
      </div>
      {file && <ImageCropper file={file} onCancel={() => setFile(null)} onDone={(url) => { set('image', url); setFile(null) }} />}
    </div>
  )
}

/* ---------------- Reseñas ---------------- */
function ReviewsAdmin() {
  const { reviews } = useReviews()
  const [r, setR] = useState({ name: '', stars: 5, text: '' })
  const add = () => {
    if (!r.name.trim() || !r.text.trim()) return
    setValue(`reviews/${newId()}`, { name: r.name.trim(), stars: Number(r.stars), text: r.text.trim(), visible: true, createdAt: Date.now() })
    setR({ name: '', stars: 5, text: '' })
  }
  return (
    <>
      <p className="hint" style={{ marginBottom: 12 }}>Cargá acá reseñas reales de tus clientes (copiadas de Google, WhatsApp o Instagram). Aparecen en la web debajo del catálogo.</p>
      <div className="ocard" style={{ borderLeftColor: 'var(--gold)' }}>
        <div className="two">
          <div className="field"><label>Nombre del cliente</label><input className="inp" value={r.name} onChange={(e) => setR({ ...r, name: e.target.value })} /></div>
          <div className="field"><label>Estrellas</label>
            <select className="inp" value={r.stars} onChange={(e) => setR({ ...r, stars: e.target.value })}>{[5, 4, 3].map((n) => <option key={n} value={n}>{'★'.repeat(n)}</option>)}</select>
          </div>
        </div>
        <div className="field"><label>Reseña</label><textarea className="inp" value={r.text} onChange={(e) => setR({ ...r, text: e.target.value })} maxLength={280} /></div>
        <button className="btn-red" onClick={add}>Agregar reseña</button>
      </div>
      <div className="alist" style={{ marginTop: 14 }}>
        {reviews.map((v) => (
          <div className="arow" key={v.id} style={{ opacity: v.visible ? 1 : 0.55 }}>
            <div className="info"><b>{v.name} · <span style={{ color: 'var(--gold)' }}>{'★'.repeat(v.stars)}</span></b><span style={{ whiteSpace: 'normal' }}>{v.text}</span></div>
            <button className="mini" onClick={() => setValue(`reviews/${v.id}/visible`, !v.visible)}>{v.visible ? 'Ocultar' : 'Mostrar'}</button>
            <button className="mini del" onClick={() => confirm('¿Borrar esta reseña?') && removeValue(`reviews/${v.id}`)}>Borrar</button>
          </div>
        ))}
        {!reviews.length && <div className="empty">Todavía no cargaste reseñas.</div>}
      </div>
    </>
  )
}

/* ---------------- Aumento masivo ---------------- */
function BulkIncrease({ products, categories, onClose }) {
  const [sel, setSel] = useState({})
  const [cat, setCat] = useState('all')
  const [q, setQ] = useState('')
  const [pct, setPct] = useState('')
  const [offers, setOffers] = useState(true)
  const [round, setRound] = useState(10)

  const visible = products.filter(
    (p) => (cat === 'all' || p.categoryId === cat) && (!q || p.name.toLowerCase().includes(q.toLowerCase()))
  )
  const chosen = products.filter((p) => sel[p.id])
  const n = Number(String(pct).replace(',', '.'))
  const valid = chosen.length > 0 && Number.isFinite(n) && n !== 0 && n > -90 && n < 500

  const calc = (v) => {
    const f = (x) => Math.max(0, Math.round((x * (1 + n / 100)) / round) * round)
    const out = { ...v, price: f(Number(v.price)) }
    if (Number(v.offerPrice) > 0) out.offerPrice = offers ? f(Number(v.offerPrice)) : v.offerPrice
    return out
  }
  const toggleAll = () => {
    const allOn = visible.every((p) => sel[p.id])
    setSel((s) => { const c = { ...s }; visible.forEach((p) => (c[p.id] = !allOn)); return c })
  }
  const apply = async () => {
    if (!valid) return
    if (!confirm(`¿Aplicar ${n > 0 ? '+' : ''}${n}% a ${chosen.length} producto(s)? Podés deshacerlo después.`)) return
    const items = {}
    chosen.forEach((p) => (items[p.id] = p.variants))
    await setValue('backup/lastIncrease', { ts: Date.now(), pct: n, items })
    for (const p of chosen) await setValue(`products/${p.id}/variants`, p.variants.map(calc))
    onClose()
  }
  const sample = chosen[0]

  return (
    <div className="overlay">
      <div className="modal wide" style={{ padding: 0 }}>
        <div style={{ padding: '20px 22px 8px' }}>
          <h2 style={{ fontFamily: 'var(--font-title)' }}>Aumento masivo de precios</h2>
          <p className="hint" style={{ margin: '4px 0 12px' }}>1) Elegí los productos · 2) Poné el porcentaje · 3) Aplicá. Para bajar precios usá un número negativo (ej: -5).</p>
          <div className="two">
            <select className="inp" value={cat} onChange={(e) => setCat(e.target.value)}>
              <option value="all">Todas las categorías</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input className="inp" placeholder="Buscar…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="row" style={{ justifyContent: 'space-between', margin: '10px 0 6px' }}>
            <button className="mini" onClick={toggleAll}>{visible.length && visible.every((p) => sel[p.id]) ? 'Quitar selección' : `Seleccionar los ${visible.length} visibles`}</button>
            <span className="hint">{chosen.length} elegidos</span>
          </div>
          <div className="alist" style={{ maxHeight: 260, overflow: 'auto', marginBottom: 14 }}>
            {visible.map((p) => (
              <label className="arow" key={p.id} style={{ cursor: 'pointer' }}>
                <input type="checkbox" checked={!!sel[p.id]} onChange={(e) => setSel({ ...sel, [p.id]: e.target.checked })} style={{ width: 20, height: 20, accentColor: 'var(--red2)' }} />
                <div className="info"><b>{p.name}</b><span>{p.variants.map((v) => `${v.label} ${money(v.price)}`).join(' · ')}</span></div>
              </label>
            ))}
            {!visible.length && <div className="empty">No hay productos.</div>}
          </div>
          <div className="two">
            <div className="field"><label>Porcentaje %</label><input className="inp" type="number" inputMode="decimal" placeholder="Ej: 10" value={pct} onChange={(e) => setPct(e.target.value)} /></div>
            <div className="field"><label>Redondear a</label>
              <select className="inp" value={round} onChange={(e) => setRound(Number(e.target.value))}>
                <option value={1}>$1 (exacto)</option><option value={10}>$10</option><option value={50}>$50</option><option value={100}>$100</option>
              </select>
            </div>
          </div>
          <label className="switch" style={{ marginBottom: 12 }}><input type="checkbox" checked={offers} onChange={(e) => setOffers(e.target.checked)} /><span>También aumentar los precios de oferta</span></label>
          {valid && sample && (
            <div className="hint" style={{ marginBottom: 10 }}>
              Ejemplo — <b style={{ color: 'var(--cream)' }}>{sample.name}</b>: {sample.variants.map((v) => `${v.label} ${money(v.price)} → ${money(calc(v).price)}`).join(' · ')}
            </div>
          )}
        </div>
        <div className="sticky-save">
          <button className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn-red" disabled={!valid} onClick={apply}>Aplicar a {chosen.length} producto(s)</button>
        </div>
      </div>
    </div>
  )
}

/* ---------------- Bot ---------------- */
function BotAdmin() {
  const st = useSettings()
  const { items, isDefault, loading } = useBotItems()
  const [list, setList] = useState(null)
  const [greet, setGreet] = useState(st.botGreeting)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!loading && list === null) setList((isDefault ? DEFAULT_BOT : items).map((x) => ({ q: x.q, a: x.a })))
  }, [loading, isDefault, items, list])
  if (list === null) return <div className="empty">Cargando…</div>

  const upd = (i, k, v) => { setSaved(false); setList(list.map((x, j) => (j === i ? { ...x, [k]: v } : x))) }
  const move = (i, d) => {
    const j = i + d
    if (j < 0 || j >= list.length) return
    const c = [...list]; [c[i], c[j]] = [c[j], c[i]]; setSaved(false); setList(c)
  }
  const save = async () => {
    const clean = list.filter((x) => x.q.trim() && x.a.trim())
    const obj = {}
    clean.forEach((x, i) => (obj[`i${String(i).padStart(3, '0')}`] = { q: x.q.trim(), a: x.a.trim(), order: i }))
    await setValue('botItems', clean.length ? obj : { _: { q: '', a: '', order: 0 } })
    await setValue('settings', { ...st.raw, botGreeting: greet, botEnabled: st.botEnabled })
    setSaved(true)
  }

  return (
    <>
      <p className="hint" style={{ marginBottom: 12 }}>El cliente ve estas preguntas en el botón de chat de la web y toca la que quiera. En las respuestas podés usar: <b>{'{horarios}'}</b>, <b>{'{direccion}'}</b>, <b>{'{telefono}'}</b> y <b>{'{nombre}'}</b>; se completan solos con los datos de la pestaña Negocio.</p>
      <label className="switch" style={{ marginBottom: 12 }}>
        <input type="checkbox" checked={st.botEnabled} onChange={(e) => setValue('settings', { ...st.raw, botEnabled: e.target.checked, botGreeting: st.botGreeting })} />
        <span>Mostrar el bot en la web</span>
      </label>
      <div className="field"><label>Mensaje de bienvenida</label><input className="inp" value={greet} onChange={(e) => { setGreet(e.target.value); setSaved(false) }} /></div>
      {list.map((x, i) => (
        <div className="ocard" key={i} style={{ borderLeftColor: 'var(--gold)' }}>
          <div className="field"><label>Pregunta</label><input className="inp" value={x.q} onChange={(e) => upd(i, 'q', e.target.value)} /></div>
          <div className="field"><label>Respuesta</label><textarea className="inp" value={x.a} onChange={(e) => upd(i, 'a', e.target.value)} /></div>
          <div className="actions" style={{ marginTop: 0 }}>
            <button className="mini" onClick={() => move(i, -1)}>↑</button>
            <button className="mini" onClick={() => move(i, 1)}>↓</button>
            <button className="mini del" onClick={() => { setSaved(false); setList(list.filter((_, j) => j !== i)) }}>Borrar</button>
          </div>
        </div>
      ))}
      <div className="row" style={{ marginTop: 6 }}>
        <button className="btn-ghost" onClick={() => { setSaved(false); setList([...list, { q: '', a: '' }]) }}>+ Agregar pregunta</button>
        <button className="btn-red" onClick={save}>{saved ? '✓ Guardado' : 'Guardar bot'}</button>
      </div>
    </>
  )
}

/* ---------------- Negocio ---------------- */
const DAYS_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]

function compressLogo(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const im = new Image()
    im.onload = () => {
      const scale = Math.min(1, 1200 / im.naturalWidth)
      const c = document.createElement('canvas')
      c.width = Math.round(im.naturalWidth * scale)
      c.height = Math.round(im.naturalHeight * scale)
      c.getContext('2d').drawImage(im, 0, 0, c.width, c.height)
      URL.revokeObjectURL(url)
      resolve(c.toDataURL('image/webp', 0.85))
    }
    im.onerror = reject
    im.src = url
  })
}

function BusinessAdmin() {
  const s = useSettings()
  const pick = () => ({
    name: s.name, tagline: s.tagline, logo: s.logo, phone: s.phone, address: s.address, mapQuery: s.mapQuery,
    instagram: s.instagram, facebook: s.facebook, tiktok: s.tiktok, reviewsUrl: s.reviewsUrl,
    hours: s.hoursForm, slotMinutes: s.slotMinutes, leadMinutes: s.leadMinutes, adminUser: s.adminUser, adminPass: s.adminPass,
  })
  const [f, setF] = useState(null)
  const [saved, setSaved] = useState(false)
  useEffect(() => { if (s.loaded && f === null) setF(pick()) }, [s.loaded]) // eslint-disable-line
  if (!f) return <div className="empty">Cargando…</div>
  const set = (k, v) => { setSaved(false); setF((x) => ({ ...x, [k]: v })) }
  const setDay = (d, k, v) => set('hours', { ...f.hours, [d]: { ...f.hours[d], [k]: v } })
  const save = async () => {
    await setValue('settings', { ...s.raw, ...f, slotMinutes: Number(f.slotMinutes), leadMinutes: Number(f.leadMinutes) })
    setSaved(true)
  }
  const inp = (k, label, ph, type = 'text') => (
    <div className="field"><label>{label}</label><input className="inp" type={type} placeholder={ph} value={f[k] || ''} onChange={(e) => set(k, e.target.value)} /></div>
  )

  return (
    <>
      {!f.phone && <div className="ocard" style={{ borderLeftColor: 'var(--red2)' }}><b>Falta cargar el WhatsApp del local.</b> Sin eso los clientes no pueden enviarte el pedido.</div>}

      <div className="ocard" style={{ borderLeftColor: 'var(--gold)' }}>
        <span className="label-s" style={{ marginTop: 0 }}>Marca</span>
        {inp('name', 'Nombre del negocio', 'Al Estilo Criollo')}
        {inp('tagline', 'Frase corta', 'Carnes Premium')}
        <div className="field">
          <label>Logo (la imagen de arriba de la web)</label>
          <div className="imgpick">
            <img src={f.logo || '/logo.webp'} alt="" style={{ width: 150, height: 80, objectFit: 'contain', background: '#000' }} />
            <div style={{ display: 'grid', gap: 8 }}>
              <label className="btn-ghost" style={{ cursor: 'pointer', textAlign: 'center' }}>
                Subir otro logo
                <input type="file" accept="image/*" hidden onChange={async (e) => { const fl = e.target.files[0]; e.target.value = ''; if (fl) set('logo', await compressLogo(fl)) }} />
              </label>
              {f.logo && <button className="btn-ghost" onClick={() => set('logo', '')}>Volver al logo original</button>}
            </div>
          </div>
          <div className="hint" style={{ marginTop: 6 }}>Mejor una imagen ancha de al menos 1000 px de ancho, para que se vea nítida.</div>
        </div>
      </div>

      <div className="ocard" style={{ borderLeftColor: 'var(--gold)' }}>
        <span className="label-s" style={{ marginTop: 0 }}>Contacto y ubicación</span>
        {inp('phone', 'WhatsApp / teléfono (recibe los pedidos)', '11 2345 6789', 'tel')}
        <div className="hint" style={{ marginTop: -8, marginBottom: 12 }}>Con código de área, sin 0 y sin 15.</div>
        {inp('address', 'Dirección (se muestra en la web)', 'Av. Libertador 1234, San Martín')}
        {inp('mapQuery', 'Dirección para el mapa de Google', 'Av. Libertador 1234, San Martín, Buenos Aires')}
        <div className="hint" style={{ marginTop: -8 }}>Escribila como la buscarías en Google Maps. Si la dejás vacía, no se muestra el mapa.</div>
      </div>

      <div className="ocard" style={{ borderLeftColor: 'var(--gold)' }}>
        <span className="label-s" style={{ marginTop: 0 }}>Redes y reseñas</span>
        {inp('instagram', 'Instagram (link completo)', 'https://instagram.com/tu_usuario')}
        {inp('facebook', 'Facebook (link completo)', 'https://facebook.com/tu_pagina')}
        {inp('tiktok', 'TikTok (link completo)', 'https://tiktok.com/@tu_usuario')}
        {inp('reviewsUrl', 'Link para dejar reseña en Google', 'https://g.page/r/…')}
        <div className="hint" style={{ marginTop: -8 }}>Se saca de Google Maps: tu negocio → “Escribir una reseña” → Compartir.</div>
      </div>

      <div className="ocard" style={{ borderLeftColor: 'var(--gold)' }}>
        <span className="label-s" style={{ marginTop: 0 }}>Horarios de atención y retiro</span>
        {DAY_ORDER.map((d) => (
          <div className="row" key={d} style={{ marginBottom: 8, flexWrap: 'wrap' }}>
            <label className="switch" style={{ width: 150, padding: '8px 10px' }}>
              <input type="checkbox" checked={!!f.hours[d].open} onChange={(e) => setDay(d, 'open', e.target.checked)} />{DAYS_ES[d]}
            </label>
            {f.hours[d].open ? (
              <>
                <input className="inp" type="time" style={{ width: 120 }} value={f.hours[d].from} onChange={(e) => setDay(d, 'from', e.target.value)} />
                <span>a</span>
                <input className="inp" type="time" style={{ width: 120 }} value={f.hours[d].to} onChange={(e) => setDay(d, 'to', e.target.value)} />
              </>
            ) : <span className="hint">Cerrado</span>}
          </div>
        ))}
        <div className="two" style={{ marginTop: 12 }}>
          <div className="field"><label>Turnos de retiro cada</label>
            <select className="inp" value={f.slotMinutes} onChange={(e) => set('slotMinutes', e.target.value)}>{[15, 30, 60].map((n) => <option key={n} value={n}>{n} min</option>)}</select>
          </div>
          <div className="field"><label>Anticipación mínima (hoy)</label>
            <select className="inp" value={f.leadMinutes} onChange={(e) => set('leadMinutes', e.target.value)}>{[0, 30, 60, 120].map((n) => <option key={n} value={n}>{n ? `${n} min` : 'Sin mínimo'}</option>)}</select>
          </div>
        </div>
      </div>

      <div className="ocard" style={{ borderLeftColor: 'var(--gold)' }}>
        <span className="label-s" style={{ marginTop: 0 }}>Acceso al panel</span>
        <div className="two">
          {inp('adminUser', 'Usuario', 'admin')}
          {inp('adminPass', 'Contraseña', 'criollo2026')}
        </div>
        <div className="hint" style={{ marginTop: -8 }}>Si lo dejás vacío se usa el usuario y contraseña original. Cambialos para que solo entre el dueño.</div>
      </div>

      <div className="sticky-save" style={{ borderRadius: 12, border: '1px solid var(--line)' }}>
        <button className="btn-red" onClick={save}>{saved ? '✓ Cambios guardados' : 'Guardar cambios'}</button>
      </div>
    </>
  )
}
