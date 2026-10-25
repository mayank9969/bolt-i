import { useNavigate } from 'react-router-dom'
import { useWorld } from '@/components/three/world'

type Card = {
  title: string
  benefit: string
  to?: string
  daily?: boolean
  accent: 'lime' | 'teal' | 'coral' | 'paper'
}

const PRACTICE: Card[] = [
  { title: 'Start a quiz', benefit: 'Pick an island and sit a scored session.', to: '/setup', accent: 'teal' },
  { title: 'Daily challenge', benefit: 'Five mixed questions, locked to today’s date.', daily: true, accent: 'lime' },
  { title: 'Missed questions', benefit: 'Go back to islands that still carry terracotta.', to: '/setup', accent: 'paper' },
  { title: 'Smart review', benefit: 'Open the weakest category in your archive.', to: '/progress', accent: 'paper' },
  { title: 'Focus skill', benefit: 'A short sitting on one subject.', to: '/setup', accent: 'paper' },
]

const EXPLORE: Card[] = [
  { title: 'Concept studio', benefit: 'Rotate through curated lessons, then a check.', to: '/concepts', accent: 'lime' },
  { title: 'Four-day lab', benefit: 'Four short quizzes on a looping schedule.', to: '/lab', accent: 'coral' },
]

const REFLECT: Card[] = [
  { title: 'Progress', benefit: 'See scores and what the archive has established.', to: '/progress', accent: 'paper' },
  { title: 'History', benefit: 'Every scored attempt the server still holds.', to: '/history', accent: 'teal' },
  { title: 'Today’s take', benefit: 'Write a view. It stays on this device.', to: '/take', accent: 'paper' },
  { title: 'Past takes', benefit: 'Read back earlier writing.', to: '/take', accent: 'paper' },
  { title: 'Next session', benefit: 'A recommended island from your history.', to: '/progress', accent: 'lime' },
  { title: 'Milestones', benefit: 'First quiz, perfect round, explorer.', to: '/progress', accent: 'paper' },
]

function Group({ label, items, go }: { label: string; items: Card[]; go: (c: Card) => void }) {
  return (
    <section className="mt-14">
      <p className="studio-kicker">{label}</p>
      <ul className="studio-grid mt-4">
        {items.map((item) => (
          <li key={item.title}>
            <button type="button" className="studio-card" data-accent={item.accent} onClick={() => go(item)}>
              <h3>{item.title}</h3>
              <p>{item.benefit}</p>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default function Play() {
  useWorld({ mode: 'quiet' })
  const navigate = useNavigate()
  const go = (item: Card) => {
    if (item.daily) {
      navigate('/setup', { state: { category: 'all', difficulty: 'mixed', questionCount: 5, daily: true } })
      return
    }
    if (item.to) navigate(item.to)
  }

  return (
    <div className="relative z-10 max-w-page mx-auto px-5 sm:px-6 lg:px-8 pt-16 pb-24 md:pt-24">
      <p className="nb-stamp">Studio</p>
      <h1 className="t-hero text-fg mt-6 max-w-[14ch]">Practice. Explore. Reflect.</h1>
      <p className="t-lead text-fg-2 mt-6 max-w-lg">
        Thirteen ways to use VEYRA. The archipelago stays on Home; everything here is a door into a sitting you already have.
      </p>
      <Group label="Practice" items={PRACTICE} go={go} />
      <Group label="Explore" items={EXPLORE} go={go} />
      <Group label="Reflect" items={REFLECT} go={go} />
    </div>
  )
}
