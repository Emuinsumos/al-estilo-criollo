import { VAPID_PUBLIC } from './config'
import { setValue, removeValue } from './store'

const b64ToBytes = (s) => {
  const pad = '='.repeat((4 - (s.length % 4)) % 4)
  const raw = atob((s + pad).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(raw, (c) => c.charCodeAt(0))
}

// id estable por dispositivo (así volver a activar no duplica)
async function subId(endpoint) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(endpoint))
  return Array.from(new Uint8Array(buf)).slice(0, 10).map((b) => b.toString(16).padStart(2, '0')).join('')
}

export const pushSupported = () =>
  typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

// 'unsupported' | 'denied' | 'on' | 'off'
export async function pushState() {
  if (!pushSupported()) return 'unsupported'
  if (Notification.permission === 'denied') return 'denied'
  try {
    const reg = await navigator.serviceWorker.getRegistration('/sw.js')
    const sub = reg && (await reg.pushManager.getSubscription())
    return sub && Notification.permission === 'granted' ? 'on' : 'off'
  } catch {
    return 'off'
  }
}

// Pide permiso, suscribe este celular y guarda la suscripción en Firebase (solo el admin logueado puede escribir).
export async function enablePush() {
  if (!pushSupported()) throw new Error('Este navegador no soporta avisos.')
  const perm = await Notification.requestPermission()
  if (perm !== 'granted') throw new Error('denied')
  const reg = await navigator.serviceWorker.register('/sw.js')
  await navigator.serviceWorker.ready
  let sub = await reg.pushManager.getSubscription()
  if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(VAPID_PUBLIC) })
  const id = await subId(sub.endpoint)
  await setValue(`push/${id}`, { sub: sub.toJSON(), ua: navigator.userAgent.slice(0, 90), createdAt: Date.now() })
  await reg.showNotification('🔔 Avisos activados', { body: 'Te vamos a avisar cuando entre un pedido.', icon: '/favicon.png', tag: 'avisos-ok' })
}

export async function disablePush() {
  const reg = await navigator.serviceWorker.getRegistration('/sw.js')
  const sub = reg && (await reg.pushManager.getSubscription())
  if (!sub) return
  const id = await subId(sub.endpoint)
  await sub.unsubscribe()
  try { await removeValue(`push/${id}`) } catch {}
}

// Avisa al servidor que entró un pedido (no bloquea ni rompe el pedido si falla).
export function notifyOrder(code) {
  try {
    fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
      keepalive: true,
    }).catch(() => {})
  } catch {}
}
