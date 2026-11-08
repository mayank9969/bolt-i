/** Quiet 4:5 editorial quote at the end of About. */
export default function MapQuotePoster() {
  return (
    <figure className="map-quote" aria-label="The map is not a verdict">
      <svg className="map-quote-map" viewBox="0 0 400 500" aria-hidden="true" focusable="false">
        <path
          className="map-quote-contour"
          d="M20 80 C80 60 140 110 200 90 S320 40 380 70 M10 160 C90 140 150 200 230 170 S340 130 400 155 M0 240 C70 220 160 270 250 245 S350 210 400 230 M30 320 C110 300 180 360 270 335 S360 300 400 320 M50 400 C130 380 200 430 290 410 S370 380 400 395"
        />
        <path className="map-quote-route" d="M72 430 C140 360 180 300 210 250 S268 160 318 118" />
        <circle className="map-quote-mark" cx="318" cy="118" r="5.5" />
      </svg>
      <blockquote>
        <p className="map-quote-hed">The map is not a verdict.</p>
        <p className="map-quote-body">
          You are more than the turn you wish you could take back. Keep what it taught you; let go of the shame that
          keeps you there. Yesterday cannot be redrawn, but the next mark is still yours to make. Begin where you
          are—small, honest, unfinished. The future does not ask you to be flawless. It asks only that you begin.
        </p>
        <p className="map-quote-end">And when you’re ready, forgive yourself.</p>
      </blockquote>
    </figure>
  )
}
