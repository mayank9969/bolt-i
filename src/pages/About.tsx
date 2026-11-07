import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import Reveal from '@/components/Reveal'
import CarryInk from '@/components/CarryInk'
import { useWorld } from '@/components/three/world'
import { ArrowRight } from '@/components/ui/Icons'

export default function About() {
  useWorld({ mode: 'quiet' })

  return (
    <div className="relative flex-1 about-ed">
      <div className="relative z-10 max-w-page mx-auto px-5 sm:px-6 lg:px-8 py-10 md:py-16">
        <Reveal>
          <header className="max-w-3xl">
            <p className="ed-eyebrow">About VEYRA</p>
            <h1 className="ed-display text-[clamp(2.4rem,6vw,4.2rem)] mt-5 text-balance">
              A question is never the end of the story.
            </h1>
            <div className="mt-10 mb-4 text-fg">
              <CarryInk />
            </div>
          </header>
        </Reveal>

        <article className="ed-article mt-4">
          <Reveal>
            <div className="ed-prose">
              <p>
                VEYRA began with a simple thought: learning should leave something behind. Not just a score on a
                screen, but a question you carry with you, an idea you understand differently, or a reason to come back
                tomorrow.
              </p>
              <p>
                I’m Mayank, and VEYRA is my personal learning project. I made it to bring together two things I care
                about: the pleasure of discovering what I know, and the honesty of seeing what I still need to learn.
              </p>
            </div>
          </Reveal>

          <Section title="Knowledge keeps moving">
            <p>
              A question can begin with one person, travel through many minds, and lead somewhere its first asker could
              never have expected. An observation becomes an idea. Someone tests it. Someone else improves it. Much
              later, it may become part of how we understand or shape the world.
            </p>
            <p>
              That journey is the spirit behind VEYRA. Its subjects are places to explore, but they’re connected by the
              questions people keep asking. Learning isn’t a finished list. It’s a path that keeps branching.
            </p>
          </Section>

          <Section title="Fifteen subjects. Many ways in.">
            <p>
              VEYRA brings together 15 subjects, from Astronomy & Space to Biology, History, Mathematics, Python
              Programming, and Technology. The question bank contains 2,000 questions across three difficulty levels,
              with both multiple-choice and typed-answer formats.
            </p>
            <p>
              You choose a subject, a difficulty, and how many questions you want to answer. You can take a short visit
              or stay with a subject longer. There’s no required order and no subject you have to unlock first.
              Curiosity gets to choose where to go.
            </p>
          </Section>

          <Section title="A score should tell the truth">
            <p>
              A quiz is useful when you can trust what happened. VEYRA checks answers through its quiz engine and
              records scored attempts in the Archive. That gives you a record you can return to: which subjects you
              explored, how each attempt went, and where you may want to look again.
            </p>
            <p>
              One result is only one moment. It can show what happened in that sitting; it cannot define your
              intelligence or measure everything you understand. The point of keeping a record is to make learning
              easier to revisit, not to turn it into a verdict.
            </p>
          </Section>

          <Section title="The Archive: a record of returning">
            <p>
              The Archive gives each completed attempt a place in your learning history. Over time, those records can
              show what you’ve practised, which subjects you return to, and how your results vary between sessions.
            </p>
            <p>
              Progress is rarely a straight line. A difficult attempt can be followed by a stronger one; a familiar
              subject can still surprise you. The Archive keeps those moments together so you can see a longer story
              than any single score can tell.
            </p>
            <p className="mt-6">
              <Link to="/history" className="text-fg font-medium underline underline-offset-4 decoration-line-strong hover:decoration-fg">
                Open the Archive
              </Link>
            </p>
          </Section>

          <Section title="Make room for your own thought">
            <p>
              Some questions have a checkable answer. Others invite a personal response. VEYRA’s Today’s Take is a
              place to consider an open-ended prompt in your own words. There’s no right opinion to guess and no need
              to reveal anything you’d rather keep private.
            </p>
            <p>
              A short answer is enough. Skipping is fine, too. The value is in making space to notice what you
              think—not in being judged for it.
            </p>
          </Section>

          <Section title="Made with care, still growing">
            <p>
              VEYRA is a personal project, and it is still taking shape. I want it to feel clear about what it can do,
              honest about what it records, and welcoming to people who are curious without making learning feel like a
              competition.
            </p>
            <p>
              I’m building it one question, one subject, and one improvement at a time. If you spend a few minutes here
              and leave with a question worth carrying forward, then VEYRA has done what I hoped it would do.
            </p>
          </Section>

          <Reveal>
            <p className="ed-close mt-14 pt-8 border-t border-line-strong">
              Made by Mayank, for the pleasure of learning—and for whatever your curiosity leads you to next.
            </p>
            <Link to="/setup" className="btn-primary btn-lg mt-10 inline-flex">
              Start a quiz
              <ArrowRight className="arrow w-5 h-5" />
            </Link>
          </Reveal>
        </article>
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
