// Nombre en dos tonos, como el logo: todo en crema y la última palabra en rojo.
export default function BrandName({ name, stacked = false }) {
  const words = String(name || '').trim().split(/\s+/)
  const last = words.pop()
  return (
    <span className={`brand-slab ${stacked ? 'stacked' : ''}`}>
      {words.length > 0 && <span className="l1">{words.join(' ')} </span>}
      <span className="acc">{last}</span>
    </span>
  )
}
