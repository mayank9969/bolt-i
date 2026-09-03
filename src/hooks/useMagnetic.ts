import { useCallback, useRef } from 'react'
import { useMotionValue, useSpring } from 'framer-motion'

/** Gentle magnetic pull toward the cursor for primary CTAs. */
export function useMagnetic<T extends HTMLElement = HTMLElement>(strength = 0.18) {
  const ref = useRef<T>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 220, damping: 18, mass: 0.4 })
  const sy = useSpring(y, { stiffness: 220, damping: 18, mass: 0.4 })

  const onMouseMove = useCallback(
    (e: React.MouseEvent<T>) => {
      const el = ref.current
      if (!el) return
      const r = el.getBoundingClientRect()
      x.set((e.clientX - r.left - r.width / 2) * strength)
      y.set((e.clientY - r.top - r.height / 2) * strength)
    },
    [strength, x, y],
  )
  const onMouseLeave = useCallback(() => {
    x.set(0)
    y.set(0)
  }, [x, y])

  return { ref, style: { x: sx, y: sy }, onMouseMove, onMouseLeave }
}
