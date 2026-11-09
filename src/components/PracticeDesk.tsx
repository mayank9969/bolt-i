import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getHistory } from '@/api/quizApi'
import type { HistoryEntry } from '@/types/quiz'
import { reviewTopics } from '@/lib/review'
import { formatPercent, labelCategory } from '@/lib/format'

/**
 * Practice hub — only features with a real web data path.
 * latests.py desktop extras that the Flask adapter does not expose stay labelled as such.
 */
export default function PracticeDesk() {
  const [history, setHistory] = useState<HistoryEntry[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getHistory()
      .then(setHistory)
      .catch((e: Error) => {
        setError(e.message)
        setHistory([])
      })
  }, [])

  const review = useMemo(() => reviewTopics(history), [history])
  const n = history?.length ?? 0
  const next = review[0]

  return (
    <section className="relative z-10 max-w-page mx-auto w-full px-5 sm:px-6 lg:px-8 pt-8 pb-6">
      <p className="figcap">Practice desk</p>
      <h1 className="t-hero text-fg mt-3 text-balance">What to sit with next.</h1>
      <p className="t-lead text-fg-2 mt-4 max-w-2xl">
        This desk uses the same Paper and Ink chrome as Home and About. Below it, the illustrated relay of curiosity
        keeps its own cobalt, red, ochre, and forest. Actions here only open sittings the quiz engine can actually
        score — nothing is invented.
      </p>

      {error && (
        <p className="mt-4 text-fg-2 text-sm" role="status">
          History is offline ({error}). Links still open Setup, Studio, and the archive; they will not invent scores.
        </p>
      )}

      <p className="mt-6 text-fg-2 text-sm max-w-2xl">
        {n === 0
          ? 'No engine sittings yet. A five-question daily mix is the honest next step.'
          : next
            ? `Latest history: ${n} sitting${n === 1 ? '' : 's'}. ${labelCategory(next.id)} still had ${next.wrong} miss${next.wrong === 1 ? '' : 'es'} on attempt ${next.attempt} (${formatPercent(next.percentage)}).`
            : `Latest history: ${n} sitting${n === 1 ? '' : 's'}. No single region still shows misses on its latest attempt.`}
      </p>

      <ul className="mt-8 grid sm:grid-cols-2 gap-3">
        <DeskCard
          kicker="Recommended"
          title={next ? `Revisit ${labelCategory(next.id)}` : 'Daily mix of five'}
          body={
            next
              ? 'Opens Setup on that region. The engine picks live questions; we do not replay a stored miss list (history has no item-level keys).'
              : 'Five questions, mixed from the bank. Same start path as a normal quiz.'
          }
          to="/setup"
          state={next ? { category: next.id, questionCount: 5 } : { category: 'all', difficulty: 'mixed', questionCount: 5, daily: true }}
        />
        <DeskCard
          kicker="Daily challenge"
          title="Five from the bank"
          body="A short sitting. Count is five; category and tier stay yours to confirm on Setup."
          to="/setup"
          state={{ category: 'all', difficulty: 'mixed', questionCount: 5, daily: true }}
        />
        <DeskCard
          kicker="Smart review"
          title={review.length ? `${review.length} region${review.length === 1 ? '' : 's'} with misses` : 'Nothing due'}
          body={
            review.length
              ? review.map((r) => labelCategory(r.id)).join(', ')
              : 'When a region’s latest attempt still has wrong answers, it appears here. Empty means history does not currently flag one.'
          }
          to={review[0] ? '/setup' : '/history'}
          state={review[0] ? { category: review[0].id } : undefined}
        />
        <DeskCard
          kicker="Focus skill"
          title="Pick a region"
          body="Setup is the focus path — one category, one tier, scored on the server."
          to="/setup"
        />
        <DeskCard
          kicker="Concept Studio"
          title="A rotating lesson"
          body="Daily pick from the concept library already on the site. Check items stay in the browser."
          to="/concepts"
        />
        <DeskCard
          kicker="Today’s Take"
          title="Unscored, private"
          body="Saved in this browser only. Gemini reflection from the desktop tool is not connected on the web — there is no send button here."
          to="/take"
        />
        <DeskCard
          kicker="Four-day lab"
          title="A short sequence"
          body="The existing lab page. Not a new engine mode."
          to="/lab"
        />
        <DeskCard kicker="Record" title="History" body="Every scored sitting the engine has stored." to="/history" />
        <DeskCard kicker="Record" title="Progress" body="Summaries from the same history file. No extra scores." to="/progress" />
      </ul>

      <details className="mt-8 max-w-2xl text-fg-2 text-sm leading-relaxed">
        <summary className="cursor-pointer text-fg font-medium">What the desktop latests.py file can do that this page does not</summary>
        <p className="mt-3">
          The uploaded <code>latests.py</code> is a Tkinter program. Flask still scores through <code>quiz.py</code>. Not
          live here: spaced item-level review, skill-tag focus, dated streaks, conservative typed-answer meaning checks,
          and optional Gemini feedback. Those stay off until they have a server path that never sends keys to the
          browser before submit.
        </p>
      </details>
    </section>
  )
}

function DeskCard({
  kicker,
  title,
  body,
  to,
  state,
}: {
  kicker: string
  title: string
  body: string
  to: string
  state?: object
}) {
  return (
    <li>
      <Link
        to={to}
        state={state}
        className="block h-full rounded-2xl border border-line bg-card p-5 hover:border-line-strong hover:bg-hover transition-colors"
      >
        <p className="eyebrow">{kicker}</p>
        <p className="text-fg font-medium mt-2 text-pretty">{title}</p>
        <p className="text-fg-2 mt-2 text-sm text-pretty">{body}</p>
      </Link>
    </li>
  )
}
