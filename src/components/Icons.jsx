import { FaInstagram, FaFacebookF, FaTiktok, FaWhatsapp } from 'react-icons/fa6'

const base = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }
export const Pin = () => (<svg {...base}><path d="M12 21s7-5.500 7-11a7 7 0 0 0-14 0c0 5.500 7 11 7 11z" /><circle cx="12" cy="10" r="2.500" /></svg>)
export const Gate = () => (<svg {...base}><path d="M3 4v16M21 4v16M3 8h18M3 13h18M3 18h18M3 18L21 8" /></svg>)

const sz = { size: 22 }
export const Instagram = () => <FaInstagram {...sz} />
export const Facebook = () => <FaFacebookF {...sz} />
export const TikTok = () => <FaTiktok {...sz} />
export const WhatsApp = () => <FaWhatsapp {...sz} />
