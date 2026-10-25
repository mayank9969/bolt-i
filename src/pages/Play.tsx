import { Link, useNavigate } from 'react-router-dom'
import { useWorld } from '@/components/three/world'
import Reveal from '@/components/Reveal'

const ITEMS: { to?: string; state?: object; title: string; note: string; action?: 'daily' }[] = [
  { to: '/setup', title: 'Start Quiz', note: 'Pick an island, a difficulty, and a length.' },
  { action: 'daily', title: 'Daily Challenge', note: 'Five mixed questions, the same set for today.' },
  { to: '/setup', title: 'Practise missed questions', note: 'Revisit islands with terracotta markers after a quiz.' },
  { to: '/setup', title: 'Smart review', note: 'Due practice uses your history; start a quiz on a weak island.' },
  { to: '/progress', title: 'Progress dashboard', note: 'Scores, categories, and learning milestones.' },
  { to: '/history', title: 'Show history', note: 'Every scored attempt the server still holds.' },
  { to: '/take', title: 'Today’s Take', note: 'A short written view, kept on this device.' },
  { to: '/take', title: 'Past takes', note: 'Read back what you wrote on earlier days.' },
  { to: '/concepts', title: 'Concept Studio', note: 'Curated lessons from the newest.py library.' },
  { to: '/setup', title: 'Practise a focus skill', note: 'Open a subject island and keep the count small.' },
  { to: '/progress', title: 'Recommended next session', note: 'The weakest category in your history.' },
  { to: '/progress', title: 'Learning milestones', note: 'First quiz, perfect round, explorer, streak.' },
  { to: '/lab', title: 'Four-Day Topic Lab', note: 'A four-day loop of short quizzes.' },
]

export default function Play() {
  useWorld({ mode: 'quiet' })
  const navigate = useNavigate()

  return (
    <div className="relative z-10 max-w-page mx-auto px-5 sm:px-6 lg:px-8 py-10 md:py-16">
      <Reveal>
        <p className="opener">
          <span>Player menu</span>
        </p>
        <h1 className="t-hero text-fg mt-4 max-w-[16ch]">
          Practise, review, <span className="t-italic text-accent">learn.</span>
        </h1>
        <p className="t-lead text-fg-2 mt-5 max-w-lg">
          The same player path as newest.py — wired to the live quiz engine where a session can start, and kept on this page where it cannot.
        </p>
      </Reveal>
      <ul className="mt-10 grid sm:grid-cols-2 gap-3">
        {ITEMS.map((item) => (
          <li key={item.title}>
            <button
              type="button"
              className="w-full text-left rounded-2xl border border-line bg-card p-5 hover:border-line-strong transition-colors"
              onClick={() => {
                if (item.action === 'daily') {
                  navigate('/setup', { state: { category: 'all', difficulty: 'mixed', questionCount: 5, daily: true } })
                  return
                }
                if (item.to) navigate(item.to, { state: item.state })
              }}
            >
              <p className="text-fg font-medium">{item.title}</p>
              <p className="t-meta text-fg-2 mt-1">{item.note}</p>
            </button>
          </li>
        ))}
      </ul>
      <p className="t-meta text-fg-3 mt-8">
        <Link to="/" className="link-rule">
          Back to the archipelago
        </Link>
      </p>
    </div>
  )
}
