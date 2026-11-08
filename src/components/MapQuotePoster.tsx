/** Dark typographic quote — same series as the About epigraph. */
export default function MapQuotePoster() {
  return (
    <section className="quote-band map-quote-band" aria-label="The map is not a verdict">
      <svg className="map-quote-map" viewBox="0 0 800 280" preserveAspectRatio="xMidYMax meet" aria-hidden="true" focusable="false">
        <g className="map-quote-grid">
          {Array.from({ length: 12 }, (_, i) => (
            <line key={`v${i}`} x1={40 + i * 64} y1="20" x2={80 + i * 58} y2="280" />
          ))}
          {Array.from({ length: 6 }, (_, i) => (
            <line key={`h${i}`} x1="0" y1={40 + i * 40} x2="800" y2={55 + i * 38} />
          ))}
        </g>
        <path className="map-quote-route" d="M40 250 C180 230 220 200 310 170 S480 140 560 90 S680 40 760 28" />
        <circle className="map-quote-mark" cx="760" cy="28" r="6" />
      </svg>
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
  )
}
