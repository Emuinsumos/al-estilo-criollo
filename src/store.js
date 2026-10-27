// Capa de datos: Firebase Realtime Database, o MODO DEMO (localStorage) si no hay config.
import { initializeApp } from 'firebase/app'
import { getDatabase, ref, onValue, set as fbSet, remove as fbRemove } from 'firebase/database'
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, updatePassword } from 'firebase/auth'
import { FIREBASE_CONFIG, DB_PREFIX, ADMIN, AUTH_DOMAIN } from './config'
import { uid } from './utils'

export const IS_DEMO = !FIREBASE_CONFIG.databaseURL || FIREBASE_CONFIG.databaseURL.includes('PEGAR')

const clean = (v) => (v === undefined ? null : JSON.parse(JSON.stringify(v)))

let db = null
let auth = null
export const HAS_AUTH_KEY = !IS_DEMO && !!FIREBASE_CONFIG.apiKey && !String(FIREBASE_CONFIG.apiKey).includes('PEGAR')
if (!IS_DEMO) {
  const app = initializeApp(FIREBASE_CONFIG)
  db = getDatabase(app)
  if (HAS_AUTH_KEY) auth = getAuth(app)
}

// ---------- modo demo ----------
const LS_KEY = 'criollo-demo-v1'
const listeners = new Map()
let mem = null
const loadMem = () => {
  if (mem) return mem
  try {
    mem = JSON.parse(localStorage.getItem(LS_KEY) || 'null')
  } catch {}
  if (!mem) mem = seed()
  return mem
}
const saveMem = () => {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(mem))
  } catch {}
}
const getPath = (path) => {
  let cur = loadMem()
  for (const k of path.split('/').filter(Boolean)) {
    if (cur == null) return null
    cur = cur[k]
  }
  return cur === undefined ? null : cur
}
const setPath = (path, val) => {
  const keys = path.split('/').filter(Boolean)
  let cur = loadMem()
  keys.slice(0, -1).forEach((k) => {
    if (cur[k] == null || typeof cur[k] !== 'object') cur[k] = {}
    cur = cur[k]
  })
  if (val === null) delete cur[keys[keys.length - 1]]
  else cur[keys[keys.length - 1]] = val
  saveMem()
  listeners.forEach((set, p) => set.forEach((cb) => cb(getPath(p))))
}

function placeholder(label, c1, c2) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs><rect width="800" height="600" fill="url(#g)"/><text x="400" y="320" font-family="Georgia,serif" font-size="54" font-style="italic" fill="rgba(255,235,200,.55)" text-anchor="middle">${label}</text></svg>`
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg)
}
function seed() {
  const c = { c1: { name: 'Vacuno', order: 1 }, c2: { name: 'Cerdo', order: 2 }, c3: { name: 'Pollo', order: 3 }, c4: { name: 'Achuras', order: 4 } }
  const p = (id, name, cat, desc, variants, extra = {}) => ({
    id, name, categoryId: cat, description: desc, variants, offer: false, soldOut: false,
    image: placeholder(name, '#5a0f12', '#1a0c0a'), createdAt: Date.now(), ...extra,
  })
  const list = [
    p('p1', 'Asado de Tira Premium', 'c1', 'Corte ancho, madurado, ideal para parrilla.', [{ label: '1 kg', price: 11000, offerPrice: 9500 }, { label: '2 kg', price: 21000, offerPrice: 18000 }], { offer: true }),
    p('p2', 'Bife de Chorizo', 'c1', 'Jugoso y tierno. Corte grueso.', [{ label: '1 kg', price: 15500 }, { label: '2 kg', price: 30000 }]),
    p('p3', 'Vacío', 'c1', 'Clásico argentino, cocción lenta.', [{ label: '1 kg', price: 12900, offerPrice: 11200 }], { offer: true }),
    p('p4', 'Ojo de Bife', 'c1', 'El corte más noble.', [{ label: '1 kg', price: 17800 }]),
    p('p5', 'Bondiola de Cerdo', 'c2', 'Ideal para horno o parrilla.', [{ label: '1 kg', price: 8900 }, { label: '2 kg', price: 17000 }]),
    p('p6', 'Matambrito de Cerdo', 'c2', 'Tierno y de rápida cocción.', [{ label: '1 kg', price: 9800, offerPrice: 8400 }], { offer: true }),
    p('p7', 'Pechuga de Pollo', 'c3', 'Fresca, sin hueso.', [{ label: '1 kg', price: 6200 }, { label: '3 kg', price: 17500 }]),
    p('p8', 'Chorizo Parrillero', 'c4', 'Receta tradicional, por unidad.', [{ label: '4 unidades', price: 4800 }, { label: '8 unidades', price: 9200 }]),
  ]
  const products = {}
  list.forEach((x) => (products[x.id] = x))
  return { [DB_PREFIX]: { categories: c, products, orders: {} } }
}

// ---------- API ----------
const full = (path) => `${DB_PREFIX}/${path}`

export function subscribe(path, cb) {
  const p = full(path)
  if (IS_DEMO) {
    if (!listeners.has(p)) listeners.set(p, new Set())
    listeners.get(p).add(cb)
    cb(getPath(p))
    return () => listeners.get(p)?.delete(cb)
  }
  return onValue(ref(db, p), (snap) => cb(snap.val()), () => cb(null))
}

export function setValue(path, val) {
  const p = full(path)
  if (IS_DEMO) return Promise.resolve(setPath(p, clean(val)))
  return fbSet(ref(db, p), clean(val))
}

export function removeValue(path) {
  const p = full(path)
  if (IS_DEMO) return Promise.resolve(setPath(p, null))
  return fbRemove(ref(db, p))
}

export const newId = uid

// ---------- sesión del panel ----------
const DEMO_SESSION = 'criollo-demo-admin'
const authListeners = new Set()
const demoUser = () => (sessionStorage.getItem(DEMO_SESSION) === '1' ? { username: ADMIN.user } : null)

// cb(user): undefined = cargando, null = sin sesión, {username} = adentro
export function authSubscribe(cb) {
  if (IS_DEMO) {
    authListeners.add(cb)
    cb(demoUser())
    return () => authListeners.delete(cb)
  }
  if (!auth) { cb(null); return () => {} }
  return onAuthStateChanged(auth, (u) => cb(u ? { username: String(u.email || '').split('@')[0] } : null))
}

export async function loginUser(username, password) {
  const name = String(username).trim().toLowerCase()
  if (IS_DEMO) {
    if (name === ADMIN.user && password === ADMIN.pass) {
      sessionStorage.setItem(DEMO_SESSION, '1')
      authListeners.forEach((f) => f(demoUser()))
      return
    }
    throw new Error('Usuario o contraseña incorrectos')
  }
  if (!auth) throw new Error('Falta la apiKey de Firebase en src/config.js')
  try {
    await signInWithEmailAndPassword(auth, `${name}@${AUTH_DOMAIN}`, password)
  } catch (e) {
    if (e.code === 'auth/too-many-requests') throw new Error('Demasiados intentos. Esperá unos minutos y probá de nuevo.')
    if (e.code === 'auth/network-request-failed') throw new Error('Sin conexión. Revisá tu internet.')
    throw new Error('Usuario o contraseña incorrectos')
  }
}

export async function logoutUser() {
  if (IS_DEMO) {
    sessionStorage.removeItem(DEMO_SESSION)
    authListeners.forEach((f) => f(null))
    return
  }
  if (auth) await signOut(auth)
}

export async function changeMyPassword(newPass) {
  if (IS_DEMO) throw new Error('En modo demo no se puede cambiar la contraseña.')
  if (!auth?.currentUser) throw new Error('No hay sesión iniciada.')
  try {
    await updatePassword(auth.currentUser, newPass)
  } catch (e) {
    if (e.code === 'auth/requires-recent-login') throw new Error('Por seguridad, salí del panel, volvé a entrar y probá de nuevo.')
    if (e.code === 'auth/weak-password') throw new Error('La contraseña es muy corta (mínimo 6 caracteres).')
    throw new Error('No se pudo cambiar la contraseña.')
  }
}
