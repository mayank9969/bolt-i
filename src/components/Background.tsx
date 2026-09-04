/**
 * Global ambient background — deliberately quiet now that the NEXUS
 * lattice carries depth. Canvas + paper grain + a faint dot grid + one
 * warm light. All tokens; fixed; non-interactive.
 */
export default function Background() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-canvas bg-noise" aria-hidden="true">
      <div className="absolute inset-0 bg-grid" />
      <div
        className="absolute -top-40 right-[-12%] w-[720px] h-[720px] rounded-full blur-[160px] hidden sm:block"
        style={{ background: 'radial-gradient(circle, var(--nx-deco-1) 0%, transparent 62%)' }}
      />
      <div
        className="absolute bottom-[-20%] left-[-10%] w-[640px] h-[640px] rounded-full blur-[160px] hidden md:block"
        style={{ background: 'radial-gradient(circle, var(--nx-deco-2) 0%, transparent 62%)' }}
      />
    </div>
  )
}
