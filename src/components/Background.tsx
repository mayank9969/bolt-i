/**
 * Global ambient background — the sky the archipelago floats in.
 * Luminous, soft, near-white in Paper (warm light from the top, a teal haze at
 * the horizon, a breath of terracotta low-left); deep blue-charcoal with a cool
 * moonlit lift in Ink. All tokens; fixed; inert. The islands carry the depth.
 */
export default function Background() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-canvas bg-noise" aria-hidden="true">
      {/* sunlight from above */}
      <div
        className="absolute inset-x-0 -top-[20vh] h-[70vh]"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 60% 0%, var(--nx-deco-2) 0%, transparent 70%)' }}
      />
      {/* teal haze where the sea would be */}
      <div
        className="absolute inset-x-0 bottom-0 h-[55vh]"
        style={{ background: 'radial-gradient(ellipse 90% 70% at 50% 110%, var(--nx-deco-1) 0%, transparent 70%)' }}
      />
      {/* one warm note, low left */}
      <div
        className="absolute bottom-[-10%] left-[-10%] w-[46vw] h-[46vw] max-w-[640px] max-h-[640px] rounded-full blur-[120px] hidden md:block"
        style={{ background: 'radial-gradient(circle, var(--nx-deco-3) 0%, transparent 60%)' }}
      />
    </div>
  )
}
