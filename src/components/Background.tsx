import { useEffect, useRef } from 'react'

/**
 * Global ambient background: deep navy base, perspective grid,
 * two slow-drifting glow fields and a cursor-reactive light.
 * Everything is fixed, non-interactive and sits behind the UI.
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
    <div className="fixed inset-0 -z-10 overflow-hidden bg-ink-975 bg-noise" aria-hidden="true">
      {/* base gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(28,37,64,0.9),transparent_70%)]" />
      {/* grid */}
      <div className="absolute inset-0 bg-grid" />
      {/* glow fields */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full blur-[140px] opacity-[0.16] animate-drift bg-[radial-gradient(circle,#2cc4f5_0%,transparent_65%)]" />
      <div className="absolute top-[40%] -right-40 w-[600px] h-[600px] rounded-full blur-[160px] opacity-[0.08] animate-drift-slow bg-[radial-gradient(circle,#5ddcff_0%,transparent_65%)]" />
      <div className="absolute -bottom-60 -left-40 w-[700px] h-[700px] rounded-full blur-[160px] opacity-[0.07] bg-[radial-gradient(circle,#0aa3d4_0%,transparent_65%)]" />
      {/* cursor light */}
      <div
        ref={lightRef}
        className="absolute top-0 left-0 w-[600px] h-[600px] rounded-full opacity-[0.07] blur-[120px] hidden md:block will-change-transform bg-[radial-gradient(circle,#5ddcff_0%,transparent_60%)]"
      />
      {/* bottom vignette */}
      <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-ink-975 to-transparent" />
    </div>
  )
}
