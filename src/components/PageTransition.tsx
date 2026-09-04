import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

const variants = {
  initial: { opacity: 0, y: 18, filter: 'blur(4px)' },
  enter: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const } },
  exit: { opacity: 0, y: -10, filter: 'blur(3px)', transition: { duration: 0.26, ease: [0.4, 0, 1, 1] as const } },
}

export default function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div variants={variants} initial="initial" animate="enter" exit="exit" className="flex-1 flex flex-col">
      {children}
    </motion.div>
  )
}
