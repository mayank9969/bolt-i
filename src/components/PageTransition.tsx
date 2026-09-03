import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

const variants = {
  initial: { opacity: 0, y: 14 },
  enter: { opacity: 1, y: 0, transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] as const } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.22, ease: [0.4, 0, 1, 1] as const } },
}

export default function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div variants={variants} initial="initial" animate="enter" exit="exit" className="flex-1 flex flex-col">
      {children}
    </motion.div>
  )
}
