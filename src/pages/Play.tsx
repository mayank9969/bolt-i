import { useNavigate } from 'react-router-dom'
import { useWorld } from '@/components/three/world'

const ITEMS: { n: string; title: string; note: string; to?: string; daily?: boolean }[] = [
  { n: '01', title: 'Start a quiz', note: 'Island, difficulty, length', to: '/setup' },
  { n: '02', title: 'Daily challenge', note: 'Five mixed questions for today', daily: true },
  { n: '03', title: 'Missed questions', note: 'Terracotta islands after a quiz', to: '/setup' },
  { n: '04', title: 'Smart review', note: 'A weak island from your history', to: '/progress' },
  { n: '05', title: 'Progress', note: 'Scores and milestones', to: '/progress' },
  { n: '06', title: 'History', note: 'Every scored attempt', to: '/history' },
  { n: '07', title: 'Today’s take', note: 'A written view, this device only', to: '/take' },
  { n: '08', title: 'Past takes', note: 'Earlier writing', to: '/take' },
  { n: '09', title: 'Concept studio', note: 'Lessons from the library', to: '/concepts' },
  { n: '10', title: 'Focus skill', note: 'A short sitting on one island', to: '/setup' },
  { n: '11', title: 'Next session', note: 'Recommended from the archive', to: '/progress' },
  { n: '12', title: 'Milestones', note: 'First quiz, perfect round, explorer', to: '/progress' },
  { n: '13', title: 'Four-day lab', note: 'Four short sittings', to: '/lab' },
]

export default function Play() {
  useWorld({ mode: 'quiet' })
  const navigate = useNavigate()

  return (
    <div className="relative z-10 max-w-page mx-auto px-5 sm:px-6 lg:px-8 pt-16 pb-24 md:pt-24">
      <p className="figcap inline-flex items-center gap-3">
        <span className="w-8 h-px bg-line-strong" />
        Studio · player menu
      </p>
      <h1 className="t-hero text-fg mt-6 max-w-[12ch]">Contents</h1>
      <p className="t-lead text-fg-2 mt-6 max-w-md">
        The player path from newest.py, set as a table of contents. The map stays on Home.
      </p>

      <ol className="toc mt-14">
        {ITEMS.map((item) => (
          <li key={item.n}>
            <button
              type="button"
              className="toc-row"
              onClick={() => {
                if (item.daily) {
                  navigate('/setup', { state: { category: 'all', difficulty: 'mixed', questionCount: 5, daily: true } })
                  return
                }
                if (item.to) navigate(item.to)
              }}
            >
              <span className="toc-num">{item.n}</span>
              <span className="toc-title">{item.title}</span>
              <span className="toc-dots" aria-hidden="true" />
              <span className="toc-note">{item.note}</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  )
}
