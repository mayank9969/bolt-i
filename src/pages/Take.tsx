import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import prompts from '@/lib/opinionPrompts.json'
import { useWorld } from '@/components/three/world'
import Reveal from '@/components/Reveal'
import { useQuiz } from '@/context/QuizContext'
import { launchSitting, mixedFive } from '@/lib/launchSitting'

const KEY = 'veyra.todays-take'

type Entry = { day: string; topic: string; prompt: string; response: string; influence: string }

function load(): Entry[] {
  try {
    const raw = localStorage.getItem(KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export default function Take() {
  useWorld({ mode: 'quiet' })
  const navigate = useNavigate()
  const { beginSession } = useQuiz()
  const [starting, setStarting] = useState(false)
  const list = prompts as [string, string][]
  const day = new Date().toISOString().slice(0, 10)
  const prompt = useMemo(() => {
    const ord = Math.floor(Date.now() / 86400000)
    return list[ord % list.length] ?? list[0]
  }, [list])
  const [entries, setEntries] = useState<Entry[]>(load)
  const [response, setResponse] = useState('')
  const [influence, setInfluence] = useState('')
  const today = entries.find((e) => e.day === day)

  const save = () => {
    if (!response.trim() || !prompt) return
    const next: Entry = {
      day,
      topic: prompt[0],
      prompt: prompt[1],
      response: response.trim(),
      influence: influence.trim(),
    }
    const rest = entries.filter((e) => e.day !== day)
    const all = [next, ...rest]
    setEntries(all)
    try {
      localStorage.setItem(KEY, JSON.stringify(all))
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="relative z-10 max-w-page mx-auto px-5 sm:px-6 lg:px-8 pt-16 pb-24 md:pt-24">
      <Reveal>
        <p className="figcap inline-flex items-center gap-3">
          <span className="w-8 h-px bg-line-strong" />
          Studio · today’s take
        </p>
        <h1 className="t-hero text-fg mt-6">Write a view.</h1>
        <p className="t-lead text-fg-2 mt-5 max-w-lg">
          Subjective and unscored. A private line in this browser — the quiz engine never marks it. Gemini reflection from the desktop tool is not connected here.
        </p>
      </Reveal>
      {prompt && (
        <motion.section
          className="studio-ink-card mt-8 rounded-2xl border border-line bg-card p-6"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="eyebrow">{prompt[0]}</p>
          <p className="text-fg mt-2 text-pretty">{prompt[1]}</p>
          {today ? (
            <p className="mt-6 text-fg-2 whitespace-pre-wrap">{today.response}</p>
          ) : (
            <>
              <textarea
                className="mt-6 w-full min-h-[8rem] rounded-xl border border-line bg-canvas p-3"
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder="Your response"
              />
              <textarea
                className="mt-3 w-full min-h-[4rem] rounded-xl border border-line bg-canvas p-3"
                value={influence}
                onChange={(e) => setInfluence(e.target.value)}
                placeholder="What influenced this view? (optional)"
              />
              <button type="button" className="btn-primary mt-4" onClick={save}>
                Save today’s take
              </button>
            </>
          )}
        </motion.section>
      )}
      <h2 className="t-title text-fg mt-12">Past takes</h2>
      <ul className="mt-4 grid gap-4">
        {entries.map((e) => (
          <li key={e.day} className="border-b border-line pb-4">
            <p className="t-meta">
              {e.day} · {e.topic}
            </p>
            <p className="text-fg mt-1">{e.prompt}</p>
            <p className="text-fg-2 mt-2 whitespace-pre-wrap">{e.response}</p>
          </li>
        ))}
        {entries.length === 0 && <li className="text-fg-3">None yet.</li>}
      </ul>
      <button
        type="button"
        className="btn-secondary mt-10"
        disabled={starting}
        onClick={async () => {
          setStarting(true)
          await launchSitting(
            mixedFive('all'),
            beginSession,
            () => navigate('/quiz'),
            (config) => navigate('/setup', { state: config }),
          )
          setStarting(false)
        }}
      >
        {starting ? 'Opening…' : 'Scored sitting instead'}
      </button>
    </div>
  )
}
