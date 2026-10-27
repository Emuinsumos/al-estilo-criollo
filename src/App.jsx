import { useEffect, useState } from 'react'
import { useCategories, useProducts } from './hooks'
import { CartProvider, useCart } from './cart'
import { SettingsProvider } from './settings'
import Bot from './components/Bot'
import { IS_DEMO } from './store'
import Masthead from './components/Masthead'
import TopBar from './components/TopBar'
import Carousel from './components/Carousel'
import Catalog from './components/Catalog'
import CartDrawer from './components/CartDrawer'
import Footer from './components/Footer'
import Track from './components/Track'
import Reviews from './components/Reviews'
import Visit from './components/Visit'
import Admin from './components/Admin'

function Shop() {
  const { categories, loading: lc } = useCategories()
  const { products, loading: lp } = useProducts()
  const [query, setQuery] = useState('')
  const [picked, setPicked] = useState(null)
  const { toast } = useCart()
  const loading = lc || lp

  return (
    <>
      {IS_DEMO && <div className="demo-banner">Modo demo: faltan las claves de Firebase en src/config.js</div>}
      <Masthead />
      <TopBar query={query} setQuery={setQuery} />
      <main>
        <Carousel products={products} onPick={setPicked} loading={loading} />
        <Catalog
          categories={categories}
          products={products}
          loading={loading}
          query={query}
          picked={picked}
          setPicked={setPicked}
        />
        <Reviews />
        <Track />
        <Visit />
      </main>
      <Footer />
      <CartDrawer products={products} />
      <Bot />
      {toast && <div className="toast">{toast}</div>}
    </>
  )
}

export default function App() {
  const [hash, setHash] = useState(window.location.hash)
  const { products } = useProducts()
  useEffect(() => {
    const f = () => setHash(window.location.hash)
    window.addEventListener('hashchange', f)
    return () => window.removeEventListener('hashchange', f)
  }, [])

  return (
    <SettingsProvider>
      {hash === '#admin' ? (
        <Admin />
      ) : (
        <CartProvider products={products}>
          <Shop />
        </CartProvider>
      )}
    </SettingsProvider>
  )
}
