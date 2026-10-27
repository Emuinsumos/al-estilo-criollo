import { createContext, useContext, useEffect, useMemo } from 'react'
import { useNode } from './hooks'
import { BRAND, WHATSAPP, SOCIALS, MAP_QUERY, GOOGLE_REVIEWS_URL, HOURS, SLOT_MINUTES, MIN_LEAD_MINUTES, DEFAULT_BOT_GREETING } from './config'
import { waPhone } from './utils'

const hoursToObj = (H) => {
  const o = {}
  for (let d = 0; d < 7; d++) o[d] = { open: !!H[d], from: H[d]?.[0] || '09:00', to: H[d]?.[1] || '20:00' }
  return o
}

export const DEFAULTS = {
  name: BRAND.name,
  tagline: BRAND.tagline,
  logo: '',
  phone: WHATSAPP.endsWith('00000000') ? '' : WHATSAPP,
  address: BRAND.address || '',
  mapQuery: MAP_QUERY,
  instagram: SOCIALS.instagram,
  facebook: SOCIALS.facebook,
  tiktok: SOCIALS.tiktok,
  reviewsUrl: GOOGLE_REVIEWS_URL,
  hours: hoursToObj(HOURS),
  slotMinutes: SLOT_MINUTES,
  leadMinutes: MIN_LEAD_MINUTES,
  botEnabled: true,
  botGreeting: DEFAULT_BOT_GREETING,
}

const Ctx = createContext(DEFAULTS)

export function SettingsProvider({ children }) {
  const raw = useNode('settings')
  const value = useMemo(() => {
    const r = raw || {}
    const m = { ...DEFAULTS }
    Object.keys(DEFAULTS).forEach((k) => {
      if (r[k] !== undefined && r[k] !== null) m[k] = r[k]
    })
    if (!String(m.name).trim()) m.name = DEFAULTS.name
    if (!String(m.tagline).trim()) m.tagline = DEFAULTS.tagline
    const hoursForm = {}
    const hours = {}
    for (let d = 0; d < 7; d++) {
      const h = { ...DEFAULTS.hours[d], ...(r.hours?.[d] || {}) }
      hoursForm[d] = h
      hours[d] = h.open ? [h.from, h.to] : null
    }
    return {
      ...m,
      hoursForm,
      hours,
      whatsapp: m.phone ? waPhone(m.phone) : '',
      raw: r,
      loaded: raw !== undefined,
    }
  }, [raw])

  useEffect(() => {
    document.title = `${value.name} | ${value.tagline}`
  }, [value.name, value.tagline])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useSettings = () => useContext(Ctx)
