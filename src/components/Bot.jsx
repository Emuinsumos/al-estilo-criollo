import { useEffect, useRef, useState } from 'react'
import { useBotItems } from '../hooks'
import { useSettings } from '../settings'
import { DEFAULT_BOT } from '../config'
import { norm, fmtRanges } from '../utils'

const NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

export default function Bot() {
  const s = useSettings()
  const { items, isDefault, loading } = useBotItems()
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState([])
  const [text, setText] = useState('')
  const end = useRef(null)
  const faq = isDefault ? DEFAULT_BOT : items

  const fill = (t) => {
    const hrs = [1, 2, 3, 4, 5, 6, 0].map((d) => `${NAMES[d]}: ${s.hours[d] ? fmtRanges(s.hours[d]) : 'cerrado'}`).join('\n')
    return t
      .replaceAll('{horarios}', hrs)
      .replaceAll('{direccion}', s.address || s.mapQuery || 'nuestro local')
      .replaceAll('{telefono}', s.phone || 'WhatsApp')
      .replaceAll('{nombre}', s.name)
  }

  useEffect(() => {
    if (open && !msgs.length) setMsgs([{ from: 'bot', t: fill(s.botGreeting) }])
    // eslint-disable-next-line
  }, [open])
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [msgs])

  if (loading || !s.botEnabled || !faq.length) return null

  const ask = (q, a) => {
    setMsgs((m) => [...m, { from: 'me', t: q }])
    setTimeout(() => setMsgs((m) => [...m, { from: 'bot', t: fill(a) }]), 350)
  }
  const free = (e) => {
    e.preventDefault()
    const q = text.trim()
    if (!q) return
    setText('')
    const words = norm(q).split(/\W+/).filter((w) => w.length > 2)
    let best = null
    let score = 0
    faq.forEach((f) => {
      const hq = norm(f.q)
      const ha = norm(f.a)
      const sc = words.reduce((n, w) => n + (hq.includes(w) ? 2 : 0) + (ha.includes(w) ? 1 : 0), 0)
      if (sc > score) { score = sc; best = f }
    })
    if (best) ask(q, best.a)
    else ask(q, 'No encontré una respuesta para eso. Escribinos por WhatsApp y te contestamos enseguida.')
  }

  return (
    <>
      {!open && (
        <button className="bot-fab" onClick={() => setOpen(true)} aria-label="Abrir asistente">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a8 8 0 0 1-11.800 7L4 20l1.200-4.200A8 8 0 1 1 21 12z" /><path d="M9 11h6M9 14h4" /></svg>
          <span>¿Dudas?</span>
        </button>
      )}
      {open && (
        <div className="bot-panel" role="dialog" aria-label="Asistente">
          <header>
            <div><b>{s.name}</b><small>Respuestas rápidas</small></div>
            <button className="x-btn" style={{ position: 'static' }} onClick={() => setOpen(false)} aria-label="Cerrar">×</button>
          </header>
          <div className="bot-msgs">
            {msgs.map((m, i) => <div key={i} className={`bm ${m.from}`}>{m.t}</div>)}
            <div className="bot-chips">
              {faq.map((f, i) => <button key={i} onClick={() => ask(f.q, f.a)}>{f.q}</button>)}
            </div>
            {s.whatsapp && (
              <a className="btn-wa" style={{ marginTop: 8, padding: 10, fontSize: 14 }} href={`https://wa.me/${s.whatsapp}`} target="_blank" rel="noreferrer">Hablar por WhatsApp</a>
            )}
            <div ref={end} />
          </div>
          <form onSubmit={free}>
            <input placeholder="Escribí tu consulta…" value={text} onChange={(e) => setText(e.target.value)} />
            <button type="submit" aria-label="Enviar">➤</button>
          </form>
        </div>
      )}
    </>
  )
}
