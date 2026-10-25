import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useWorld } from '@/components/three/world'

type Item = {
  title: string
  benefit: string
  action: string
  kind: string
  to?: string
  daily?: boolean
}

const PRACTICE: Item[] = [
  { title: 'Start a quiz', benefit: 'Pick an island, a difficulty, and how many questions. The server scores every answer.', action: 'Sit a quiz', kind: 'fill-teal', to: '/setup' },
  { title: 'Daily challenge', benefit: 'Five mixed questions for today — the same length newest.py used for a daily sitting.', action: 'Draw five', kind: 'fill-lime', daily: true },
  { title: 'Missed questions', benefit: 'Go back to islands whose latest attempt still has wrong answers (terracotta on the map).', action: 'Return there', kind: 'outline', to: '/setup' },
  { title: 'Smart review', benefit: 'See which category is weakest in your archive, then sit it.', action: 'Open progress', kind: 'pill-ink', to: '/progress' },
  { title: 'Focus skill', benefit: 'A short sitting on one subject. Keep the count small.', action: 'Keep it short', kind: 'underline', to: '/setup' },
]

const EXPLORE: Item[] = [
  { title: 'Concept studio', benefit: 'A lesson: analogy, idea, example, then a check. Maths and Python are in the library.', action: 'Read a lesson', kind: 'fill-lime', to: '/concepts' },
  { title: 'Four-day lab', benefit: 'Four short quizzes on a looping schedule of islands.', action: 'See the four days', kind: 'fill-coral', to: '/lab' },
]

const REFLECT: Item[] = [
  { title: 'Progress', benefit: 'Scores by region and milestones earned from real attempts.', action: 'See scores', kind: 'fill-teal', to: '/progress' },
  { title: 'History', benefit: 'Every scored attempt the engine still holds.', action: 'Open the archive', kind: 'pill-ink', to: '/history' },
  { title: 'Today’s take', benefit: 'Write a short view. It stays on this device only.', action: 'Write today', kind: 'outline', to: '/take' },
  { title: 'Past takes', benefit: 'Read back earlier writing from this browser.', action: 'Reread', kind: 'underline', to: '/take' },
  { title: 'Next session', benefit: 'A recommended island from your weakest scores.', action: 'Recommend one', kind: 'fill-lime', to: '/progress' },
  { title: 'Milestones', benefit: 'First quiz, perfect round, subject explorer — only if you earned them.', action: 'Check marks', kind: 'fill-coral', to: '/progress' },
]

const list = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.08 } },
}
const card = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
}

function Block({ kicker, title, items, go }: { kicker: string; title: string; items: Item[]; go: (i: Item) => void }) {
  return (
    <motion.section
      className="studio-band"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <p className="studio-kicker">{kicker}</p>
      <h2 className="studio-band-title">{title}</h2>
      <motion.ul className="studio-topics" variants={list} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-40px' }}>
        {items.map((item) => (
          <motion.li key={item.title} className="studio-topic" variants={card} whileHover={{ y: -4, transition: { duration: 0.2 } }}>
            <h3>{item.title}</h3>
            <p>{item.benefit}</p>
            <button type="button" className={`studio-go studio-go-${item.kind}`} onClick={() => go(item)}>
              {item.action}
            </button>
          </motion.li>
        ))}
      </motion.ul>
    </motion.section>
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
    <div className="practice-page relative z-10 max-w-page mx-auto px-5 sm:px-6 lg:px-8 pt-16 pb-24 md:pt-24">
      <motion.p className="nb-stamp" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
        Practice
      </motion.p>
      <motion.h1
        className="t-hero text-fg mt-6 max-w-[16ch]"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
      >
        Thirteen doors. One engine.
      </motion.h1>
      <motion.p
        className="t-lead text-fg-2 mt-6 max-w-lg"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.16 }}
      >
        Each sitting is explained, then a button that goes there. The map stays on Home.
      </motion.p>
      <Block kicker="Practice" title="Sit with questions." items={PRACTICE} go={go} />
      <Block kicker="Explore" title="Learn beside the quiz." items={EXPLORE} go={go} />
      <Block kicker="Reflect" title="Look at what you already did." items={REFLECT} go={go} />
    </div>
  )
}
