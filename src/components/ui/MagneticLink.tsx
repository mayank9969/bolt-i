import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useMagnetic } from '@/hooks/useMagnetic'

const MotionLink = motion.create(Link)

export default function MagneticLink({
  to,
  children,
  className = '',
  strength = 0.16,
}: {
  to: string
  children: ReactNode
  className?: string
  strength?: number
}) {
  const m = useMagnetic<HTMLAnchorElement>(strength)
  return (
    <MotionLink to={to} ref={m.ref} style={m.style} onMouseMove={m.onMouseMove} onMouseLeave={m.onMouseLeave} className={className}>
      {children}
    </MotionLink>
  )
}
