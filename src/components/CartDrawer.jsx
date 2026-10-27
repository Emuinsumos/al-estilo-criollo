import { useEffect, useMemo, useState } from 'react'
import { useCart } from '../cart'
import { setValue, newId } from '../store'
import { useSettings } from '../settings'
import { money, openDates, slotsFor, fmtDate, makeCode, orderMessage, waLink } from '../utils'

const WaIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M20.5 3.5A11.8 11.8 0 0 0 12 0C5.4 0 .1 5.3.1 11.9c0 2.1.5 4.1 1.6 5.9L0 24l6.4-1.7a11.9 11.9 0 0 0 5.6 1.4c6.6 0 11.9-5.3 11.9-11.9 0-3.2-1.2-6.200-3.4-8.300zM12 21.700c-1.800 0-3.500-.5-5-1.400l-.4-.2-3.800 1 1-3.700-.2-.4a9.800 9.800 0 0 1-1.500-5.200c0-5.400 4.400-9.800 9.900-9.800 2.600 0 5.100 1 6.900 2.900a9.700 9.700 0 0 1 2.900 6.900c0 5.400-4.400 9.900-9.800 9.900zm5.400-7.400c-.3-.1-1.800-.9-2-1s-.5-.1-.7.100-.8 1-.9 1.200-.3.200-.6.100a8 8 0 0 1-4-3.500c-.3-.5.3-.5.900-1.600.1-.2.100-.4 0-.5l-.9-2.200c-.2-.6-.5-.5-.7-.5h-.6a1.100 1.100 0 0 0-.8.400 3.400 3.400 0 0 0-1.100 2.500c0 1.500 1.100 2.900 1.200 3.100s2.100 3.200 5.100 4.500c1.900.8 2.600.9 3.500.7.600-.1 1.800-.7 2-1.400s.3-1.300.2-1.400-.3-.2-.6-.3z" /></svg>
)

export default function CartDrawer() {
  const st = useSettings()
  const { lines, total, count, open, setOpen, dispatch } = useCart()
  const [view, setView] = useState('cart') // cart | form | done
  const [done, setDone] = useState(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const dates = useMemo(() => (open ? openDates(st.hours, st.slotMinutes, st.leadMinutes) : []), [open, st.hours, st.slotMinutes, st.leadMinutes])
  const [form, setForm] = useState({ name: '', lastName: '', phone: '', date: '', time: '' })

  const slots = useMemo(() => slotsFor(form.date, st.hours, st.slotMinutes, st.leadMinutes), [form.date, st.hours, st.slotMinutes, st.leadMinutes])

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    if (open && view === 'form' && !form.date && dates.length) setForm((f) => ({ ...f, date: dates[0], time: '' }))
  }, [open, view, dates, form.date])

  if (!open) return null
  const close = () => {
    setOpen(false)
    if (view === 'done') { setView('cart'); setDone(null) }
  }
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value, ...(k === 'date' ? { time: '' } : {}) }))

  const submit = async () => {
    setErr('')
    const digits = form.phone.replace(/\D/g, '')
    if (!form.name.trim() || !form.lastName.trim()) return setErr('Completá tu nombre y apellido.')
    if (digits.length < 8) return setErr('Revisá el teléfono (código de área + número).')
    if (!form.date || !form.time) return setErr('Elegí día y horario aproximado de retiro.')
    if (!lines.length) return setErr('Tu pedido está vacío.')
    setBusy(true)
    const order = {
      id: newId(),
      code: makeCode(),
      name: form.name.trim(),
      lastName: form.lastName.trim(),
      phone: form.phone.trim(),
      pickupDate: form.date,
      pickupTime: form.time,
      status: 'pending',
      createdAt: Date.now(),
      total,
      items: lines.map((l) => ({
        name: l.product.name,
        variant: l.variant.label,
        price: l.info.price,
        qty: l.qty,
        note: l.note || '',
      })),
    }
    try {
      await setValue(`orders/${order.id}`, order)
      await setValue(`track/${order.code}`, {
        code: order.code, firstName: order.name, status: 'pending',
        pickupDate: order.pickupDate, pickupTime: order.pickupTime, total: order.total, createdAt: order.createdAt,
      })
      try { localStorage.setItem('criollo-last-code', order.code) } catch {}
      setDone(order)
      setView('done')
      dispatch({ type: 'clear' })
    } catch (e) {
      setErr('No pudimos registrar el pedido. Probá de nuevo en un momento.')
    }
    setBusy(false)
  }

  return (
    <>
      <div className="drawer-bg" onClick={close} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label="Mi pedido">
        <header>
          <h2>{view === 'done' ? '¡Pedido recibido!' : view === 'form' ? 'Tus datos' : 'Mi pedido'}</h2>
          <button className="x-btn" style={{ position: 'static' }} onClick={close} aria-label="Cerrar">×</button>
        </header>

        {view === 'cart' && (
          <>
            <div className="scroll">
              {!lines.length ? (
                <div className="empty">Todavía no agregaste nada.<br />Elegí tus cortes y armamos el pedido.</div>
              ) : (
                lines.map((l) => (
                  <div className="line" key={l.key}>
                    <img src={l.product.image} alt="" />
                    <div>
                      <div className="nm">{l.product.name}</div>
                      <div className="sub">
                        {l.variant.label} · {money(l.info.price)}
                      </div>
                      {l.note && <div className="nt">“{l.note}”</div>}
                      <div className="ctr">
                        <div className="stepper">
                          <button onClick={() => dispatch({ type: 'qty', key: l.key, d: -1 })} aria-label="Menos">−</button>
                          <span>{l.qty}</span>
                          <button onClick={() => dispatch({ type: 'qty', key: l.key, d: 1 })} aria-label="Más">+</button>
                        </div>
                        <b>{money(l.subtotal)}</b>
                        <button className="mini del" onClick={() => dispatch({ type: 'remove', key: l.key })} aria-label="Quitar">✕</button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {lines.length > 0 && (
              <footer>
                <div className="tot"><span>Total estimado</span><b>{money(total)}</b></div>
                <p className="hint">Los productos por peso pueden variar levemente: el importe final se confirma al pesar en el local.</p>
                <button className="btn-red" onClick={() => setView('form')}>Finalizar compra</button>
              </footer>
            )}
          </>
        )}

        {view === 'form' && (
          <>
            <div className="scroll">
              <div className="two">
                <div className="field"><label>Nombre</label><input className="inp" value={form.name} onChange={set('name')} autoComplete="given-name" /></div>
                <div className="field"><label>Apellido</label><input className="inp" value={form.lastName} onChange={set('lastName')} autoComplete="family-name" /></div>
              </div>
              <div className="field">
                <label>Teléfono / WhatsApp</label>
                <input className="inp" type="tel" inputMode="tel" placeholder="11 2345 6789" value={form.phone} onChange={set('phone')} autoComplete="tel" />
                <span className="hint">Código de área sin 0 y sin 15.</span>
              </div>
              <div className="two">
                <div className="field">
                  <label>Día de retiro</label>
                  <select className="inp" value={form.date} onChange={set('date')}>
                    {dates.map((d) => <option key={d} value={d}>{fmtDate(d)}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Hora aprox.</label>
                  <select className="inp" value={form.time} onChange={set('time')}>
                    <option value="">Elegir…</option>
                    {slots.map((s) => <option key={s} value={s}>{s} hs</option>)}
                  </select>
                </div>
              </div>
              <div className="tot" style={{ marginTop: 10 }}><span>Total estimado</span><b>{money(total)}</b></div>
              <p className="hint" style={{ marginTop: 6 }}>Retirás en el local. El pago se hace al retirar.</p>
            </div>
            <footer>
              {err && <div className="err">{err}</div>}
              <button className="btn-red" disabled={busy} onClick={submit}>{busy ? 'Enviando…' : 'Confirmar pedido'}</button>
              <button className="btn-ghost" onClick={() => setView('cart')}>Volver</button>
            </footer>
          </>
        )}

        {view === 'done' && done && (
          <>
            <div className="scroll" style={{ textAlign: 'center' }}>
              <div className="checkmark">✓</div>
              <p>Gracias {done.name}. Tu código de retiro es:</p>
              <div className="ticket">
                <div className="code">{done.code}</div>
                <div className="hint" style={{ marginTop: 6 }}>Mostralo al retirar · {fmtDate(done.pickupDate)} {done.pickupTime} hs aprox.</div>
              </div>
              <p className="hint">Tocá el botón verde para enviarnos el pedido por WhatsApp y que lo preparemos. Te avisamos por ahí cuando esté listo.</p>
            </div>
            <footer>
              <a className="btn-wa" href={waLink(st.whatsapp, orderMessage(done, st.name))} target="_blank" rel="noreferrer">
                <WaIcon /> Enviar pedido por WhatsApp
              </a>
              <button className="btn-ghost" onClick={() => { close(); window.dispatchEvent(new CustomEvent('criollo-track', { detail: done.code })); setTimeout(() => document.getElementById('seguimiento')?.scrollIntoView({ behavior: 'smooth' }), 150) }}>Seguir mi pedido</button>
              <button className="btn-ghost" onClick={close}>Cerrar</button>
            </footer>
          </>
        )}
      </aside>
    </>
  )
}
