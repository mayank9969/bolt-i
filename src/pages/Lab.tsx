import '@fontsource-variable/fraunces/wght.css'
import '@fontsource-variable/source-serif-4/wght.css'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useWorld } from '@/components/three/world'
import Reveal from '@/components/Reveal'
import { labelCategory } from '@/lib/format'
import { getCategories } from '@/api/quizApi'
import { useQuiz } from '@/context/QuizContext'
import { launchSitting, mixedFive } from '@/lib/launchSitting'

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
  const navigate = useNavigate()
  const { beginSession } = useQuiz()
  const [busy, setBusy] = useState<number | null>(null)
  const [ids, setIds] = useState<string[] | null>(null)

  useEffect(() => {
    getCategories()
      .then((c) => setIds(c.categories.map((x) => x.id)))
      .catch(() => setIds([]))
  }, [])

  const open = async (day: number, category: string) => {
    setBusy(day)
    const cfg = mixedFive(category)
    await launchSitting(
      cfg,
      beginSession,
      () => navigate('/quiz'),
      (config) => navigate('/setup', { state: config }),
    )
    setBusy(null)
  }

  return (
    <div className="relative z-10 max-w-page mx-auto px-5 sm:px-6 lg:px-8 pt-16 pb-24 md:pt-24 archive-ed">
      <Reveal>
        <p className="ed-eyebrow">Studio · four-day lab</p>
        <h1 className="ed-display mt-4">Four short sittings.</h1>
        <p className="ed-lede mt-5">
          Each day starts five mixed questions from the live bank. Day {today} is marked for today.
        </p>
      </Reveal>
      <ol className="studio-rail mt-10 ml-4 grid gap-1">
        {DAYS.map((d, i) => {
          const known = !ids || ids.includes(d.category)
          return (
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
                <p className="eyebrow">
                  Day {d.day}
                  {d.day === today ? ' · today' : ''}
                </p>
                <p className="text-fg font-medium mt-1">{labelCategory(d.category)}</p>
                <p className="t-meta text-fg-2 mt-1">{d.note}</p>
              </div>
              <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                <button
                  type="button"
                  className="btn-primary btn-sm"
                  disabled={!known || busy === d.day}
                  onClick={() => void open(d.day, d.category)}
                >
                  {busy === d.day ? 'Opening…' : 'Open sitting'}
                </button>
              </motion.div>
            </motion.li>
          )
        })}
      </ol>
    </div>
  )
}
