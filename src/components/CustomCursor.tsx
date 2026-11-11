import { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

/** Replaces the OS pointer on fine mice with a teal arrow. Tip is the hotspot. */
export default function CustomCursor() {
  const x = useMotionValue(-80)
  const y = useMotionValue(-80)
  const sx = useSpring(x, { stiffness: 900, damping: 48, mass: 0.12 })
  const sy = useSpring(y, { stiffness: 900, damping: 48, mass: 0.12 })
  const [hover, setHover] = useState<'off' | 'nav' | 'ui'>('off')
  const [down, setDown] = useState(false)
  const [visible, setVisible] = useState(false)
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    const fine = window.matchMedia('(pointer: fine)').matches
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!fine || reduce) return
    setEnabled(true)
    const root = document.documentElement
    root.classList.add('veyra-pointer')

    const hit = (t: EventTarget | null): 'off' | 'nav' | 'ui' | 'text' => {
      const el = t as HTMLElement | null
      if (!el?.closest) return 'off'
      if (el.closest('input, textarea, select, [contenteditable="true"]')) return 'text'
      if (el.closest('header nav, .veyra-nav, header .btn-primary, header .btn-sm')) return 'nav'
      if (el.closest('a, button, [role="button"], [data-cursor], canvas, [data-veyra-act]')) return 'ui'
      return 'off'
    }
    const move = (e: PointerEvent | MouseEvent) => {
      x.set(e.clientX)
      y.set(e.clientY)
      const kind = hit(e.target)
      setVisible(kind !== 'text')
      setHover(kind === 'text' ? 'off' : kind)
    }
    const leave = () => setVisible(false)
    const press = () => setDown(true)
    const release = () => setDown(false)
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
    window.addEventListener('pointerdown', press)
    window.addEventListener('pointerup', release)
    window.addEventListener('message', fromFrame)
    root.addEventListener('mouseleave', leave)
    return () => {
      root.classList.remove('veyra-pointer')
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerdown', press)
      window.removeEventListener('pointerup', release)
      window.removeEventListener('message', fromFrame)
      root.removeEventListener('mouseleave', leave)
    }
  }, [x, y])

  if (!enabled) return null

  const accent = 'var(--nx-accent, #16827e)'
  const fill = hover === 'ui' ? accent : 'rgb(var(--nx-canvas-rgb))'
  const scale = down ? 0.86 : hover === 'nav' ? 0.78 : hover === 'ui' ? 1.06 : 1

  return (
    <motion.div
      style={{ x: sx, y: sy }}
      className="pointer-events-none fixed left-0 top-0 z-[9999]"
      animate={{ opacity: visible ? 1 : 0, scale }}
      transition={{ duration: 0.08, scale: { type: 'spring', stiffness: 500, damping: 32 } }}
      aria-hidden="true"
    >
      <svg
        width="22"
        height="24"
        viewBox="0 0 22 24"
        fill="none"
        className="block drop-shadow-[0_1px_1px_rgb(0_0_0_/_0.28)]"
      >
        <path
          d="M1.2 1.15 1.05 19.4l5.15-4.55 3.55 8.05 3.2-1.4-3.5-7.85h7.55L1.2 1.15Z"
          fill={fill}
          stroke={accent}
          strokeWidth="1.35"
          strokeLinejoin="round"
        />
      </svg>
    </motion.div>
  )
}
