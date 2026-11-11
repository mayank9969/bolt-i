import FilmPlayer from '@/about-film/FilmPlayer'

/** Quote, then a gap, then the film, then a gap, then the rest. */
export default function MapQuotePoster() {
  return (
    <div className="map-quote-stack" style={{ background: '#080808' }}>
      <section className="map-quote-band map-quote-band--top" aria-label="The map is not a verdict">
        <blockquote className="map-quote-copy">
          <p className="map-quote-hed">The map is not a verdict.</p>
          <p className="map-quote-body">
            You are more than the turn you wish you could take back. Keep what it taught you; let go of the shame that
            keeps you there.
          </p>
        </blockquote>
      </section>
      <div aria-hidden="true" style={{ height: '6.5rem', background: '#080808' }} />
      <section className="quote-film-band" aria-label="Quote film" style={{ background: '#080808', padding: '0 1.25rem' }}>
        <div className="quote-film">
          <FilmPlayer />
        </div>
      </section>
      <div aria-hidden="true" style={{ height: '4rem', background: '#080808' }} />
    </div>
  )
}
