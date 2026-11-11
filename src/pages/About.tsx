import '@fontsource-variable/fraunces/wght.css'
import '@fontsource-variable/fraunces/wght-italic.css'
import '@fontsource-variable/source-serif-4/wght.css'
import '@fontsource-variable/source-serif-4/wght-italic.css'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import Reveal from '@/components/Reveal'
import SelfReflection from '@/components/SelfReflection'
import MapQuotePoster from '@/components/MapQuotePoster'
import VeyraFlower from '@/components/VeyraFlower'
import { useWorld } from '@/components/three/world'
import { ArrowRight } from '@/components/ui/Icons'

export default function About() {
  useWorld({ mode: 'quiet' })

  return (
    <div className="relative flex-1 about-ed">
      <div className="relative z-10 max-w-page mx-auto px-5 sm:px-6 lg:px-8 py-10 md:py-16">
        <Reveal>
          <header>
            <div className="max-w-3xl">
              <p className="ed-eyebrow">A personal learning project</p>
              <h1 className="ed-display ed-hero mt-6">
                A question is never the <em>end</em> of the story.
              </h1>
            </div>
            <div className="mt-10 text-fg w-full max-w-4xl">
              <SelfReflection />
            </div>
            <p className="ed-prose mt-8 max-w-3xl">
              I am the person who would rather rebuild an island than leave it looking almost right. I made VEYRA
              because I was tired of learning that vanished the moment a score appeared — I wanted a room where a
              question could <span className="ed-hit">stay open</span>, and where I could see, later, how an hour
              actually went.
            </p>
          </header>
        </Reveal>

        <article className="ed-article mt-2">
          <Section n="01" title="Who this is">
            <p>
              I work like someone assembling a picture <span className="ed-soft">piece by piece</span> — the
              archipelago, the relay, the jewel of an eye, a sitting that must be scored in truth. If a mark is muddy, I
              ask for more light. If a puzzle does not play, it is not a puzzle. That is not decoration. That is how I
              think: finish the thing in front of you, then look again.
            </p>
            <p>
              I do not want a version of myself I never chose. The line under the flower is the one I keep: the mind can
              build a universe and still live inside a habit. VEYRA is my way of interrupting that — a map I return to,
              fifteen islands, two thousand questions, <span className="ed-hit">nothing locked</span>, so curiosity can
              choose instead of a script.
            </p>
            <p>
              I am not writing a company. I am keeping a record for a later me, and for anyone who still likes to sit
              with a question. Take is private if you write one. History only believes the engine. I would rather leave
              a gap than invent a key.
            </p>
          </Section>

          <Section n="02" title="What we are trying">
            <p>
              Our goal is not a higher number. It is to <span className="ed-hit">look closer</span> — to stop guessing
              in the dark, go ashore, and find out what we actually know. A percentage is a moment. It is not a
              verdict. We come back.
            </p>
            <p>
              Between people, a question travels: someone asks, someone tests, someone carries it a little further.
              That is the whole project. Paper and ink. A sitting on the server. A chart you can read. Learning that{' '}
              <span className="ed-soft">stays unfinished on purpose</span>, for the curiouser learners out there.
            </p>
          </Section>

          <Section n="03" title="Leave it open">
            <p>
              One percentage is a moment, not a verdict. History is there so you can come back, not so a single
              score can stand in for everything you understand.
            </p>
            <p>
              Today’s Take, when you want it, is a private line in your own words — subjective and unscored. Skip it if
              you like.{' '}
              <span className="ed-hit">Learning stays unfinished on purpose.</span>
            </p>
            <p className="mt-6">
              <Link
                to="/history"
                className="text-fg font-medium underline underline-offset-4 decoration-line-strong hover:decoration-fg"
              >
                Open History
              </Link>
            </p>
          </Section>
        </article>
      </div>

      <section className="quote-band about-quote relative pt-24 md:pt-32 pb-0 overflow-visible" aria-label="Epigraph">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="quote-veil absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2 rounded-full" />
        </div>
        <blockquote className="relative z-10 mx-auto max-w-page px-6 text-center">
          <p className="quote-line font-sans italic font-normal text-[1.35rem] sm:text-2xl md:text-[1.85rem] max-w-[28ch] mx-auto text-balance leading-snug tracking-tight">
            The mind can build a universe, yet spend a lifetime living inside the walls of a habit. Days become years,
            patterns become identity, and one day you may realize you spent your life repeating a version of yourself
            you never chose.
          </p>
          <p className="quote-line font-sans italic mt-6 text-[1.15rem] sm:text-xl max-w-[32ch] mx-auto leading-snug">
            Perhaps the greatest prison is the one you mistake for your nature. But the moment you recognize its walls,
            you can begin to break them.
          </p>
          <p className="quote-line font-sans italic mt-8 text-[1.5rem] sm:text-3xl md:text-4xl max-w-[20ch] mx-auto leading-snug tracking-tight">
            So tell me, are you shaping your life, or merely repeating it?
          </p>
        </blockquote>
        <div className="about-quote-bloom relative z-10 mx-auto -mt-10 md:-mt-16 pointer-events-auto">
          <VeyraFlower />
        </div>
      </section>

      <MapQuotePoster />
      <div className="relative z-10 max-w-page mx-auto px-5 sm:px-6 lg:px-8 pb-16 pt-8">
        <Reveal>
          <p className="ed-close mt-2">
            Made by Mayank Sarwal, for the pleasure of learning — for only the curiouser learners out there.
          </p>
          <Link to="/setup" className="btn-primary btn-lg mt-8 inline-flex">
            Start a quiz
            <ArrowRight className="arrow w-5 h-5" />
          </Link>
        </Reveal>
      </div>
    </div>
  )
}

function Section({ n, title, children }: { n: string; title: string; children: ReactNode }) {
  return (
    <Reveal>
      <section className="ed-section">
        <h2 className="ed-kicker">
          <span className="ed-num">{n}</span>
          {title}
        </h2>
        <div className="ed-rainbow" aria-hidden="true" />
        <div className="ed-prose">{children}</div>
      </section>
    </Reveal>
  )
}
