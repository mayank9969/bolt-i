import '@fontsource/instrument-serif/400.css'
import '@fontsource/instrument-serif/400-italic.css'
import '@fontsource-variable/dm-sans/wght.css'
import '@fontsource-variable/dm-sans/wght-italic.css'
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/500.css'
import '@fontsource/ibm-plex-mono/600.css'
import { useEffect, useRef, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import Reveal from '@/components/Reveal'
import SelfReflection from '@/components/SelfReflection'
import MapQuotePoster from '@/components/MapQuotePoster'
import VeyraFlower from '@/components/VeyraFlower'
import { useWorld } from '@/components/three/world'
import { ArrowRight } from '@/components/ui/Icons'

const STOPS = [
  { id: 'loop', n: '01', label: 'THE LOOP' },
  { id: 'ashore', n: '02', label: 'GO ASHORE' },
  { id: 'promise', n: '03', label: 'THE PROMISE' },
  { id: 'opening', n: '04', label: 'THE FIRST OPENING' },
  { id: 'route', n: '05', label: 'YOUR ROUTE' },
] as const

export default function About() {
  useWorld({ mode: 'quiet' })

  return (
    <div className="relative flex-1 about-ed field-notes">
      <div className="relative z-10 max-w-page mx-auto px-5 sm:px-8 lg:px-12 py-10 md:py-16">
        <Reveal>
          <header className="field-open">
            <p className="field-meta">Field note 00 · The person behind the map</p>
            <h1 className="field-display">
              <span className="field-display-line">MY MIND COULD BUILD A UNIVERSE.</span>
              <span className="field-display-line field-display-sub">MY DAYS KEPT REPEATING.</span>
            </h1>
            <p className="field-lede">
              I’m Mayank Sarwal. I built VEYRA to make curiosity feel like somewhere I could actually go—not somewhere I
              kept imagining.
            </p>
            <p className="field-stat">15 subject islands. 2,000 questions. No locked route.</p>
            <div className="field-cta">
              <Link to="/" className="btn-primary btn-lg inline-flex">
                Explore the islands
                <ArrowRight className="arrow w-5 h-5" />
              </Link>
            </div>
            <div className="mt-12 text-fg w-full max-w-4xl">
              <SelfReflection />
            </div>
          </header>
        </Reveal>

        <div className="field-story">
          <RouteLine />
          <article className="field-article">
            <Stop id="loop" n="01" label="THE LOOP" mark="loop">
              <p>I was never short on things to wonder about. I was short on a way to follow one before habit pulled me back.</p>
              <p className="field-pull">The mind can build a universe and still live inside a habit.</p>
              <p>
                VEYRA began as an interruption: choose a question for yourself. Stay with it. Come back when it still has
                something to teach you.
              </p>
            </Stop>

            <Stop id="ashore" n="02" label="GO ASHORE" mark="ashore">
              <p>
                Home is the map. Practice is where I go ashore: one sitting, scored after I finish. History keeps the
                record of what the server verifies.
              </p>
              <p>
                Today’s Take is different. It is a private note in my own words, with no score attached. Some learning can
                be counted. Some thoughts should be left alone.
              </p>
            </Stop>

            <Stop id="promise" n="03" label="THE PROMISE" mark="promise">
              <p>If the engine cannot verify an answer, I would rather leave a gap than invent a key.</p>
              <p>
                The browser does not decide the answer while I am still thinking. The sitting finishes first; then History
                records what happened.
              </p>
              <p className="field-stamp">Do not cheat the hour.</p>
            </Stop>

            <Stop id="opening" n="04" label="THE FIRST OPENING" mark="opening">
              <p>
                The first time the islands loaded as a real product, I felt proud and exposed at once. I kept asking: Does
                the puzzle work? Does this sentence tell the truth? Will someone stay with a question a little longer?
              </p>
              <p>
                That is the rush of putting your first whole thing into the world: hoping it matters to someone you have
                never met.
              </p>
              <p>
                VEYRA is a record for a later me—and an invitation to anyone who likes to sit with a question until it
                changes shape.
              </p>
            </Stop>

            <Stop id="route" n="05" label="YOUR ROUTE" mark="route">
              <p>
                You do not have to finish the map. Start with the island that pulls at you. Return to the question that
                resisted you.
              </p>
              <p>If one question follows you after you leave, VEYRA has done what I hoped.</p>
              <p className="field-sign">Mayank Sarwal · Still following the question</p>
              <p className="field-cta field-cta-end">
                <Link to="/history" className="field-ghost">
                  Open History
                </Link>
              </p>
            </Stop>
          </article>
        </div>
      </div>

      <section className="quote-band about-quote relative pt-24 md:pt-32 pb-0 overflow-visible" aria-label="Epigraph">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="quote-veil absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2 rounded-full" />
        </div>
        <blockquote className="relative z-10 mx-auto max-w-page px-6 text-center">
          <p className="quote-line font-sans italic font-normal text-[1.35rem] sm:text-2xl md:text-[1.85rem] max-w-[28ch] mx-auto text-balance leading-snug tracking-tight">
            The mind can build a universe, yet spend a lifetime living inside the walls of a habit. Days become years,
            patterns become identity, and one day you may realize you spent your life repeating a version of yourself you
            never chose.
          </p>
          <p className="quote-line font-sans italic mt-6 text-[1.15rem] sm:text-xl max-w-[32ch] mx-auto leading-snug">
            Perhaps the greatest prison is the one you mistake for your nature. But the moment you recognize its walls, you
            can begin to break them.
          </p>
          <p className="quote-line font-sans italic mt-8 text-[1.5rem] sm:text-3xl md:text-4xl max-w-[20ch] mx-auto leading-snug tracking-tight">
            So tell me, are you shaping your life, or merely repeating it?
          </p>
        </blockquote>
        <div className="about-quote-bloom relative z-10 mx-auto mt-8 pointer-events-auto">
          <VeyraFlower />
          <div className="about-for-you-block">
            <p className="about-for-you">
              this for you <em>my love</em>
            </p>
            <p className="about-for-you-rule">
              <span>— — — —</span>
              <span className="about-for-you-mid">a</span>
              <span>— — — —</span>
            </p>
          </div>
        </div>
      </section>

      <MapQuotePoster />
      <div className="relative z-10 max-w-page mx-auto px-5 sm:px-6 lg:px-8 pb-16 pt-8">
        <Reveal>
          <p className="ed-close mt-2">
            Made by Mayank Sarwal, for the pleasure of learning — for only the curiouser learners out there.
          </p>
        </Reveal>
      </div>
    </div>
  )
}

function Stop({
  id,
  n,
  label,
  mark,
  children,
}: {
  id: string
  n: string
  label: string
  mark: string
  children: ReactNode
}) {
  return (
    <section id={id} className={`field-stop field-stop--${mark}`} data-stop={id}>
      <header className="field-stop-head">
        <p className="field-stop-label">
          <span>{n}</span>
          {label}
        </p>
        <WayMark kind={mark} />
      </header>
      <div className="field-prose">{children}</div>
    </section>
  )
}

function WayMark({ kind }: { kind: string }) {
  return (
    <svg className="field-waymark" viewBox="0 0 72 36" aria-hidden="true">
      {kind === 'loop' && (
        <>
          <circle cx="36" cy="18" r="14" fill="none" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="36" cy="18" r="8" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.55" />
          <circle cx="36" cy="18" r="3" fill="currentColor" />
        </>
      )}
      {kind === 'ashore' && (
        <>
          <path d="M4 28 C 18 18, 30 30, 44 22 S 64 18, 70 26" fill="none" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="18" cy="14" r="3.2" fill="currentColor" />
          <circle cx="36" cy="10" r="4.2" fill="currentColor" opacity="0.7" />
          <circle cx="54" cy="16" r="2.6" fill="currentColor" />
        </>
      )}
      {kind === 'promise' && (
        <>
          <circle cx="36" cy="18" r="13" fill="none" stroke="currentColor" strokeWidth="1.3" strokeDasharray="6 7" />
          <path d="M30 18h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </>
      )}
      {kind === 'opening' && (
        <>
          <path d="M10 26 A 26 16 0 0 1 62 26" fill="none" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="36" cy="16" r="6" fill="currentColor" />
        </>
      )}
      {kind === 'route' && (
        <>
          <path d="M8 30 L 28 18 L 48 8" fill="none" stroke="currentColor" strokeWidth="1.3" />
          <path d="M28 18 L 58 28" fill="none" stroke="currentColor" strokeWidth="1.3" />
          <circle cx="28" cy="18" r="2.4" fill="currentColor" />
        </>
      )}
    </svg>
  )
}

function RouteLine() {
  const wrap = useRef<HTMLDivElement>(null)
  const fill = useRef<SVGPathElement>(null)

  useEffect(() => {
    const root = wrap.current?.closest('.field-story') as HTMLElement | null
    const path = fill.current
    if (!root || !path) return
    const len = path.getTotalLength()
    path.style.strokeDasharray = String(len)
    path.style.strokeDashoffset = String(len)

    const stops = [...root.querySelectorAll<HTMLElement>('[data-stop]')]
    const tick = () => {
      const vh = window.innerHeight
      let seen = 0
      stops.forEach((el, i) => {
        const r = el.getBoundingClientRect()
        const mid = r.top + r.height * 0.28
        if (mid < vh * 0.7) seen = i + 1
      })
      const t = Math.min(1, seen / STOPS.length)
      path.style.strokeDashoffset = String(len * (1 - t))
      root.style.setProperty('--seen', String(seen))
    }
    const io = new IntersectionObserver(tick, { threshold: [0, 0.15, 0.4, 0.7, 1] })
    stops.forEach((el) => io.observe(el))
    window.addEventListener('scroll', tick, { passive: true })
    tick()
    return () => {
      io.disconnect()
      window.removeEventListener('scroll', tick)
    }
  }, [])

  const d = 'M 12 10 C 12 80, 18 110, 12 160 S 6 250, 12 300 S 20 390, 12 450 S 8 520, 12 560'
  return (
    <div className="field-rail" ref={wrap} aria-hidden="true">
      <svg viewBox="0 0 24 568" preserveAspectRatio="none">
        <path d={d} fill="none" stroke="currentColor" strokeWidth="0.9" opacity="0.2" />
        <path ref={fill} d={d} fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
        {STOPS.map((s, i) => (
          <g key={s.id} className={`field-dot field-dot-${i}`}>
            <circle cx="12" cy={10 + i * 137} r="3.6" />
          </g>
        ))}
      </svg>
    </div>
  )
}
