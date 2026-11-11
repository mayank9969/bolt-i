import { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

/** Trailing ring on fine pointers. Native cursor stays. */
export default function CustomCursor() {
  const x = useMotionValue(-80)
  const y = useMotionValue(-80)
  const rx = useSpring(x, { stiffness: 280, damping: 28, mass: 0.35 })
  const ry = useSpring(y, { stiffness: 280, damping: 28, mass: 0.35 })
  const [hover, setHover] = useState<'off' | 'nav' | 'ui'>('off')
  const [visible, setVisible] = useState(false)
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    const fine = window.matchMedia('(pointer: fine)').matches
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!fine || reduce) return
    setEnabled(true)

    const hit = (t: EventTarget | null): 'off' | 'nav' | 'ui' => {
      const el = t as HTMLElement | null
      if (!el?.closest) return 'off'
      if (el.closest('header nav, .veyra-nav, header .btn-primary, header .btn-sm')) return 'nav'
      if (el.closest('a, button, input, textarea, [role="button"], [data-cursor], canvas, [data-veyra-act]')) return 'ui'
      return 'off'
    }
    const move = (e: PointerEvent | MouseEvent) => {
      x.set(e.clientX)
      y.set(e.clientY)
      setVisible(true)
      setHover(hit(e.target))
    }
    const leave = () => setVisible(false)
    const fromFrame = (e: MessageEvent) => {
      const d = e.data
      if (!d || d.type !== 'veyra-cursor') return
      const frames = Array.from(document.querySelectorAll('iframe'))
      const frame = frames.find((f) => f.contentWindow === e.source)
      if (!frame) return
      const r = frame.getBoundingClientRect()
      x.set(r.left + d.x)
      y.set(r.top + d.y)
      setVisible(true)
      setHover(d.hover ? 'ui' : 'off')
    }
    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('mousemove', move, { passive: true })
    window.addEventListener('message', fromFrame)
    document.documentElement.addEventListener('mouseleave', leave)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('mousemove', move)
      window.removeEventListener('message', fromFrame)
      document.documentElement.removeEventListener('mouseleave', leave)
    }
  }, [x, y])

  if (!enabled) return null

  return (
    <motion.div
      style={{ x: rx, y: ry }}
      className="pointer-events-none fixed left-0 top-0 z-[9999]"
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.12 }}
      aria-hidden="true"
    >
      <motion.div
        className="rounded-full -translate-x-1/2 -translate-y-1/2 border"
        style={{
          borderColor: 'var(--nx-accent, #16827e)',
          background: hover !== 'off' ? 'color-mix(in srgb, var(--nx-accent, #16827e) 14%, transparent)' : 'transparent',
        }}
        animate={{
          width: hover === 'nav' ? 28 : hover === 'ui' ? 52 : 32,
          height: hover === 'nav' ? 28 : hover === 'ui' ? 52 : 32,
          opacity: hover !== 'off' ? 1 : 0.88,
        }}
        transition={{ type: 'spring', stiffness: 220, damping: 22, mass: 0.4 }}
      />
    </motion.div>
  )
}
