import { useEffect, useMemo, useState } from 'react'
import { subscribe } from './store'

export function useNode(path) {
  const [val, setVal] = useState(undefined)
  useEffect(() => subscribe(path, (v) => setVal(v ?? null)), [path])
  return val // undefined = cargando, null = vacío
}

const toList = (obj) => Object.entries(obj || {}).map(([id, v]) => ({ ...v, id }))

export function useCategories() {
  const raw = useNode('categories')
  const list = useMemo(() => toList(raw).sort((a, b) => (a.order || 0) - (b.order || 0)), [raw])
  return { categories: list, loading: raw === undefined }
}

export function useProducts() {
  const raw = useNode('products')
  const list = useMemo(() => toList(raw).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)), [raw])
  return { products: list, loading: raw === undefined }
}

export function useOrders() {
  const raw = useNode('orders')
  const list = useMemo(() => toList(raw).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)), [raw])
  return { orders: list, loading: raw === undefined }
}

export function useReviews() {
  const raw = useNode('reviews')
  const list = useMemo(() => toList(raw).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)), [raw])
  return { reviews: list, loading: raw === undefined }
}

export function useBotItems() {
  const raw = useNode('botItems')
  const list = useMemo(() => toList(raw).filter((x) => x.q && x.a).sort((a, b) => (a.order || 0) - (b.order || 0)), [raw])
  return { items: list, isDefault: raw === null, loading: raw === undefined }
}
