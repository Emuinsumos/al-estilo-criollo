// Service worker: recibe los avisos push de pedidos nuevos y los muestra en el celular.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))

self.addEventListener('push', (e) => {
  let d = {}
  try { d = e.data.json() } catch {}
  e.waitUntil(
    self.registration.showNotification(d.title || '🛒 Nuevo pedido', {
      body: d.body || '',
      icon: '/favicon.png',
      badge: '/favicon.png',
      tag: d.tag || 'pedido',
      vibrate: [200, 100, 200],
      data: { url: d.url || '/#admin' },
    })
  )
})

self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  const url = (e.notification.data && e.notification.data.url) || '/#admin'
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ('focus' in c) {
          if ('navigate' in c) c.navigate(url)
          return c.focus()
        }
      }
      return self.clients.openWindow(url)
    })
  )
})
