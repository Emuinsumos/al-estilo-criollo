import { useEffect, useMemo, useState } from 'react'
import { setValue, removeValue, newId } from '../store'
import { useNode } from '../hooks'
import { fmtDate, money } from '../utils'

const DEFAULT_CAP = 5
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const WEEK = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const pad = (n) => String(n).padStart(2, '0')
const key = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}` // m = 0..11
const todayKey = () => { const t = new Date(); return key(t.getFullYear(), t.getMonth(), t.getDate()) }

export default function DeliveryAdmin() {
  const [sub, setSub] = useState('agenda')
  return (
    <>
      <div className="tabs" style={{ paddingTop: 0 }}>
        <button className={`tab ${sub === 'agenda' ? 'on' : ''}`} onClick={() => setSub('agenda')}>Agenda</button>
        <button className={`tab ${sub === 'zones' ? 'on' : ''}`} onClick={() => setSub('zones')}>Zonas</button>
      </div>
      {sub === 'zones' && <Zones />}
      {sub === 'agenda' && <Agenda />}
    </>
  )
}

/* ---------------- Zonas de envío ---------------- */
function Zones() {
  const raw = useNode('delivery/zones')
  const zones = useMemo(
    () => Object.entries(raw || {}).map(([id, z]) => ({ ...z, id })).sort((a, b) => (a.order || 0) - (b.order || 0)),
    [raw]
  )
  const [name, setName] = useState('')
  const [cost, setCost] = useState('')

  const add = () => {
    const n = name.trim()
    const c = Number(cost)
    if (!n) return alert('Poné el nombre de la zona.')
    if (cost === '' || !(c >= 0)) return alert('Poné el costo del envío (0 si es gratis).')
    const order = zones.length ? Math.max(...zones.map((z) => z.order || 0)) + 1 : 1
    setValue(`delivery/zones/${newId()}`, { name: n, cost: Math.round(c), active: true, order })
    setName('')
    setCost('')
  }
  const rename = (z) => {
    const n = prompt('Nombre de la zona', z.name)
    if (n && n.trim()) setValue(`delivery/zones/${z.id}/name`, n.trim())
  }
  const recost = (z) => {
    const c = prompt('Costo del envío ($)', z.cost)
    if (c === null) return
    const v = Number(c)
    if (c.trim() === '' || !(v >= 0)) return alert('Costo inválido.')
    setValue(`delivery/zones/${z.id}/cost`, Math.round(v))
  }
  const del = (z) => confirm(`¿Borrar la zona "${z.name}"?`) && removeValue(`delivery/zones/${z.id}`)

  return (
    <>
      <p className="hint" style={{ marginBottom: 12 }}>Cargá las zonas a las que enviás y cuánto cuesta el envío a cada una. El cliente elige su zona al comprar.</p>
      <div className="row" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
        <input className="inp" style={{ flex: 2, minWidth: 160 }} placeholder="Zona (ej: San Martín centro)" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="inp" style={{ flex: 1, minWidth: 110 }} type="number" inputMode="numeric" min="0" placeholder="Costo $" value={cost} onChange={(e) => setCost(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} />
        <button className="btn-red" style={{ width: 'auto', padding: '12px 22px' }} onClick={add}>Agregar</button>
      </div>
      <div className="alist">
        {zones.map((z) => (
          <div className="arow" key={z.id} style={{ flexWrap: 'wrap', opacity: z.active === false ? 0.55 : 1 }}>
            <div className="info"><b>{z.name}</b><span>{z.cost > 0 ? money(z.cost) : 'Envío gratis'}{z.active === false ? ' · desactivada' : ''}</span></div>
            <button className="mini" onClick={() => rename(z)}>Nombre</button>
            <button className="mini" onClick={() => recost(z)}>Costo</button>
            <button className="mini" onClick={() => setValue(`delivery/zones/${z.id}/active`, z.active === false)}>{z.active === false ? 'Activar' : 'Pausar'}</button>
            <button className="mini del" onClick={() => del(z)}>Borrar</button>
          </div>
        ))}
        {raw !== undefined && !zones.length && <div className="empty">Todavía no cargaste zonas. Sin zonas, la opción de envío no se muestra en la web.</div>}
      </div>
    </>
  )
}

/* ---------------- Agenda mensual ---------------- */
function Agenda() {
  const raw = useNode('delivery/schedule')
  const now = new Date()
  const [ym, setYm] = useState({ y: now.getFullYear(), m: now.getMonth() })
  const [sel, setSel] = useState(null) // 'YYYY-MM-DD'
  const [draft, setDraft] = useState([])
  const [dirty, setDirty] = useState(false)
  const [msg, setMsg] = useState('')
  const today = todayKey()

  const daysInMonth = new Date(ym.y, ym.m + 1, 0).getDate()
  const offset = (new Date(ym.y, ym.m, 1).getDay() + 6) % 7 // lunes primero

  const slotsOf = (date) => Object.entries((raw && raw[date]) || {}).map(([id, s]) => ({ ...s, id })).sort((a, b) => String(a.from).localeCompare(String(b.from)))

  // al elegir un día (o cuando llegan datos y no hay cambios sin guardar), cargar su borrador
  useEffect(() => {
    if (sel && !dirty) setDraft(slotsOf(sel).map((s) => ({ id: s.id, from: s.from, to: s.to, cap: s.cap ?? DEFAULT_CAP })))
  }, [sel, raw])

  const pick = (date) => {
    if (dirty && !confirm('Tenés cambios sin guardar en este día. ¿Descartarlos?')) return
    setDirty(false)
    setMsg('')
    setSel(date)
    setDraft(slotsOf(date).map((s) => ({ id: s.id, from: s.from, to: s.to, cap: s.cap ?? DEFAULT_CAP })))
  }
  const move = (d) => {
    const t = new Date(ym.y, ym.m + d, 1)
    setYm({ y: t.getFullYear(), m: t.getMonth() })
  }
  const edit = (id, k, v) => { setDraft((l) => l.map((s) => (s.id === id ? { ...s, [k]: v } : s))); setDirty(true); setMsg('') }
  const addSlot = () => { setDraft((l) => [...l, { id: newId(), from: '09:00', to: '13:00', cap: DEFAULT_CAP }]); setDirty(true); setMsg('') }
  const rmSlot = (id) => { setDraft((l) => l.filter((s) => s.id !== id)); setDirty(true); setMsg('') }

  // valida y convierte el borrador a { id: {from,to,cap} }
  const build = () => {
    const out = {}
    for (const s of draft) {
      const cap = Math.floor(Number(s.cap))
      if (!/^\d{2}:\d{2}$/.test(s.from || '') || !/^\d{2}:\d{2}$/.test(s.to || '')) return { error: 'Completá desde y hasta en cada rango.' }
      if (s.from >= s.to) return { error: `El rango ${s.from} a ${s.to} es inválido: "desde" tiene que ser antes que "hasta".` }
      if (!(cap >= 1)) return { error: 'Los cupos tienen que ser 1 o más.' }
      out[s.id] = { from: s.from, to: s.to, cap }
    }
    const list = Object.values(out).sort((a, b) => a.from.localeCompare(b.from))
    for (let i = 1; i < list.length; i++) if (list[i].from < list[i - 1].to) return { error: `Los rangos ${list[i - 1].from}-${list[i - 1].to} y ${list[i].from}-${list[i].to} se pisan.` }
    return { out }
  }

  const writeDay = async (date, out) => {
    if (Object.keys(out).length) await setValue(`delivery/schedule/${date}`, out)
    else await removeValue(`delivery/schedule/${date}`)
  }

  const save = async () => {
    const r = build()
    if (r.error) return setMsg(r.error)
    await writeDay(sel, r.out)
    setDirty(false)
    setMsg('Guardado ✓')
  }

  // copia los rangos del día elegido (con cupos nuevos, sin tocar pedidos) a los mismos días de la semana del mes que vienen después
  const copyWeekday = async () => {
    const r = build()
    if (r.error) return setMsg(r.error)
    const [sy, sm, sd] = sel.split('-').map(Number)
    const wd = new Date(sy, sm - 1, sd).getDay()
    const targets = []
    for (let d = 1; d <= new Date(sy, sm, 0).getDate(); d++) {
      const k = key(sy, sm - 1, d)
      if (k !== sel && k >= today && new Date(sy, sm - 1, d).getDay() === wd) targets.push(k)
    }
    if (!targets.length) return setMsg('No hay otros días iguales en lo que queda del mes.')
    const withData = targets.filter((k) => raw && raw[k])
    if (!confirm(`Se van a copiar estos rangos a ${targets.length} día(s) del mes${withData.length ? ` (${withData.length} ya tienen agenda y se reemplaza)` : ''}. ¿Seguir?`)) return
    await writeDay(sel, r.out)
    for (const k of targets) {
      const copy = {}
      Object.values(r.out).forEach((s) => { copy[newId()] = { ...s } })
      await writeDay(k, copy)
    }
    setDirty(false)
    setMsg(`Copiado a ${targets.length} día(s) ✓`)
  }

  const cells = []
  for (let i = 0; i < offset; i++) cells.push(<div key={`e${i}`} />)
  for (let d = 1; d <= daysInMonth; d++) {
    const k = key(ym.y, ym.m, d)
    const n = raw && raw[k] ? Object.keys(raw[k]).length : 0
    const past = k < today
    cells.push(
      <button key={k} className={`cal-day ${sel === k ? 'sel' : ''} ${n ? 'has' : ''} ${past ? 'past' : ''} ${k === today ? 'today' : ''}`} onClick={() => pick(k)}>
        <b>{d}</b>
        {n > 0 && <span>{n} {n === 1 ? 'rango' : 'rangos'}</span>}
      </button>
    )
  }

  return (
    <>
      <p className="hint" style={{ marginBottom: 12 }}>Tocá un día y cargá los rangos de entrega con la cantidad de pedidos (cupos) que aceptás en cada uno. Un día sin rangos no aparece para el cliente.</p>
      <div className="cal-head">
        <button className="mini" onClick={() => move(-1)} aria-label="Mes anterior">←</button>
        <b>{MONTHS[ym.m]} {ym.y}</b>
        <button className="mini" onClick={() => move(1)} aria-label="Mes siguiente">→</button>
      </div>
      <div className="cal-grid">
        {WEEK.map((w, i) => <div key={i} className="cal-w">{w}</div>)}
        {cells}
      </div>

      {sel && (
        <div className="ocard" style={{ marginTop: 16, borderLeftColor: 'var(--gold)' }}>
          <div className="head"><b style={{ fontSize: 18 }}>{fmtDate(sel)}</b></div>
          {!draft.length && <p className="hint" style={{ margin: '10px 0' }}>Este día no tiene rangos. Agregá uno.</p>}
          {draft.map((s) => (
            <div key={s.id} className="slot-row">
              <div className="field"><label>Desde</label><input className="inp" type="time" value={s.from} onChange={(e) => edit(s.id, 'from', e.target.value)} /></div>
              <div className="field"><label>Hasta</label><input className="inp" type="time" value={s.to} onChange={(e) => edit(s.id, 'to', e.target.value)} /></div>
              <div className="field"><label>Cupos</label><input className="inp" type="number" inputMode="numeric" min="1" value={s.cap} onChange={(e) => edit(s.id, 'cap', e.target.value)} /></div>
              <button className="mini del" onClick={() => rmSlot(s.id)} aria-label="Quitar rango">✕</button>
            </div>
          ))}
          <div className="row" style={{ flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
            <button className="btn-ghost" onClick={addSlot}>+ Agregar rango</button>
            <button className="btn-red" style={{ width: 'auto', padding: '11px 22px' }} onClick={save} disabled={!dirty}>Guardar día</button>
            <button className="btn-ghost" onClick={copyWeekday} disabled={!draft.length}>Copiar a los demás {['domingos', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábados'][new Date(sel.slice(0, 4), sel.slice(5, 7) - 1, sel.slice(8, 10)).getDay()]} del mes</button>
          </div>
          {msg && <div className={msg.endsWith('✓') ? 'hint' : 'err'} style={{ marginTop: 8 }}>{msg}</div>}
        </div>
      )}
    </>
  )
}
