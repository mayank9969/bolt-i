import { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

/** Fine-pointer companion. Native OS cursor stays. */
export default function CustomCursor() {
  const x = useMotionValue(-80)
  const y = useMotionValue(-80)
  const hx = useSpring(x, { stiffness: 420, damping: 32, mass: 0.22 })
  const hy = useSpring(y, { stiffness: 420, damping: 32, mass: 0.22 })
  const tx = useSpring(x, { stiffness: 140, damping: 22, mass: 0.55 })
  const ty = useSpring(y, { stiffness: 140, damping: 22, mass: 0.55 })
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

  const accent = 'var(--nx-accent, #16827e)'
  const nav = hover === 'nav'
  const ui = hover === 'ui'

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999]" aria-hidden="true" style={{ opacity: visible ? 1 : 0, transition: 'opacity 120ms' }}>
      {/* delayed diamond — not a hoop */}
      <motion.div
        style={{ x: tx, y: ty, color: accent }}
        className="absolute left-0 top-0"
      >
        <motion.div
          className="-translate-x-1/2 -translate-y-1/2"
          animate={{
            width: nav ? 14 : ui ? 30 : 22,
            height: nav ? 14 : ui ? 30 : 22,
            rotate: ui ? 45 : 12,
            opacity: nav ? 0.55 : 0.9,
          }}
          transition={{ type: 'spring', stiffness: 260, damping: 24, mass: 0.35 }}
        >
          <svg viewBox="0 0 32 32" className="h-full w-full overflow-visible" fill="none">
            <rect
              x="5.5"
              y="5.5"
              width="21"
              height="21"
              rx="5.2"
              stroke="currentColor"
              strokeWidth="1.35"
            />
          </svg>
        </motion.div>
      </motion.div>

      {/* tight nib on the pointer */}
      <motion.div style={{ x: hx, y: hy, color: accent }} className="absolute left-0 top-0">
        <motion.div
          className="-translate-x-1/2 -translate-y-1/2"
          animate={{
            width: nav ? 5 : ui ? 8 : 6,
            height: nav ? 5 : ui ? 8 : 6,
            rotate: ui ? 45 : 18,
            borderRadius: ui ? 2 : 2.5,
          }}
          style={{ background: accent }}
          transition={{ type: 'spring', stiffness: 380, damping: 26 }}
        />
      </motion.div>
    </div>
  )
}
