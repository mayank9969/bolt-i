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
    <div className="relative z-10 max-w-page mx-auto px-5 sm:px-6 lg:px-8 pt-16 pb-24 md:pt-24">
      <Reveal>
        <p className="figcap inline-flex items-center gap-3">
          <span className="w-8 h-px bg-line-strong" />
          Studio · four-day lab
        </p>
        <h1 className="t-hero text-fg mt-6">Four short sittings.</h1>
        <p className="t-lead text-fg-2 mt-5 max-w-lg">
          newest.py’s topic lab, as a four-day loop. Each day opens the live quiz on that island — five questions, mixed difficulty.
        </p>
      </Reveal>
      <ol className="mt-10 grid gap-3">
        {DAYS.map((d) => (
          <li key={d.day} className="border-b border-line py-6 flex flex-wrap items-center justify-between gap-4">
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
