import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useWorld } from '@/components/three/world'
import Reveal from '@/components/Reveal'
import { labelCategory } from '@/lib/format'

const DAYS = [
  { day: 1, category: 'maths', note: 'Balance and slope — short set.' },
  { day: 2, category: 'python', note: 'Syntax as a craft.' },
  { day: 3, category: 'science', note: 'Observe, then name.' },
  { day: 4, category: 'history', note: 'Cause, then consequence.' },
]

const ease = [0.22, 1, 0.36, 1] as const

export default function Lab() {
  useWorld({ mode: 'quiet' })
  const today = (Math.floor(Date.now() / 86400000) % 4) + 1

  return (
    <div className="relative z-10 max-w-page mx-auto px-5 sm:px-6 lg:px-8 pt-16 pb-24 md:pt-24">
      <Reveal>
        <p className="figcap inline-flex items-center gap-3">
          <span className="w-8 h-px bg-line-strong" />
          Studio · four-day lab
        </p>
        <h1 className="t-hero text-fg mt-6">Four short sittings.</h1>
        <p className="t-lead text-fg-2 mt-5 max-w-lg">
          A four-day loop. Each day opens the live quiz on that island — five questions, mixed difficulty. Day {today}{' '}
          is marked for today.
        </p>
      </Reveal>
      <ol className="studio-rail mt-10 ml-4 grid gap-1">
        {DAYS.map((d, i) => (
          <motion.li
            key={d.day}
            className={`studio-day border-b border-line py-6 flex flex-wrap items-center justify-between gap-4 pl-2 ${
              d.day === today ? 'is-today' : ''
            }`}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.08 * i, ease }}
          >
            <div>
              <p className="eyebrow">Day {d.day}{d.day === today ? ' · today' : ''}</p>
              <p className="text-fg font-medium mt-1">{labelCategory(d.category)}</p>
              <p className="t-meta text-fg-2 mt-1">{d.note}</p>
            </div>
            <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
              <Link
                to="/setup"
                state={{ category: d.category, difficulty: 'mixed', questionCount: 5 }}
                className="btn-primary btn-sm"
              >
                Open sitting
              </Link>
            </motion.div>
          </motion.li>
        ))}
      </ol>
    </div>
  )
}
