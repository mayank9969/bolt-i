import '@fontsource-variable/fraunces/wght.css'
import '@fontsource-variable/source-serif-4/wght.css'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import prompts from '@/lib/opinionPrompts.json'
import { getTakePrompts, type TakePrompt } from '@/api/quizApi'
import { useWorld } from '@/components/three/world'
import Reveal from '@/components/Reveal'
import { useQuiz } from '@/context/QuizContext'
import { launchSitting, mixedFive } from '@/lib/launchSitting'

const KEY = 'veyra.todays-take'

const STARTERS = [
  "I hadn't noticed before…",
  'Zero is less an answer than…',
  "A question I'm taking with me:",
]

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
  const [live, setLive] = useState<TakePrompt | null>(null)
  useEffect(() => {
    getTakePrompts()
      .then((pack) => {
        const items = pack.prompts || []
        if (!items.length) return
        const ord = Math.floor(Date.now() / 86400000)
        setLive(items[ord % items.length] ?? items[0])
      })
      .catch(() => {})
  }, [])
  const prompt = useMemo(() => {
    if (live) return [live.topic, live.prompt] as [string, string]
    const ord = Math.floor(Date.now() / 86400000)
    return list[ord % list.length] ?? list[0]
  }, [list, live])
  const [entries, setEntries] = useState<Entry[]>(load)
  const [response, setResponse] = useState('')
  const today = entries.find((e) => e.day === day)
  const words = (today?.response ?? response).trim() ? (today?.response ?? response).trim().split(/\s+/).length : 0

  const save = () => {
    if (!response.trim() || !prompt) return
    const next: Entry = {
      day,
      topic: prompt[0],
      prompt: prompt[1],
      response: response.trim(),
      influence: '',
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
    <div className="relative z-10 max-w-page mx-auto px-5 sm:px-6 lg:px-8 pt-16 pb-24 md:pt-24 archive-ed">
      <Reveal>
        <p className="ed-eyebrow">A thought to keep, if you want to:</p>
        <h1 className="ed-display mt-4">Write a take.</h1>
        <p className="ed-lede mt-5">
          Unscored. Private to this browser. The quiz engine never marks it.
        </p>
      </Reveal>

      <div className="take-starters mt-8" role="group" aria-label="Opening lines">
        {STARTERS.map((s) => (
          <button
            key={s}
            type="button"
            className="take-chip"
            disabled={!!today}
            onClick={() => setResponse((r) => (r.trim() ? r : s + ' '))}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="take-sheet mt-4">
        {today ? (
          <div className="take-notebook take-notebook--done" aria-label="Today’s take">
            {today.response}
          </div>
        ) : (
          <textarea
            className="take-notebook"
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder={STARTERS[0]}
            aria-label="Your take"
          />
        )}
      </div>
      <p className="take-meta">
        <span className="num">{words} words</span>
        <span> · stays on this page</span>
      </p>

      {!today && (
        <button type="button" className="btn-primary mt-6" onClick={save} disabled={!response.trim()}>
          Stamp your mark
        </button>
      )}

      <h2 className="ed-display mt-16 text-[clamp(1.4rem,3vw,1.85rem)]">Past takes</h2>
      <ul className="mt-4 grid gap-4">
        {entries.map((e) => (
          <li key={e.day} className="take-past">
            <p className="t-meta">
              {e.day} · {e.topic}
            </p>
            <p className="text-fg mt-1">{e.prompt}</p>
            <p className="take-past-body mt-2">{e.response}</p>
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
