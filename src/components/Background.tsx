/**
 * Global ambient background — paper. The Living Knowledge Network carries all
 * depth, so this layer is only: canvas colour, a faint grain, and one warm
 * wash top-right where the key light "falls". All tokens; fixed; inert.
 */
export default function Background() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-canvas bg-noise" aria-hidden="true">
      <div
        className="absolute -top-32 right-[-10%] w-[62vw] h-[62vw] max-w-[900px] max-h-[900px] rounded-full blur-[140px]"
        style={{ background: 'radial-gradient(circle, var(--nx-deco-1) 0%, transparent 60%)' }}
      />
      <div
        className="absolute bottom-[-25%] left-[-15%] w-[50vw] h-[50vw] max-w-[700px] max-h-[700px] rounded-full blur-[140px] hidden md:block"
        style={{ background: 'radial-gradient(circle, var(--nx-deco-2) 0%, transparent 60%)' }}
      />
    </div>
  )
}
