import { useEffect, useState } from 'react'
import { useNode } from '../hooks'
import { fmtDate, money } from '../utils'

const STEPS = [
  { k: 'pending', t: 'Recibido', d: 'Estamos preparando tu pedido.' },
  { k: 'completed', t: 'Listo para retirar', d: 'Pasá por el local con tu código.' },
]

export default function Track() {
  const [input, setInput] = useState(() => {
    try { return localStorage.getItem('criollo-last-code') || '' } catch { return '' }
  })
  const [code, setCode] = useState(input)
  const data = useNode(code ? `track/${code}` : 'track/_none')

  useEffect(() => {
    const f = (e) => { setInput(e.detail); setCode(e.detail) }
    window.addEventListener('criollo-track', f)
    return () => window.removeEventListener('criollo-track', f)
  }, [])

  const search = (e) => {
    e.preventDefault()
    let c = input.trim().toUpperCase().replace(/\s/g, '')
    if (c && !c.includes('-')) c = c.replace(/^([A-Z]{2})/, '$1-')
    setInput(c)
    setCode(c)
  }

  return (
    <section className="container track" id="seguimiento">
      <div className="section-kicker">Seguí tu pedido</div>
      <form className="track-form" onSubmit={search}>
        <input className="inp" placeholder="Tu código (ej: EC-7K4M)" value={input} onChange={(e) => setInput(e.target.value.toUpperCase())} maxLength={10} aria-label="Código de pedido" />
        <button className="btn-red" type="submit" style={{ width: 'auto', padding: '12px 26px' }}>Consultar</button>
      </form>
      {code && data === null && <p className="track-msg">No encontramos ese código. Revisalo e intentá de nuevo.</p>}
      {code && data && (
        <div className="track-card">
          <div className="head">
            <div>
              <div className="code">{data.code}</div>
              <div className="meta">Hola {data.firstName} · Retiro: {fmtDate(data.pickupDate)} {data.pickupTime} hs aprox. · {money(data.total)}</div>
            </div>
          </div>
          {data.status === 'cancelled' ? (
            <p className="track-msg" style={{ color: '#ff9b9b' }}>Este pedido fue cancelado. Escribinos por WhatsApp si tenés dudas.</p>
          ) : (
            <ol className="steps">
              {STEPS.map((s, i) => {
                const done = data.status === 'completed' || i === 0
                const current = (data.status === 'pending' && i === 0) || (data.status === 'completed' && i === 1)
                return (
                  <li key={s.k} className={`${done ? 'done' : ''} ${current ? 'current' : ''}`}>
                    <span className="dot">{done ? '✓' : i + 1}</span>
                    <div><b>{s.t}</b><span>{s.d}</span></div>
                  </li>
                )
              })}
            </ol>
          )}
        </div>
      )}
    </section>
  )
}
