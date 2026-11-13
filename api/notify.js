// Función serverless (Vercel): cuando entra un pedido, manda un aviso push a los celulares activados.
// Necesita las variables de entorno VAPID_PUBLIC_KEY y VAPID_PRIVATE_KEY (opcional: VAPID_SUBJECT).
import webpush from 'web-push'

const DB = 'https://chino-a425c-default-rtdb.firebaseio.com'
const PREFIX = 'criollo'
const MAX_AGE_MS = 2 * 60 * 1000 // solo se avisa de pedidos recién hechos
const seen = new Map() // evita avisar dos veces el mismo pedido (mientras la función siga "caliente")

const money = (n) => '$' + Math.round(Number(n) || 0).toLocaleString('es-AR')
const getJson = async (path) => {
  const r = await fetch(`${DB}/${PREFIX}/${path}.json`)
  return r.ok ? r.json() : null
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' })
  const pub = process.env.VAPID_PUBLIC_KEY
  const priv = process.env.VAPID_PRIVATE_KEY
  if (!pub || !priv) return res.status(500).json({ error: 'faltan las claves VAPID en Vercel' })

  let body = req.body
  if (typeof body === 'string') { try { body = JSON.parse(body) } catch { body = {} } }
  const code = String((body && body.code) || '')
  if (!/^[A-Za-z0-9-]{3,16}$/.test(code)) return res.status(400).json({ error: 'código inválido' })

  // el pedido tiene que existir de verdad y ser reciente
  const order = await getJson(`track/${code}`)
  if (!order || !order.createdAt || Date.now() - Number(order.createdAt) > MAX_AGE_MS) return res.status(200).json({ sent: 0, reason: 'no encontrado o viejo' })
  if (seen.has(code)) return res.status(200).json({ sent: 0, reason: 'ya avisado' })
  seen.set(code, Date.now())
  for (const [k, t] of seen) if (Date.now() - t > 10 * 60 * 1000) seen.delete(k)

  const subs = Object.values((await getJson('push')) || {}).map((x) => x && x.sub).filter((s) => s && s.endpoint)
  if (!subs.length) return res.status(200).json({ sent: 0, reason: 'sin dispositivos' })

  webpush.setVapidDetails(process.env.VAPID_SUBJECT || `https://${req.headers.host || 'localhost'}`, pub, priv)
  const payload = JSON.stringify({
    title: '🛒 Nuevo pedido',
    body: `${code} · ${order.type === 'delivery' ? 'Envío' : 'Retiro'} · ${money(order.total)}`,
    tag: `pedido-${code}`,
    url: '/#admin',
  })
  const results = await Promise.allSettled(subs.map((s) => webpush.sendNotification(s, payload, { TTL: 3600, urgency: 'high' })))
  res.status(200).json({ sent: results.filter((r) => r.status === 'fulfilled').length, total: subs.length })
}
