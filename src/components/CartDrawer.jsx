import { useEffect, useMemo, useState } from 'react'
import { useCart } from '../cart'
import { setValue, newId, reserveSlot } from '../store'
import { useNode } from '../hooks'
import { useSettings } from '../settings'
import { money, openDates, slotsFor, fmtDate, makeCode, orderMessage, waLink, imgUrl, deliveryDates, deliverySlotsFor } from '../utils'

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
  const [form, setForm] = useState({ name: '', lastName: '', phone: '', date: '', time: '', street: '', number: '', between1: '', between2: '', zoneId: '', dDate: '', dSlot: '' })
  const [mode, setMode] = useState('pickup') // pickup | delivery

  // datos de envío (solo se descargan con el carrito abierto)
  const zonesRaw = useNode(open ? 'delivery/zones' : 'delivery/_off')
  const schedRaw = useNode(open ? 'delivery/schedule' : 'delivery/_off')
  const loadRaw = useNode(open ? 'delivery/load' : 'delivery/_off')
  const zones = useMemo(
    () => Object.entries(zonesRaw || {}).map(([id, z]) => ({ ...z, id })).filter((z) => z.active !== false && z.name).sort((a, b) => (a.order || 0) - (b.order || 0)),
    [zonesRaw]
  )
  const dDates = useMemo(() => (open ? deliveryDates(schedRaw, loadRaw) : []), [open, schedRaw, loadRaw])
  const dSlots = useMemo(() => (open ? deliverySlotsFor(schedRaw, loadRaw, form.dDate) : []), [open, schedRaw, loadRaw, form.dDate])
  const hasZones = zones.length > 0
  const canDeliver = hasZones && dDates.length > 0
  const zone = zones.find((z) => z.id === form.zoneId)
  const shipping = mode === 'delivery' && zone ? Number(zone.cost) || 0 : 0
  const grand = total + shipping

  const slots = useMemo(() => slotsFor(form.date, st.hours, st.slotMinutes, st.leadMinutes), [form.date, st.hours, st.slotMinutes, st.leadMinutes])

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    if (open && view === 'form' && !form.date && dates.length) setForm((f) => ({ ...f, date: dates[0], time: '' }))
  }, [open, view, dates, form.date])

  useEffect(() => {
    if (mode !== 'delivery') return
    if (!canDeliver) return setMode('pickup')
    if (!dDates.includes(form.dDate)) setForm((f) => ({ ...f, dDate: dDates[0], dSlot: '' }))
    else if (form.dSlot && !dSlots.some((s) => s.id === form.dSlot)) setForm((f) => ({ ...f, dSlot: '' }))
    if (zones.length === 1 && form.zoneId !== zones[0].id) setForm((f) => ({ ...f, zoneId: zones[0].id }))
  }, [mode, canDeliver, dDates, dSlots, zones, form.dDate, form.dSlot, form.zoneId])

  if (!open) return null
  const close = () => {
    setOpen(false)
    if (view === 'done') { setView('cart'); setDone(null) }
  }
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value, ...(k === 'date' ? { time: '' } : {}), ...(k === 'dDate' ? { dSlot: '' } : {}) }))

  const submit = async () => {
    setErr('')
    const digits = form.phone.replace(/\D/g, '')
    if (!form.name.trim() || !form.lastName.trim()) return setErr('Completá tu nombre y apellido.')
    if (digits.length < 8) return setErr('Revisá el teléfono (código de área + número).')
    const isDelivery = mode === 'delivery'
    const fullAddress = `${form.street.trim()} ${form.number.trim()}${form.between1.trim() ? ` (entre ${form.between1.trim()} y ${form.between2.trim()})` : ''}`
    let slot = null
    if (isDelivery) {
      if (form.street.trim().length < 2) return setErr('Completá la calle.')
      if (!form.number.trim()) return setErr('Completá la altura.')
      if (!!form.between1.trim() !== !!form.between2.trim()) return setErr('Completá las dos calles de "Entre" o dejalas vacías.')
      if (fullAddress.length < 6) return setErr('Revisá la dirección.')
      if (!zone) return setErr('Elegí tu zona de envío.')
      slot = dSlots.find((s) => s.id === form.dSlot)
      if (!form.dDate || !slot) return setErr('Elegí día y rango horario de entrega.')
    } else if (!form.date || !form.time) return setErr('Elegí día y horario aproximado de retiro.')
    if (!lines.length) return setErr('Tu pedido está vacío.')
    setBusy(true)
    if (isDelivery) {
      // primero se reserva el cupo (si dos personas toman el último, solo una lo consigue)
      let ok = false
      try { ok = await reserveSlot(form.dDate, slot.id, slot.cap) } catch { ok = null }
      if (ok === null) { setBusy(false); return setErr('No pudimos reservar el horario. Probá de nuevo en un momento.') }
      if (!ok) { setBusy(false); setForm((f) => ({ ...f, dSlot: '' })); return setErr('Ese rango horario se acaba de llenar. Elegí otro.') }
    }
    const order = {
      id: newId(),
      code: makeCode(),
      name: form.name.trim(),
      lastName: form.lastName.trim(),
      phone: form.phone.trim(),
      pickupDate: isDelivery ? form.dDate : form.date,
      pickupTime: isDelivery ? `${slot.from} a ${slot.to}` : form.time,
      status: 'pending',
      createdAt: Date.now(),
      total: grand,
      ...(isDelivery
        ? { type: 'delivery', address: fullAddress, street: form.street.trim(), streetNumber: form.number.trim(), between1: form.between1.trim(), between2: form.between2.trim(), zoneId: zone.id, zoneName: zone.name, deliveryCost: shipping, deliveryDate: form.dDate, deliveryFrom: slot.from, deliveryTo: slot.to, deliverySlot: slot.id }
        : { type: 'pickup' }),
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
        type: order.type, pickupDate: order.pickupDate, pickupTime: order.pickupTime, total: order.total, createdAt: order.createdAt,
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
                    <img src={imgUrl(l.product.image, 160)} alt="" />
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
              {hasZones && (
                <div className="mode-sw">
                  <button type="button" className={mode === 'pickup' ? 'on' : ''} onClick={() => setMode('pickup')}>🏪 Retiro en tienda</button>
                  <button type="button" className={mode === 'delivery' ? 'on' : ''} disabled={!canDeliver} onClick={() => setMode('delivery')}>🚚 Envío a domicilio</button>
                </div>
              )}
              {hasZones && !canDeliver && <p className="hint" style={{ margin: '-6px 0 12px' }}>Por ahora no hay turnos de envío disponibles. Podés retirar en el local.</p>}
              <div className="two">
                <div className="field"><label>Nombre</label><input className="inp" value={form.name} onChange={set('name')} autoComplete="given-name" /></div>
                <div className="field"><label>Apellido</label><input className="inp" value={form.lastName} onChange={set('lastName')} autoComplete="family-name" /></div>
              </div>
              <div className="field">
                <label>Teléfono / WhatsApp</label>
                <input className="inp" type="tel" inputMode="tel" placeholder="11 2345 6789" value={form.phone} onChange={set('phone')} autoComplete="tel" />
                <span className="hint">Código de área sin 0 y sin 15.</span>
              </div>
              {mode === 'delivery' ? (
                <>
                  <div className="two">
                    <div className="field"><label>Calle</label><input className="inp" value={form.street} onChange={set('street')} autoComplete="address-line1" /></div>
                    <div className="field"><label>Altura</label><input className="inp" value={form.number} onChange={set('number')} inputMode="numeric" /></div>
                  </div>
                  <div className="two">
                    <div className="field"><label>Entre</label><input className="inp" value={form.between1} onChange={set('between1')} placeholder="Calle" /></div>
                    <div className="field"><label>y</label><input className="inp" value={form.between2} onChange={set('between2')} placeholder="Calle" /></div>
                  </div>
                  <div className="field">
                    <label>Zona de envío</label>
                    <select className="inp" value={form.zoneId} onChange={set('zoneId')}>
                      <option value="">Elegir…</option>
                      {zones.map((z) => <option key={z.id} value={z.id}>{z.name} — {Number(z.cost) > 0 ? money(z.cost) : 'envío gratis'}</option>)}
                    </select>
                  </div>
                  <div className="two">
                    <div className="field">
                      <label>Día de entrega</label>
                      <select className="inp" value={form.dDate} onChange={set('dDate')}>
                        {dDates.map((d) => <option key={d} value={d}>{fmtDate(d)}</option>)}
                      </select>
                    </div>
                    <div className="field">
                      <label>Rango horario</label>
                      <select className="inp" value={form.dSlot} onChange={set('dSlot')}>
                        <option value="">Elegir…</option>
                        {dSlots.map((s) => <option key={s.id} value={s.id}>{s.from} a {s.to} hs</option>)}
                      </select>
                    </div>
                  </div>
                  {zone && <div className="tot" style={{ marginTop: 6 }}><span>Envío</span><b style={{ fontSize: 18 }}>{money(shipping)}</b></div>}
                </>
              ) : (
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
              )}
              <div className="tot" style={{ marginTop: 10 }}><span>Total estimado</span><b>{money(grand)}</b></div>
              <p className="hint" style={{ marginTop: 6 }}>{mode === 'delivery' ? 'Te lo llevamos en el rango horario elegido.' : 'Retirás en el local. El pago se hace al retirar.'}</p>
              <p className="hint" style={{ marginTop: 6 }}>El total es estimativo: puede haber pequeñas diferencias al pesar los productos.</p>
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
              <p>Gracias {done.name}. Tu código de {done.type === 'delivery' ? 'pedido' : 'retiro'} es:</p>
              <div className="ticket">
                <div className="code">{done.code}</div>
                <div className="hint" style={{ marginTop: 6 }}>
                  {done.type === 'delivery'
                    ? `Envío: ${fmtDate(done.deliveryDate)} entre ${done.deliveryFrom} y ${done.deliveryTo} hs`
                    : `Mostralo al retirar · ${fmtDate(done.pickupDate)} ${done.pickupTime} hs aprox.`}
                </div>
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
