import FilmPlayer from '@/about-film/FilmPlayer'

export default function MapQuotePoster() {
  return (
    <div className="map-quote-stack">
      <section className="map-quote-band map-quote-band--top" hidden aria-hidden="true">
        <blockquote className="map-quote-copy">
          <p className="map-quote-hed">The map is not a verdict.</p>
          <p className="map-quote-body">
            You are more than the turn you wish you could take back. Keep what it taught you; let go of the shame that
            keeps you there.
          </p>
        </blockquote>
      </section>
      <section className="quote-film-band" aria-label="Quote film">
        <div className="quote-film">
          <FilmPlayer />
        </div>
      </section>
      <section className="map-quote-band map-quote-band--foot" hidden aria-hidden="true">
        <blockquote className="map-quote-copy">
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
