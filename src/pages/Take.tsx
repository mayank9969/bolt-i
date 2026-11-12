import '@fontsource-variable/fraunces/wght.css'
import '@fontsource-variable/source-serif-4/wght.css'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import prompts from '@/lib/opinionPrompts.json'
import {
  askTakeGuidance,
  getLabTopics,
  getTakePrompts,
  type LabTopic,
  type TakeGuidance,
  type TakePrompt,
} from '@/api/quizApi'
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
  const [article, setArticle] = useState<LabTopic | null>(null)
  const [askErr, setAskErr] = useState('')
  const [guide, setGuide] = useState<TakeGuidance | null>(null)
  const [asking, setAsking] = useState(false)

  useEffect(() => {
    getTakePrompts()
      .then((pack) => {
        const items = pack.prompts || []
        if (!items.length) {
          if (pack.error) setAskErr(pack.error)
          return
        }
        const ord = Math.floor(Date.now() / 86400000)
        setLive(items[ord % items.length] ?? items[0])
      })
      .catch((err: Error) => setAskErr(err.message))
    getLabTopics()
      .then((pack) => {
        const withTopic = (pack.topics || []).find((t) => t.topic)
        setArticle(withTopic ?? pack.topics?.[0] ?? null)
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
  const draft = today?.response ?? response
  const words = draft.trim() ? draft.trim().split(/\s+/).length : 0

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

  const askGuide = async () => {
    const text = draft.trim()
    if (text.length < 8) return
    setAsking(true)
    setGuide(null)
    try {
      const g = await askTakeGuidance({
        response: text,
        topic: prompt[0],
        prompt_text: prompt[1],
        prompt_type: live?.prompt_type,
        reflection_hint: live?.reflection_hint,
      })
      setGuide(g)
    } catch (err) {
      setGuide({
        guidance: true,
        scored: false,
        next_step: err instanceof Error ? err.message : 'Guidance is unavailable right now.',
      })
    }
    setAsking(false)
  }

  return (
    <div className="relative z-10 max-w-page mx-auto px-5 sm:px-6 lg:px-8 pt-16 pb-24 md:pt-24 archive-ed">
      <Reveal>
        <p className="ed-eyebrow">A thought to keep, if you want to:</p>
        <h1 className="ed-display mt-4">Write a take.</h1>
        <p className="ed-lede mt-5">
          Fresh topic from the live page. Unscored. Guidance is optional coaching — History never records it.
        </p>
      </Reveal>

      {(article?.topic || live?.topic) && (
        <article className="mt-8 pt-6 border-t border-line">
          <p className="eyebrow">{article?.category_label || 'Today’s field note'}</p>
          <h2 className="t-title text-fg mt-2">{article?.topic || live?.topic}</h2>
          {article?.summary && <p className="text-fg-2 mt-3 text-pretty">{article.summary}</p>}
          {article?.source_url && (
            <a className="t-meta underline underline-offset-4 mt-2 inline-block" href={article.source_url} target="_blank" rel="noreferrer">
              Wikipedia source
            </a>
          )}
        </article>
      )}

      <p className="ed-lede mt-8">{prompt[1]}</p>
      {live?.reflection_hint && <p className="t-meta text-fg-3 mt-2">{live.reflection_hint}</p>}
      {askErr && <p className="t-meta text-fg-3 mt-2">{askErr}</p>}

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

      <div className="mt-6 flex flex-wrap gap-3">
        {!today && (
          <button type="button" className="btn-primary" onClick={save} disabled={!response.trim()}>
            Stamp your mark
          </button>
        )}
        <button type="button" className="btn-secondary" onClick={() => void askGuide()} disabled={asking || draft.trim().length < 8}>
          {asking ? 'Listening…' : 'Ask for guidance'}
        </button>
      </div>

      {guide && (
        <aside className="mt-8 pt-6 border-t border-line max-w-xl">
          <p className="eyebrow">Guidance · not a score</p>
          {guide.intent_summary && <p className="text-fg mt-3">{guide.intent_summary}</p>}
          {guide.strength && <p className="text-fg-2 mt-3">{guide.strength}</p>}
          {guide.next_step && <p className="text-fg mt-3">{guide.next_step}</p>}
        </aside>
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
