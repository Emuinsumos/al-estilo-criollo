// ============================================================
//  CONFIGURACIÓN — Al Estilo Criollo
//  Todo lo que se cambia a mano está acá.
// ============================================================

export const BRAND = {
  name: 'Al Estilo Criollo',
  tagline: 'Carnes Premium',
  address: '', // ej: 'Av. Siempre Viva 123, San Martín'
}

// WhatsApp del local (recibe los pedidos). Formato internacional, sin + ni espacios.
// Argentina celular: 549 + código de área sin 0 + número sin 15. Ej: 5491155554444
export const WHATSAPP = '5491100000000'

// Acceso al panel de administración (se entra desde el pie de página o con /#admin)
export const ADMIN = { user: 'admin', pass: 'criollo2026' }

// Firebase Realtime Database (proyecto chino-a425c, datos bajo el prefijo "criollo/").
// Si databaseURL está vacío o dice "PEGAR", la web funciona en MODO DEMO.
export const FIREBASE_CONFIG = {
  databaseURL: 'https://chino-a425c-default-rtdb.firebaseio.com',
  projectId: 'chino-a425c',
}

// Todo se guarda bajo este prefijo, así no se mezcla con otros proyectos.
export const DB_PREFIX = 'criollo'

// Horarios de retiro. 0 = domingo ... 6 = sábado. null = cerrado.
export const HOURS = {
  0: null,
  1: ['09:00', '20:00'],
  2: ['09:00', '20:00'],
  3: ['09:00', '20:00'],
  4: ['09:00', '20:00'],
  5: ['09:00', '20:00'],
  6: ['09:00', '14:00'],
}
export const SLOT_MINUTES = 30 // cada cuánto se ofrece un horario de retiro
export const MIN_LEAD_MINUTES = 60 // anticipación mínima para retirar hoy
export const DAYS_AHEAD = 7 // cuántos días hacia adelante se puede pedir

export const CODE_PREFIX = 'EC'
export const SLIDE_SECONDS = 7

// ---------- Redes sociales (dejá vacío lo que no uses; solo se muestran las que tengan link) ----------
export const SOCIALS = {
  instagram: '', // ej: 'https://instagram.com/alestilocriollo'
  facebook: '',  // ej: 'https://facebook.com/alestilocriollo'
  tiktok: '',    // ej: 'https://tiktok.com/@alestilocriollo'
}

// ---------- Mapa ----------
// Dirección tal cual la buscarías en Google Maps. Si queda vacía, no se muestra el mapa.
export const MAP_QUERY = '' // ej: 'Al Estilo Criollo, Av. Libertador 1234, San Martín, Buenos Aires'

// ---------- Reseñas de Google ----------
// Link para que el cliente deje/vea reseñas: Google Maps > tu negocio > "Escribir una reseña" > Compartir.
export const GOOGLE_REVIEWS_URL = ''

// ---------- Preguntas frecuentes por defecto del bot (el cliente las edita desde el panel) ----------
// Se pueden usar: {nombre} {horarios} {direccion} {telefono}
export const DEFAULT_BOT = [
  { q: '¿Cuáles son los horarios?', a: 'Atendemos en estos horarios:\n{horarios}' },
  { q: '¿Dónde están?', a: 'Nos encontrás en {direccion}.' },
  { q: '¿Cómo hago un pedido?', a: 'Elegí tus productos, tocá "Mi pedido", completá tus datos y el horario de retiro. Te damos un código para retirar.' },
  { q: '¿Cómo pago?', a: 'El pago se hace al retirar en el local.' },
  { q: '¿El precio final puede variar?', a: 'Los productos por peso pueden variar levemente. El importe final se confirma al pesar en el local.' },
]
export const DEFAULT_BOT_GREETING = '¡Hola! Soy el asistente de {nombre}. ¿En qué te ayudo?'
