import { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

/** Subtle trailing ring on fine-pointer devices. Native cursor stays visible. */
export default function CustomCursor() {
  const x = useMotionValue(-100)
  const y = useMotionValue(-100)
  const rx = useSpring(x, { stiffness: 380, damping: 30, mass: 0.4 })
  const ry = useSpring(y, { stiffness: 380, damping: 30, mass: 0.4 })
  const [hover, setHover] = useState(false)
  const [visible, setVisible] = useState(false)
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    const fine = window.matchMedia('(pointer: fine)').matches
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!fine || reduce) return
    setEnabled(true)

    const move = (e: MouseEvent) => {
      x.set(e.clientX)
      y.set(e.clientY)
      if (!visible) setVisible(true)
      const t = e.target as HTMLElement | null
      setHover(!!t?.closest('a, button, input, textarea, [role="button"], [data-cursor]'))
    }
    const leave = () => setVisible(false)
    window.addEventListener('mousemove', move, { passive: true })
    document.documentElement.addEventListener('mouseleave', leave)
    return () => {
      window.removeEventListener('mousemove', move)
      document.documentElement.removeEventListener('mouseleave', leave)
    }
  }, [x, y, visible])

  if (!enabled) return null

  return (
    <motion.div
      style={{ x: rx, y: ry }}
      className="pointer-events-none fixed left-0 top-0 z-[9999]"
      animate={{ opacity: visible ? 1 : 0 }}
      aria-hidden="true"
    >
      <motion.div
        className={`rounded-full border -translate-x-1/2 -translate-y-1/2 transition-colors duration-200 ${
          hover ? 'border-accent bg-accent/10' : 'border-line-strong bg-transparent'
        }`}
        animate={{ width: hover ? 40 : 26, height: hover ? 40 : 26 }}
        transition={{ type: 'spring', stiffness: 420, damping: 28 }}
      />
    </motion.div>
  )
}
