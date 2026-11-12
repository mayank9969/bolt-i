import '@fontsource-variable/fraunces/wght.css'
import '@fontsource-variable/source-serif-4/wght.css'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useWorld } from '@/components/three/world'
import Reveal from '@/components/Reveal'
import { labelCategory } from '@/lib/format'
import { getLabTopics, type LabTopic } from '@/api/quizApi'
import { useQuiz } from '@/context/QuizContext'
import { launchSitting, mixedFive } from '@/lib/launchSitting'

const ease = [0.22, 1, 0.36, 1] as const

export default function Lab() {
  useWorld({ mode: 'quiet' })
  const navigate = useNavigate()
  const { beginSession } = useQuiz()
  const [busy, setBusy] = useState<string | null>(null)
  const [topics, setTopics] = useState<LabTopic[] | null>(null)
  const [note, setNote] = useState('')
  const [length, setLength] = useState<5 | 15>(5)

  useEffect(() => {
    getLabTopics()
      .then((pack) => {
        setTopics(pack.topics || [])
        if (pack.refreshes_at) setNote(`Next refresh ${pack.refreshes_at}`)
      })
      .catch((err: Error) => {
        setTopics([])
        setNote(err.message)
      })
  }, [])

  const open = async (category: string) => {
    setBusy(category)
    await launchSitting(
      { ...mixedFive(category), questionCount: length },
      beginSession,
      () => navigate('/quiz'),
      (config) => navigate('/setup', { state: config }),
    )
    setBusy(null)
  }

  return (
    <div className="relative z-10 max-w-page mx-auto px-5 sm:px-6 lg:px-8 pt-16 pb-24 md:pt-24 archive-ed">
      <Reveal>
        <p className="ed-eyebrow">Studio · topic lab</p>
        <h1 className="ed-display mt-4">Go ashore on today’s articles.</h1>
        <p className="ed-lede mt-5">
          Each subject draws a Wikipedia opening from the live engine. A sitting still scores from the question bank.
        </p>
        {note && <p className="t-meta text-fg-3 mt-3">{note}</p>}
        <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Sitting length">
          <button type="button" className={`btn-sm ${length === 5 ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setLength(5)}>
            Try five
          </button>
          <button type="button" className={`btn-sm ${length === 15 ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setLength(15)}>
            A longer sitting
          </button>
        </div>
      </Reveal>
      <ol className="studio-rail mt-10 ml-4 grid gap-1">
        {(topics ?? []).map((item, i) => (
          <motion.li
            key={item.category}
            className="studio-day border-b border-line py-6 flex flex-wrap items-start justify-between gap-4 pl-2"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.05 * i, ease }}
          >
            <div className="max-w-xl">
              <p className="eyebrow">{item.category_label || labelCategory(item.category)}</p>
              <p className="text-fg font-medium mt-1">{item.topic || 'No article loaded'}</p>
              <p className="t-meta text-fg-2 mt-1">{item.summary || item.error || 'Refresh when the connection is available.'}</p>
              {item.source_url && (
                <a className="t-meta text-fg underline underline-offset-4 mt-2 inline-block" href={item.source_url} target="_blank" rel="noreferrer">
                  Wikipedia source
                </a>
              )}
            </div>
            <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
              <button
                type="button"
                className="btn-primary btn-sm"
                disabled={busy === item.category}
                onClick={() => void open(item.category)}
              >
                {busy === item.category ? 'Opening…' : 'Open sitting'}
              </button>
            </motion.div>
          </motion.li>
        ))}
        {topics && topics.length === 0 && <li className="text-fg-3 py-6">No lab topics yet.</li>}
      </ol>
    </div>
  )
}
