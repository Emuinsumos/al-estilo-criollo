import { useMemo, useState } from 'react'
import { setValue, removeValue, newId } from '../store'
import { useProducts, usePromos } from '../hooks'
import { money, promoInfo, uploadImage } from '../utils'
import ImageCropper from './ImageCropper'

export default function PromosAdmin() {
  const { promos } = usePromos()
  const { products } = useProducts()
  const [edit, setEdit] = useState(null)

  const blank = () => ({ id: newId(), name: '', description: '', image: '', items: [{ productId: '', label: '', qty: 1 }], price: '', active: true, createdAt: Date.now() })

  const problem = (p) => {
    const info = promoInfo(p, products)
    const bad = info.rows.find((r) => r.missing || r.soldOut)
    if (!bad) return ''
    if (!bad.product) return 'un producto fue borrado'
    if (!bad.variant) return `"${bad.product.name}" ya no tiene la presentación ${bad.label}`
    return `"${bad.product.name}" está agotado`
  }

  return (
    <>
      <div className="bar-actions">
        <span className="hint">{promos.length} promos · {promos.filter((p) => p.active !== false).length} activas</span>
        <button className="btn-red" style={{ width: 'auto', padding: '11px 22px' }} onClick={() => (products.length ? setEdit(blank()) : alert('Primero cargá productos.'))}>+ Nueva promo</button>
      </div>
      <div className="alist">
        {promos.map((p) => {
          const bad = problem(p)
          return (
            <div className="arow" key={p.id} style={{ flexWrap: 'wrap', opacity: p.active === false ? 0.6 : 1 }}>
              {p.image ? <img src={p.image} alt="" /> : <img alt="" />}
              <div className="info">
                <b>{p.name}</b>
                <span>{p.items.length} {p.items.length === 1 ? 'producto' : 'productos'} · {money(p.price)}{p.active === false ? ' · PAUSADA' : ''}</span>
                {bad && <span style={{ color: '#ff8a7a', display: 'block' }}>⚠ No se muestra: {bad}</span>}
              </div>
              <button className="mini" onClick={() => setEdit({ ...p, items: p.items.map((i) => ({ ...i })) })}>Editar</button>
              <button className="mini" onClick={() => setValue(`promos/${p.id}/active`, p.active === false)}>{p.active === false ? 'Activar' : 'Pausar'}</button>
              <button className="mini del" onClick={() => confirm(`¿Borrar la promo "${p.name}"?`) && removeValue(`promos/${p.id}`)}>Borrar</button>
            </div>
          )
        })}
        {!promos.length && <div className="empty">Todavía no armaste promos. Una promo es un combo de productos a un precio especial.</div>}
      </div>
      {edit && <PromoForm initial={edit} products={products} isNew={!promos.some((p) => p.id === edit.id)} onClose={() => setEdit(null)} />}
    </>
  )
}

function PromoForm({ initial, products, isNew, onClose }) {
  const [p, setP] = useState(initial)
  const [file, setFile] = useState(null)
  const [err, setErr] = useState('')
  const [uploading, setUploading] = useState(false)
  const set = (k, v) => setP((x) => ({ ...x, [k]: v }))
  const setItem = (i, patch) => setP((x) => ({ ...x, items: x.items.map((r, j) => (j === i ? { ...r, ...patch } : r)) }))
  const sorted = useMemo(() => [...products].sort((a, b) => a.name.localeCompare(b.name)), [products])

  const pickProduct = (i, productId) => {
    const prod = products.find((x) => x.id === productId)
    setItem(i, { productId, label: prod?.variants?.[0]?.label || '' })
  }

  const regular = promoInfo(p, products).regular

  const save = async () => {
    if (uploading) return setErr('Esperá que termine de subir la foto.')
    const items = p.items.map((r) => ({ productId: r.productId, label: r.label, qty: Math.floor(Number(r.qty)) }))
    if (!p.name.trim()) return setErr('Poné un nombre para la promo.')
    if (!items.length || items.some((r) => !r.productId || !r.label)) return setErr('Elegí el producto y la presentación en cada fila.')
    if (items.some((r) => !(r.qty >= 1))) return setErr('La cantidad de cada producto tiene que ser 1 o más.')
    if (!(Number(p.price) > 0)) return setErr('Poné el precio de la promo.')
    setErr('')
    await setValue(`promos/${p.id}`, { ...p, name: p.name.trim(), description: (p.description || '').trim(), items, price: Math.round(Number(p.price)) })
    onClose()
  }

  return (
    <div className="overlay">
      <div className="modal wide" style={{ padding: 0 }}>
        <div style={{ padding: '20px 22px 4px' }}>
          <h2 style={{ fontFamily: 'var(--font-title)' }}>{isNew ? 'Nueva promo' : 'Editar promo'}</h2>
          <div className="field" style={{ marginTop: 14 }}><label>Nombre</label><input className="inp" value={p.name} onChange={(e) => set('name', e.target.value)} placeholder="Ej: Combo Asado Familiar" /></div>
          <div className="field"><label>Descripción (opcional)</label><textarea className="inp" value={p.description || ''} onChange={(e) => set('description', e.target.value)} /></div>

          <div className="field">
            <label>Foto (opcional)</label>
            <div className="imgpick">
              {p.image && <img src={p.image} alt="" />}
              <label className="btn-ghost" style={{ cursor: 'pointer', textAlign: 'center' }}>
                {p.image ? 'Cambiar / recortar' : 'Subir foto'}
                <input type="file" accept="image/*" hidden onChange={(e) => { setFile(e.target.files[0] || null); e.target.value = '' }} />
              </label>
            </div>
          </div>

          <div className="field">
            <label>Qué incluye</label>
            <div className="hint" style={{ marginBottom: 8 }}>Elegí el producto, la presentación y cuántas veces entra en la promo.</div>
            {p.items.map((r, i) => {
              const prod = products.find((x) => x.id === r.productId)
              const labelMissing = prod && !prod.variants?.some((v) => v.label === r.label)
              return (
                <div className="promo-row" key={i}>
                  <select className="inp" value={r.productId} onChange={(e) => pickProduct(i, e.target.value)}>
                    <option value="">Producto…</option>
                    {sorted.map((x) => <option key={x.id} value={x.id}>{x.name}{x.soldOut ? ' (agotado)' : ''}</option>)}
                  </select>
                  <select className="inp" value={labelMissing ? '' : r.label} onChange={(e) => setItem(i, { label: e.target.value })} disabled={!prod}>
                    {labelMissing && <option value="">⚠ ya no existe “{r.label}”</option>}
                    {(prod?.variants || []).map((v) => <option key={v.label} value={v.label}>{v.label} · {money(v.price)}</option>)}
                  </select>
                  <div className="qty-in">
                    <span>×</span>
                    <input className="inp" type="number" inputMode="numeric" min="1" value={r.qty} onChange={(e) => setItem(i, { qty: e.target.value })} aria-label="Cantidad" />
                  </div>
                  <button className="mini del" onClick={() => set('items', p.items.filter((_, j) => j !== i))} disabled={p.items.length === 1} aria-label="Quitar">✕</button>
                </div>
              )
            })}
            <button className="btn-ghost" onClick={() => set('items', [...p.items, { productId: '', label: '', qty: 1 }])}>+ Agregar otro producto</button>
          </div>

          <div className="field">
            <label>Precio de la promo ($)</label>
            <input className="inp" type="number" inputMode="numeric" min="1" value={p.price} onChange={(e) => set('price', e.target.value)} />
            {regular > 0 && (
              <div className="hint" style={{ marginTop: 6 }}>
                Por separado estos productos salen <b>{money(regular)}</b>
                {Number(p.price) > 0 && Number(p.price) >= regular ? ' · ⚠ el precio de la promo no es menor' : ''}
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gap: 10, marginBottom: 16 }}>
            <label className="switch"><input type="checkbox" checked={p.active !== false} onChange={(e) => set('active', e.target.checked)} /><span><b>Promo activa</b><br /><span className="hint">Si la pausás, no se muestra en la web pero queda guardada.</span></span></label>
          </div>
          {err && <div className="err">{err}</div>}
        </div>
        <div className="sticky-save">
          <button className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn-red" onClick={save} disabled={uploading}>{uploading ? 'Subiendo foto…' : 'Guardar promo'}</button>
        </div>
      </div>
      {file && <ImageCropper file={file} onCancel={() => setFile(null)} onDone={async (url) => {
        setFile(null)
        setUploading(true)
        setErr('')
        try { set('image', await uploadImage(url)) } catch { setErr('No se pudo subir la foto. Revisá la conexión e intentá de nuevo.') }
        setUploading(false)
      }} />}
    </div>
  )
}
