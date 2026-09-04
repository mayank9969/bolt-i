import { useEffect, useRef } from 'react'

/**
 * Global ambient background.
 * One tinted canvas, a fading grid, a cold field top-left, one warm
 * light top-right and a cursor-reactive light. All colours are tokens,
 * everything is fixed, non-interactive and sits behind the UI.
 * Density is intentionally lower on small screens.
 */
export default function Background() {
  const lightRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let raf = 0
    let tx = window.innerWidth / 2
    let ty = window.innerHeight / 3
    let cx = tx
    let cy = ty

    const onMove = (e: MouseEvent) => {
      tx = e.clientX
      ty = e.clientY
    }
    const tick = () => {
      cx += (tx - cx) * 0.06
      cy += (ty - cy) * 0.06
      if (lightRef.current) {
        lightRef.current.style.transform = `translate3d(${cx - 300}px, ${cy - 300}px, 0)`
      }
      raf = requestAnimationFrame(tick)
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    raf = requestAnimationFrame(tick)
    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-canvas bg-noise" aria-hidden="true">
      {/* cold field — gives the canvas its depth */}
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 30% -10%, var(--nx-deco-2), transparent 70%)' }}
      />
      {/* grid */}
      <div className="absolute inset-0 bg-grid" />
      {/* one warm light, off-centre — the ember */}
      <div
        className="absolute -top-32 right-[-10%] w-[640px] h-[640px] rounded-full blur-[140px] animate-drift hidden sm:block"
        style={{ background: 'radial-gradient(circle, var(--nx-deco-1) 0%, transparent 62%)' }}
      />
      {/* cursor light */}
      <div
        ref={lightRef}
        className="absolute top-0 left-0 w-[600px] h-[600px] rounded-full blur-[120px] hidden md:block will-change-transform"
        style={{ background: 'radial-gradient(circle, var(--nx-deco-1) 0%, transparent 60%)', opacity: 0.5 }}
      />
      {/* bottom vignette */}
      <div className="absolute inset-x-0 bottom-0 h-64" style={{ background: 'linear-gradient(to top, var(--nx-canvas), transparent)' }} />
    </div>
  )
}
