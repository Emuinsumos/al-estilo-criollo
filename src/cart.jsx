import { createContext, useContext, useEffect, useMemo, useReducer, useState, useCallback } from 'react'
import { priceInfo } from './utils'

const Ctx = createContext(null)
const KEY = 'criollo-cart-v1'

function reducer(state, a) {
  switch (a.type) {
    case 'add': {
      const key = `${a.productId}:${a.vi}:${a.note || ''}`
      const found = state.find((i) => i.key === key)
      if (found) return state.map((i) => (i.key === key ? { ...i, qty: i.qty + a.qty } : i))
      return [...state, { key, productId: a.productId, vi: a.vi, qty: a.qty, note: a.note || '' }]
    }
    case 'qty':
      return state.map((i) => (i.key === a.key ? { ...i, qty: Math.max(1, i.qty + a.d) } : i))
    case 'remove':
      return state.filter((i) => i.key !== a.key)
    case 'clear':
      return []
    default:
      return state
  }
}

export function CartProvider({ products, children }) {
  const [items, dispatch] = useReducer(reducer, [], () => {
    try {
      return JSON.parse(localStorage.getItem(KEY) || '[]')
    } catch {
      return []
    }
  })
  const [open, setOpen] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(items))
    } catch {}
  }, [items])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 2200)
    return () => clearTimeout(t)
  }, [toast])

  // líneas "vivas": se recalculan con los precios actuales
  const lines = useMemo(() => {
    return items
      .map((i) => {
        const p = products.find((x) => x.id === i.productId)
        const v = p?.variants?.[i.vi]
        if (!p || !v || p.soldOut) return null
        const info = priceInfo(p, v)
        return { ...i, product: p, variant: v, info, subtotal: info.price * i.qty }
      })
      .filter(Boolean)
  }, [items, products])

  const total = lines.reduce((s, l) => s + l.subtotal, 0)
  const count = lines.reduce((s, l) => s + l.qty, 0)
  const notify = useCallback((m) => setToast(m), [])

  const value = { lines, total, count, open, setOpen, toast, notify, dispatch }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useCart = () => useContext(Ctx)
