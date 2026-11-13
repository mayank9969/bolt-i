import { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

/** Replaces the OS pointer on fine mice with a sharp teal arrow. Tip is the hotspot. */
export default function CustomCursor() {
  const x = useMotionValue(-80)
  const y = useMotionValue(-80)
  /* Softer spring: smooth trailing follow, no jitter or overshoot. */
  const sx = useSpring(x, { stiffness: 380, damping: 32, mass: 0.45 })
  const sy = useSpring(y, { stiffness: 380, damping: 32, mass: 0.45 })
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
  const isUi = hover === 'ui'
  const fill = isUi ? accent : 'rgb(var(--nx-canvas-rgb))'
  const scale = down ? 0.86 : hover === 'nav' ? 0.78 : isUi ? 1.18 : 1

  return (
    <motion.div
      style={{ x: sx, y: sy }}
      className="pointer-events-none fixed left-0 top-0 z-[9999]"
      animate={{ opacity: visible ? 1 : 0, scale }}
      transition={{
        duration: 0.16,
        ease: 'easeOut',
        scale: { type: 'spring', stiffness: 320, damping: 22 },
      }}
      aria-hidden="true"
    >
      <svg
        width="26"
        height="28"
        viewBox="0 0 26 28"
        fill="none"
        shapeRendering="geometricPrecision"
        className="block"
        style={{
          filter: isUi
            ? 'drop-shadow(0 0 6px rgb(22 130 126 / 0.85)) drop-shadow(0 1px 1px rgb(0 0 0 / 0.3))'
            : 'drop-shadow(0 1px 1px rgb(0 0 0 / 0.28))',
        }}
      >
        <path
          d="M2 1.4 1.7 22.6l6.1-5.3 4.2 9.4 3.8-1.7-4.1-9.2h8.9L2 1.4Z"
          fill={fill}
          stroke={accent}
          strokeWidth="1.6"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* Shine streak — only on clickable hover */}
        {isUi && (
          <path
            d="M4.2 3.2 3.9 18.8l4.6-4"
            stroke="rgba(255,255,255,0.9)"
            strokeWidth="1.4"
            strokeLinecap="round"
            fill="none"
          />
        )}
      </svg>
    </motion.div>
  )
}
