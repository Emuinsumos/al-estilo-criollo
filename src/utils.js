import { DAYS_AHEAD, CODE_PREFIX } from './config'

export const money = (n) => '$' + Math.round(Number(n) || 0).toLocaleString('es-AR')

export const norm = (s) =>
  String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7)

// Información de precio de una variedad (maneja oferta semanal)
export function priceInfo(product, variant) {
  const base = Number(variant?.price) || 0
  const off = Number(variant?.offerPrice) || 0
  const isOffer = !!product?.offer && off > 0 && off < base
  return {
    price: isOffer ? off : base,
    regular: base,
    isOffer,
    pct: isOffer ? Math.round((1 - off / base) * 100) : 0,
  }
}

export function productSummary(product) {
  const infos = (product.variants || []).map((v) => priceInfo(product, v))
  if (!infos.length) return { price: 0, regular: 0, isOffer: false, pct: 0, multiple: false }
  const best = infos.reduce((a, b) => (b.price < a.price ? b : a))
  const maxPct = Math.max(...infos.map((i) => i.pct))
  return { ...best, pct: maxPct, isOffer: infos.some((i) => i.isOffer), multiple: infos.length > 1 }
}

export function makeCode() {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
  let s = ''
  for (let i = 0; i < 4; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return `${CODE_PREFIX}-${s}`
}

const pad = (n) => String(n).padStart(2, '0')
export const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const toMin = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}
const fromMin = (m) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`

export function slotsFor(dateStr, HOURS, SLOT_MINUTES = 30, MIN_LEAD_MINUTES = 60) {
  if (!dateStr) return []
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const h = HOURS?.[date.getDay()]
  if (!h) return []
  const out = []
  for (let t = toMin(h[0]); t <= toMin(h[1]); t += SLOT_MINUTES) out.push(fromMin(t))
  const now = new Date()
  if (ymd(now) === dateStr) {
    const limit = now.getHours() * 60 + now.getMinutes() + MIN_LEAD_MINUTES
    return out.filter((s) => toMin(s) >= limit)
  }
  return out
}

export function openDates(HOURS, SLOT_MINUTES, MIN_LEAD_MINUTES) {
  const out = []
  const base = new Date()
  for (let i = 0; i <= DAYS_AHEAD; i++) {
    const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + i)
    const s = ymd(d)
    if (slotsFor(s, HOURS, SLOT_MINUTES, MIN_LEAD_MINUTES).length) out.push(s)
  }
  return out
}

const DAYS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']
export function fmtDate(dateStr) {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  return `${DAYS[dt.getDay()]} ${pad(d)}/${pad(m)}`
}
export function fmtDateTime(ts) {
  const d = new Date(ts)
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// Teléfono argentino -> formato wa.me (549 + área + número)
export function waPhone(raw) {
  let p = String(raw || '').replace(/\D/g, '')
  if (p.startsWith('00')) p = p.slice(2)
  if (p.startsWith('54')) {
    if (!p.startsWith('549')) p = '549' + p.slice(2)
    return p
  }
  p = p.replace(/^0+/, '')
  if (p.startsWith('9') && p.length > 10) p = p.slice(1)
  return '549' + p
}

export const waLink = (phone, text) =>
  `https://wa.me/${phone}?text=${encodeURIComponent(text)}`

export function orderMessage(o, brand = 'Al Estilo Criollo') {
  const lines = o.items.map((i) => {
    const note = i.note ? ` _(${i.note})_` : ''
    return `• ${i.qty} × ${i.name} — ${i.variant} (${money(i.price)} c/u) = ${money(i.price * i.qty)}${note}`
  })
  return [
    `🥩 *NUEVO PEDIDO — ${brand}*`,
    `Código: *${o.code}*`,
    ``,
    `👤 ${o.name} ${o.lastName}`,
    `📞 ${o.phone}`,
    `🕒 Retira: ${fmtDate(o.pickupDate)} a las ${o.pickupTime} hs aprox.`,
    ``,
    ...lines,
    ``,
    `*Total estimado: ${money(o.total)}*`,
    `_(El importe final se confirma al pesar)_`,
  ].join('\n')
}

export function readyMessage(o, brand = 'Al Estilo Criollo') {
  return `Hola ${o.name}! 🥩 Tu pedido *${o.code}* de ${brand} ya está preparado. Podés pasar a retirarlo en cualquier momento con tu código de compra: *${o.code}*. ¡Gracias por elegirnos!`
}

export function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const play = (f, t) => {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.frequency.value = f
      o.connect(g)
      g.connect(ctx.destination)
      g.gain.setValueAtTime(0.15, ctx.currentTime + t)
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + 0.25)
      o.start(ctx.currentTime + t)
      o.stop(ctx.currentTime + t + 0.26)
    }
    play(880, 0)
    play(1175, 0.2)
  } catch {}
}
