import { useReviews } from '../hooks'
import { useSettings } from '../settings'

const Stars = ({ n }) => <span className="stars" aria-label={`${n} estrellas`}>{'★'.repeat(n)}<i>{'★'.repeat(5 - n)}</i></span>

export default function Reviews() {
  const GOOGLE_REVIEWS_URL = useSettings().reviewsUrl
  const { reviews } = useReviews()
  const list = reviews.filter((r) => r.visible !== false)
  if (!list.length && !GOOGLE_REVIEWS_URL) return null
  const avg = list.length ? list.reduce((s, r) => s + r.stars, 0) / list.length : 0

  return (
    <section className="container reviews">
      <div className="section-kicker">Lo que dicen nuestros clientes</div>
      {list.length > 0 && (
        <div className="rev-sum">
          <b>{avg.toFixed(1).replace('.', ',')}</b> <Stars n={Math.round(avg)} /> <span>· {list.length} reseña{list.length > 1 ? 's' : ''}</span>
        </div>
      )}
      <div className="rev-grid">
        {list.map((r) => (
          <figure className="rev" key={r.id}>
            <Stars n={r.stars} />
            <blockquote>“{r.text}”</blockquote>
            <figcaption>{r.name}</figcaption>
          </figure>
        ))}
      </div>
      {GOOGLE_REVIEWS_URL && (
        <div style={{ textAlign: 'center', marginTop: 22 }}>
          <a className="btn-gold" style={{ textDecoration: 'none', display: 'inline-block' }} href={GOOGLE_REVIEWS_URL} target="_blank" rel="noreferrer">Dejanos tu reseña en Google</a>
        </div>
      )}
    </section>
  )
}
