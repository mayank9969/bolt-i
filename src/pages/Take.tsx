import { useMemo, useState } from 'react'
import prompts from '@/lib/opinionPrompts.json'
import { useWorld } from '@/components/three/world'
import Reveal from '@/components/Reveal'

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
    <div className="relative z-10 max-w-page mx-auto px-5 sm:px-6 lg:px-8 py-10 md:py-16">
      <Reveal>
        <p className="opener">
          <span>Today’s Take</span>
        </p>
        <h1 className="t-hero text-fg mt-4">Write a view.</h1>
        <p className="t-lead text-fg-2 mt-5 max-w-lg">
          Prompts from newest.py. Stored only in this browser — the quiz API is not involved.
        </p>
      </Reveal>
      {prompt && (
        <section className="mt-8 rounded-2xl border border-line bg-card p-6">
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
        </section>
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
    </div>
  )
}
