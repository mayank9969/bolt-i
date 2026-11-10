import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import library from '@/lib/conceptLibrary.json'
import { useWorld } from '@/components/three/world'
import Reveal from '@/components/Reveal'
import { labelCategory } from '@/lib/format'
import { useQuiz } from '@/context/QuizContext'
import { launchSitting, mixedFive } from '@/lib/launchSitting'

type Lesson = {
  id: string
  title: string
  analogy: string
  idea: string
  example: string
  visual: string
  check: { prompt: string; choices: string[]; answer: number; why: string }
}

const LIB = library as Record<string, Lesson[]>

export default function Concepts() {
  useWorld({ mode: 'quiet' })
  const navigate = useNavigate()
  const { beginSession } = useQuiz()
  const [starting, setStarting] = useState(false)
  const cats = Object.keys(LIB)
  const [cat, setCat] = useState(cats[0] ?? 'maths')
  const daily = useMemo(() => {
    const list = LIB[cat] ?? []
    if (!list.length) return null
    const ord = Math.floor(Date.now() / 86400000)
    return list[ord % list.length]
  }, [cat])
  const [open, setOpen] = useState<Lesson | null>(null)
  const lesson = open ?? daily
  const [picked, setPicked] = useState<number | null>(null)

  return (
    <div className="relative z-10 max-w-page mx-auto px-5 sm:px-6 lg:px-8 pt-16 pb-24 md:pt-24">
      <Reveal>
        <p className="figcap inline-flex items-center gap-3">
          <span className="w-8 h-px bg-line-strong" />
          Studio · concepts
        </p>
        <h1 className="t-hero text-fg mt-6">Lessons that rotate.</h1>
        <p className="t-lead text-fg-2 mt-5 max-w-lg">
          Curated ideas from newest.py. Today’s pick changes with the date; browse the library to revisit earlier ones.
        </p>
      </Reveal>
      <div className="mt-8 flex flex-wrap gap-2">
        {cats.map((id) => (
          <button
            key={id}
            type="button"
            className="island-chip"
            style={cat === id ? { borderColor: 'var(--nx-accent)', color: 'var(--nx-text)' } : undefined}
            onClick={() => {
              setCat(id)
              setOpen(null)
              setPicked(null)
            }}
          >
            {labelCategory(id)}
          </button>
        ))}
      </div>
      {lesson && (
        <AnimatePresence mode="wait">
          <motion.article
            key={lesson.id}
            className="studio-ink-card mt-10 pt-8 border-t border-line"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
          <p className="eyebrow">{open ? 'Library' : 'Today’s pick'}</p>
          <h2 className="t-title text-fg mt-2">{lesson.title}</h2>
          <p className="text-fg-2 mt-4 text-pretty">{lesson.analogy}</p>
          <p className="text-fg mt-4 text-pretty">{lesson.idea}</p>
          <p className="t-meta text-fg-2 mt-4">{lesson.example}</p>
          <div className="mt-8 pt-6 border-t border-line">
            <p className="font-medium text-fg">{lesson.check.prompt}</p>
            <div className="mt-3 flex flex-col gap-2">
              {lesson.check.choices.map((c, i) => (
                <button
                  key={c}
                  type="button"
                  className="studio-choice text-left rounded-xl border border-line px-4 py-3 hover:border-line-strong"
                  onClick={() => setPicked(i)}
                >
                  {c}
                </button>
              ))}
            </div>
            {picked !== null && (
              <motion.p
                className="mt-4 text-fg-2"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {picked === lesson.check.answer ? 'Yes. ' : 'Not that one. '}
                {lesson.check.why}
              </motion.p>
            )}
            <button
              type="button"
              className="btn-primary mt-6"
              disabled={starting}
              onClick={async () => {
                setStarting(true)
                await launchSitting(
                  mixedFive(cat),
                  beginSession,
                  () => navigate('/quiz'),
                  (config) => navigate('/setup', { state: config }),
                )
                setStarting(false)
              }}
            >
              {starting ? 'Opening…' : 'Sit five on this island'}
            </button>
          </div>
          </motion.article>
        </AnimatePresence>
      )}
      <ul className="mt-8 grid gap-2">
        {(LIB[cat] ?? []).map((l) => (
          <li key={l.id}>
            <button type="button" className="link-rule text-sm" onClick={() => { setOpen(l); setPicked(null) }}>
              {l.title}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
