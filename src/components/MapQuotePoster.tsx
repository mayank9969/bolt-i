import FilmPlayer from '@/about-film/FilmPlayer'

export default function MapQuotePoster() {
  return (
    <div className="map-quote-stack">
      <section className="quote-film-band field-film-plate" aria-label="The film">
        <div className="quote-film">
          <p className="field-film-label">Film + Sound</p>
          <FilmPlayer />
        </div>
      </section>
      <section className="quote-band map-quote-band map-quote-band--foot" aria-label="Map quote">
        <blockquote className="map-quote-copy">
          <p className="map-quote-hed">The map is not a verdict.</p>
          <p className="map-quote-body">
            You are more than the turn you wish you could take back. Keep what it taught you; let go of the shame that
            keeps you there.
          </p>
          <p className="map-quote-body map-quote-split">Yesterday cannot be redrawn, but</p>
          <p className="map-quote-mark-line">the next mark is still yours to make.</p>
          <p className="map-quote-body">
            Begin where you are—small, honest, unfinished. The future does not ask you to be flawless. It asks only that
            you begin.
          </p>
          <p className="map-quote-ready">And when you’re ready,</p>
          <p className="map-quote-forgive">forgive yourself.</p>
        </blockquote>
      </section>
    </div>
  )
}
