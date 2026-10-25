import { useNavigate } from 'react-router-dom'
import { useWorld } from '@/components/three/world'

type Item = {
  n: string
  title: string
  benefit: string
  to?: string
  daily?: boolean
}

const PRACTICE: Item[] = [
  { n: '01', title: 'Start a quiz', benefit: 'Choose an island, a tier, and a length. Scored on the server.', to: '/setup' },
  { n: '02', title: 'Daily challenge', benefit: 'Five mixed questions — the same sitting newest.py used for a day.', daily: true },
  { n: '03', title: 'Missed questions', benefit: 'Return to islands whose latest attempt still has wrong answers.', to: '/setup' },
  { n: '04', title: 'Smart review', benefit: 'Open Progress and sit the weakest category in your archive.', to: '/progress' },
  { n: '05', title: 'Focus skill', benefit: 'A short quiz on one subject. Keep the count small.', to: '/setup' },
]

const EXPLORE: Item[] = [
  { n: '06', title: 'Concept studio', benefit: 'Lessons with an analogy, an idea, an example, and a check.', to: '/concepts' },
  { n: '07', title: 'Four-day lab', benefit: 'Four short sittings on a looping schedule of islands.', to: '/lab' },
]

const REFLECT: Item[] = [
  { n: '08', title: 'Progress', benefit: 'Scores by region and the milestones you have actually earned.', to: '/progress' },
  { n: '09', title: 'History', benefit: 'Every scored attempt the engine still holds.', to: '/history' },
  { n: '10', title: 'Today’s take', benefit: 'A written view. Stored only on this device.', to: '/take' },
  { n: '11', title: 'Past takes', benefit: 'Read back what you wrote on earlier days.', to: '/take' },
  { n: '12', title: 'Next session', benefit: 'A recommended island from your weakest scores.', to: '/progress' },
  { n: '13', title: 'Milestones', benefit: 'First quiz, perfect round, subject explorer.', to: '/progress' },
]

function Section({
  kicker,
  title,
  note,
  items,
  go,
}: {
  kicker: string
  title: string
  note: string
  items: Item[]
  go: (i: Item) => void
}) {
  return (
    <section className="studio-band">
      <header className="studio-band-head">
        <p className="studio-kicker">{kicker}</p>
        <h2 className="studio-band-title">{title}</h2>
        <p className="studio-band-note">{note}</p>
      </header>
      <ul className="studio-rows">
        {items.map((item) => (
          <li key={item.n}>
            <button type="button" className="studio-row" onClick={() => go(item)}>
              <span className="studio-row-n">{item.n}</span>
              <span className="studio-row-copy">
                <strong>{item.title}</strong>
                <span>{item.benefit}</span>
              </span>
              <span className="studio-row-go" aria-hidden="true">
                →
              </span>
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
  const go = (item: Item) => {
    if (item.daily) {
      navigate('/setup', { state: { category: 'all', difficulty: 'mixed', questionCount: 5, daily: true } })
      return
    }
    if (item.to) navigate(item.to)
  }

  return (
    <div className="relative z-10 max-w-page mx-auto px-5 sm:px-6 lg:px-8 pt-16 pb-24 md:pt-24">
      <p className="nb-stamp">Studio</p>
      <h1 className="t-hero text-fg mt-6 max-w-[16ch]">Thirteen doors. One engine.</h1>
      <p className="t-lead text-fg-2 mt-6 max-w-lg">
        Practice, explore, then look back. Home keeps the map; this page is only the sittings.
      </p>
      <Section kicker="01 — Practice" title="Sit with questions." note="Quiz, daily five, misses, review, and a short focus sitting." items={PRACTICE} go={go} />
      <Section kicker="02 — Explore" title="Learn beside the quiz." note="Concept lessons and a four-day lab. No invented scores." items={EXPLORE} go={go} />
      <Section kicker="03 — Reflect" title="Read what you already did." note="Progress, archive, writing, and milestones from real attempts." items={REFLECT} go={go} />
    </div>
  )
}
