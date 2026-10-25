import { Link } from 'react-router-dom'
import { useWorld } from '@/components/three/world'
import Reveal from '@/components/Reveal'
import { labelCategory } from '@/lib/format'

const DAYS = [
  { day: 1, category: 'maths', note: 'Balance and slope — short set.' },
  { day: 2, category: 'python', note: 'Syntax as a craft.' },
  { day: 3, category: 'science', note: 'Observe, then name.' },
  { day: 4, category: 'history', note: 'Cause, then consequence.' },
]

export default function Lab() {
  useWorld({ mode: 'quiet' })
  return (
    <div className="relative z-10 max-w-page mx-auto px-5 sm:px-6 lg:px-8 py-10 md:py-16">
      <Reveal>
        <p className="opener">
          <span>Four-Day Topic Lab</span>
        </p>
        <h1 className="t-hero text-fg mt-4">Four short sittings.</h1>
        <p className="t-lead text-fg-2 mt-5 max-w-lg">
          newest.py’s topic lab, as a four-day loop. Each day opens the live quiz on that island — five questions, mixed difficulty.
        </p>
      </Reveal>
      <ol className="mt-10 grid gap-3">
        {DAYS.map((d) => (
          <li key={d.day} className="rounded-2xl border border-line bg-card p-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="eyebrow">Day {d.day}</p>
              <p className="text-fg font-medium mt-1">{labelCategory(d.category)}</p>
              <p className="t-meta text-fg-2 mt-1">{d.note}</p>
            </div>
            <Link
              to="/setup"
              state={{ category: d.category, difficulty: 'mixed', questionCount: 5 }}
              className="btn-primary btn-sm"
            >
              Open sitting
            </Link>
          </li>
        ))}
      </ol>
    </div>
  )
}
