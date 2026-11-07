import '@fontsource-variable/fraunces/wght.css'
import '@fontsource-variable/fraunces/wght-italic.css'
import '@fontsource-variable/source-serif-4/wght.css'
import '@fontsource-variable/source-serif-4/wght-italic.css'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import Reveal from '@/components/Reveal'
import CarryInk from '@/components/CarryInk'
import WireFlower from '@/components/WireFlower'
import { useWorld } from '@/components/three/world'
import { ArrowRight } from '@/components/ui/Icons'

export default function About() {
  useWorld({ mode: 'quiet' })

  return (
    <div className="relative flex-1 about-ed">
      <div className="relative z-10 max-w-page mx-auto px-5 sm:px-6 lg:px-8 py-10 md:py-16">
        <Reveal>
          <header className="max-w-3xl">
            <p className="ed-eyebrow">A personal learning project</p>
            <h1 className="ed-display ed-hero mt-6">
              A question is never the <em>end</em> of the story.
            </h1>
            <p className="ed-prose mt-7">
              I’m Mayank. VEYRA is a place I made to look closer at what I know, and to keep a{' '}
              <span className="ed-hit">truthful record</span> of what still needs another sitting.
            </p>
            <div className="mt-10 text-fg">
              <CarryInk />
            </div>
          </header>
        </Reveal>

        <article className="ed-article mt-2">
          <Section title="Look closer">
            <p>
              A question asks you to stop guessing in the dark. You pick one of{' '}
              <span className="ed-hit">fifteen subjects</span>, a difficulty, and a length. Some answers are multiple
              choice; some you type. The quiz engine on the server checks them.{' '}
              <span className="ed-soft">The browser never sees a key before you finish.</span>
            </p>
            <p>
              <span className="ed-hit">Two thousand questions</span> sit in the bank. Nothing is locked.{' '}
              <span className="ed-soft">Curiosity chooses the island.</span>
            </p>
          </Section>

          <Section title="Ideas travel">
            <p>
              Knowledge does not stay with one sitting. An attempt is scored, then it is written into the Archive — so
              a later you can see which subjects you returned to, and how that hour actually went.
            </p>
            <p>
              Between people, a question is the same motion: someone asks, someone tests, someone carries it a little
              further. VEYRA is a small version of that — <span className="ed-soft">not a company profile</span>, just
              a project that wants the record to stay <span className="ed-hit">honest</span>.
            </p>
          </Section>

          <Section title="Leave it open">
            <p>
              One percentage is a moment, not a verdict. The Archive is there so you can come back, not so a single
              score can stand in for everything you understand.
            </p>
            <p>
              Today’s Take, when you want it, is a private line in your own words. Skip it if you like.{' '}
              <span className="ed-hit">Learning stays unfinished on purpose.</span>
            </p>
            <p className="mt-6">
              <Link
                to="/history"
                className="text-fg font-medium underline underline-offset-4 decoration-line-strong hover:decoration-fg"
              >
                Open the Archive
              </Link>
            </p>
          </Section>
        </article>

        <Reveal>
          <figure className="ed-coda">
            <WireFlower />
            <blockquote>
              <p className="ed-q-lead">
                The mind can build a universe, yet spend a lifetime living inside the walls of a habit. Days become
                years, patterns become identity, and one day you may realize you spent your life repeating a version of
                yourself you never chose.
              </p>
              <p>
                Perhaps the greatest prison is the one you mistake for your nature. But the moment you recognize its
                walls, you can begin to break them.
              </p>
              <p className="ed-q-ask">So tell me, are you shaping your life, or merely repeating it?</p>
            </blockquote>
          </figure>
        </Reveal>

        <Reveal>
          <p className="ed-close mt-10">Made by Mayank, for the pleasure of learning.</p>
          <Link to="/setup" className="btn-primary btn-lg mt-8 inline-flex">
            Start a quiz
            <ArrowRight className="arrow w-5 h-5" />
          </Link>
        </Reveal>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Reveal>
      <section className="ed-section">
        <h2 className="ed-kicker">{title}</h2>
        <div className="ed-prose">{children}</div>
      </section>
    </Reveal>
  )
}
