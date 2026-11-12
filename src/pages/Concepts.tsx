import '@fontsource-variable/fraunces/wght.css'
import '@fontsource-variable/source-serif-4/wght.css'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import library from '@/lib/conceptLibrary.json'
import { useWorld } from '@/components/three/world'
import Reveal from '@/components/Reveal'
import { labelCategory } from '@/lib/format'
import { useQuiz } from '@/context/QuizContext'
import { launchSitting, mixedFive } from '@/lib/launchSitting'
import { getLabTopics, type LabTopic } from '@/api/quizApi'

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
  const [topics, setTopics] = useState<LabTopic[]>([])
  const [note, setNote] = useState('')
  const [cat, setCat] = useState('maths')
  const [picked, setPicked] = useState<number | null>(null)

  useEffect(() => {
    getLabTopics()
      .then((pack) => {
        const list = pack.topics || []
        setTopics(list)
        if (pack.refreshes_at) setNote(`Next refresh ${pack.refreshes_at}`)
        if (list[0]?.category) setCat(list[0].category)
      })
      .catch((err: Error) => setNote(err.message))
  }, [])

  const article = topics.find((t) => t.category === cat) ?? topics[0]
  const lesson = useMemo(() => {
    const list = LIB[cat] ?? []
    if (!list.length) return null
    const ord = Math.floor(Date.now() / 86400000)
    return list[ord % list.length]
  }, [cat])

  const chips = topics.length ? topics.map((t) => t.category) : Object.keys(LIB)

  return (
    <div className="relative z-10 max-w-page mx-auto px-5 sm:px-8 lg:px-12 pt-16 pb-24 md:pt-24 archive-ed">
      <Reveal>
        <p className="ed-eyebrow">Studio · concepts</p>
        <h1 className="ed-display mt-4">A thread from the live page.</h1>
        <p className="ed-lede mt-5">
          Same daily Wikipedia openings as the Lab — then a short walkthrough if we have one for that island.
        </p>
        {note && <p className="t-meta text-fg-3 mt-3">{note}</p>}
      </Reveal>
      <div className="mt-8 flex flex-wrap gap-2">
        {chips.map((id) => (
          <button
            key={id}
            type="button"
            className="island-chip"
            style={cat === id ? { borderColor: 'var(--nx-accent)', color: 'var(--nx-text)' } : undefined}
            onClick={() => {
              setCat(id)
              setPicked(null)
            }}
          >
            {labelCategory(id)}
          </button>
        ))}
      </div>

      {article && (
        <article className="mt-10 pt-8 border-t border-line">
          <p className="eyebrow">{article.category_label || labelCategory(article.category)}</p>
          <h2 className="t-title text-fg mt-2">{article.topic || 'No article loaded'}</h2>
          <p className="text-fg-2 mt-4 text-pretty">{article.summary || article.error || 'Waiting on Wikipedia.'}</p>
          {article.source_url && (
            <a className="t-meta underline underline-offset-4 mt-3 inline-block" href={article.source_url} target="_blank" rel="noreferrer">
              Wikipedia source
            </a>
          )}
        </article>
      )}

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
            <p className="eyebrow">Walkthrough</p>
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
                <motion.p className="mt-4 text-fg-2" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                  {picked === lesson.check.answer ? 'Yes. ' : 'Not that one. '}
                  {lesson.check.why}
                </motion.p>
              )}
            </div>
          </motion.article>
        </AnimatePresence>
      )}

      <button
        type="button"
        className="btn-primary mt-8"
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
  )
}
