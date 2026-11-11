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
      <div className="relative z-10 max-w-page mx-auto px-5 sm:px-8 lg:px-12 py-10 md:py-16">
        <Reveal>
          <header>
            <div className="max-w-3xl">
              <p className="ed-eyebrow">A first product · a personal learning project</p>
              <h1 className="ed-display ed-hero mt-6">
                A question is never the <em>end</em> of the story.
              </h1>
            </div>
            <div className="mt-10 text-fg w-full max-w-4xl">
              <SelfReflection />
            </div>
            <p className="ed-prose mt-8 max-w-3xl">
              I am the person who would rather rebuild an island than leave it looking almost right. I made VEYRA
              because I was tired of learning that vanished the moment a score appeared. I wanted a room where a
              question could <span className="ed-weight">stay open</span> — and where I could see, later, how an hour
              actually went.
            </p>
          </header>
        </Reveal>

        <article className="ed-article mt-2">
          <Section n="01" title="Who this is">
            <p>
              I work like someone assembling a picture <span className="ed-soft">piece by piece</span>. The
              archipelago, the relay, the jewel of an eye, a sitting that must be scored in truth — none of that is a
              costume I put on the work. If a mark is muddy I ask for more light. If a puzzle does not play, it is not a
              puzzle. I finish the thing in front of me, then I look again. That is the only method I trust.
            </p>
            <p>
              I do not want a version of myself I never chose. Days become years; a pattern becomes a name; one morning
              you notice you have been repeating a life you did not pick. The line under the flower is the one I keep:{' '}
              <span className="ed-weight">the mind can build a universe and still live inside a habit.</span> VEYRA is
              how I interrupt that. A map I return to. Fifteen islands. Two thousand questions.{' '}
              <span className="ed-hit">Nothing locked.</span> Curiosity chooses, or I am only reciting.
            </p>
            <p>
              I am not writing a company, and I am not performing a biography. I am keeping a record for a later me —
              and for anyone who still likes to sit with a question until it changes shape. Take, if I write one, is
              private and unscored: a thought I will not let a percentage touch. History only believes the engine. I
              would rather leave a <span className="ed-soft">gap</span> than invent a key. The browser never holds the
              answer before I finish. That is not a technical detail. That is a promise I made to myself: do not cheat
              the hour.
            </p>
            <p>
              When I say I made this for the pleasure of learning, I mean the slow kind — the kind that does not vanish
              when the sitting ends. I mean coming back to an island I failed, not because a dashboard told me to, but
              because I still did not understand. I mean paper and ink, a field of islands, a chart I can actually read.
              I mean being the sort of person who will sit until the picture holds.
            </p>
            <p>
              If you need a name to hold all of that: I am Mayank Sarwal. The rest of this page is the part that
              actually matters.
            </p>
          </Section>

          <Section n="02" title="The rush of a first product">
            <p>
              This is the first thing I have put in the world as a whole. Not a sketch in a folder. A room other people
              can walk into. The feeling is not calm. It is a <span className="ed-weight">rush</span> — the kind that
              sits in the chest when the islands load, when a sitting actually starts, when History writes a line that
              is mine. Pride and exposure in the same breath. Hands a little too awake. I keep asking whether the jewel
              is bright enough, whether the puzzle plays, whether the sentence tells the truth, because once it is
              public, <span className="ed-soft">almost</span> is not a place I can hide.
            </p>
            <p>
              Imagine the first time you show someone a thing you made and you cannot take it back. That is this. The
              excitement is not fireworks. It is quieter and worse and better: waiting to see if a stranger will sit
              with a question the way I sit with one. Wanting them to feel the field at sunset, the click of a piece,
              the small heat of getting something right without being lied to. Wanting them not to bounce. That want is
              the rush.
            </p>
            <p>
              A first product is also a decision about who I am willing to be seen as. I could have shipped a quiz with
              a leaderboard and called it done. I did not. I built a field of islands, a relay of curiosity, History
              that only believes the engine, a Take no one grades. That is the person I am trying to be: someone who
              will not flatten a question to look finished — even when finishing would feel safer.
            </p>
            <p>
              It feels like standing on the first island with the rest of the map still in fog, pulse up, and going
              ashore anyway. If you are here, you are walking through that decision with me. Welcome. Stay long enough
              to find out whether the picture holds.
            </p>
          </Section>

          <Section n="03" title="What I am trying">
            <p>
              The goal is not a higher number. It is to <span className="ed-weight">look closer</span>. To stop guessing
              in the dark. To go ashore and find out what I actually know, not what I can recite. A percentage is a
              moment. It is not a verdict. I come back.
            </p>
            <p>
              Between people, a question travels: someone asks, someone tests, someone carries it a little further. I
              wanted a small version of that motion in one place. Home is the map. Practice is the relay. A sitting is
              scored on the server. History is the trail. This page is the reason. If the work is honest, a later hour
              can use it. If it is not honest, it is only noise I will have to unlearn.
            </p>
            <p>
              So the project stays slightly unfinished on purpose. Not because I cannot close it — because a closed
              question stops teaching. <span className="ed-hit">Leave room for the next.</span> For the curiouser
              learners. For the person I am still becoming, who might need this map more than I do today.
            </p>
          </Section>

          <Section n="04" title="Leave it open">
            <p>
              One percentage cannot stand in for everything I understand. History is there so I can return — to see
              which subjects I touched, which I fled, which I sat with until the band got shorter. The charts are not
              trophies. They are a way to look at an hour without lying to it.
            </p>
            <p>
              Today’s Take, when I want it, is a line in my own words. Skip it. Write it. No one grades it.{' '}
              <span className="ed-weight">Learning stays unfinished on purpose.</span> That is the whole ethic. Shape
              the life, or merely repeat it — I built VEYRA so I would have to keep answering that.
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
        <div className="about-quote-bloom relative z-10 mx-auto mt-8 pb-10 pointer-events-auto">
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
