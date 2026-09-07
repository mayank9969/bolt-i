import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Reveal from '@/components/Reveal'
import { useNetwork } from '@/components/three/store'
import Tier from '@/components/ui/Tier'
import { ArrowRight, Code, Sigma } from '@/components/ui/Icons'
import { getCategories } from '@/api/quizApi'
import type { CategoryInfo } from '@/types/quiz'
import { DIFFICULTY_ORDER, labelCategory } from '@/lib/format'

/**
 * ABOUT — product documentation + brand story + quiet confidence.
 *
 * Reads like the rest of the product: one column of prose, numbered sections
 * with hairlines (the same "Movement" rhythm as Setup), tables instead of
 * cards. Every number on the page comes from the live catalogue; every rule
 * is a plain-language reading of quiz.py — nothing is invented here.
 */
export default function About() {
  // ABOUT — atmospheric: museum-slow, off to the side, never competing with the text.
  useNetwork({ mode: 'atmospheric', camera: 'museum', density: 0.55, activation: 0.3 })

  const [catalog, setCatalog] = useState<CategoryInfo[] | null>(null)
  const [total, setTotal] = useState<number | null>(null)
  useEffect(() => {
    getCategories()
      .then((res) => {
        setCatalog(res.categories)
        setTotal(res.total_questions)
      })
      .catch(() => setCatalog([]))
  }, [])

  const regionNames = catalog && catalog.length ? catalog.map((c) => labelCategory(c.id)) : ['Maths', 'Python']
  const regionList = regionNames.length > 1 ? `${regionNames.slice(0, -1).join(', ')} and ${regionNames[regionNames.length - 1]}` : regionNames[0]

  return (
    <div className="relative flex-1">
      <div className="relative z-10 max-w-page mx-auto px-5 sm:px-6 lg:px-8 py-12 md:py-20">
        {/* ── Intro ─────────────────────────────────────────────────── */}
        <Reveal>
          <header className="max-w-3xl about-paper">
            <span className="opener">About</span>
            <h1 className="t-title text-fg mt-5 text-balance">
              A quiet place to find out what you actually know.
            </h1>
            <p className="t-lead text-fg-2 mt-6 text-pretty">
              NEXUSQuiz is a small, honest quiz product for {regionList}. You choose a region, a tier and a size; the
              server picks the questions, checks every answer and keeps the record. There is nothing to configure and
              nothing to unlock — just questions, a score you can trust, and a history that shows how it moves.
            </p>
          </header>
        </Reveal>

        {/* ── At a glance: real numbers from the catalogue ─────────── */}
        <Reveal delay={0.06}>
          <dl className="mt-12 grid grid-cols-2 md:grid-cols-4 border-y border-line-strong divide-x divide-line">
            <Fact label="Questions" value={total === null ? '—' : String(total)} />
            <Fact label="Regions" value={catalog === null ? '—' : String(Math.max(2, catalog.length))} note={regionNames.join(' · ')} />
            <Fact label="Tiers" value="3" note="Easy · Medium · Hard" />
            <Fact label="Formats" value="2" note="Multiple choice · Typed" />
          </dl>
        </Reveal>

        {/* ── Body: numbered sections with a sticky contents rail ──── */}
        <div className="mt-16 md:mt-20 grid lg:grid-cols-[11rem_1fr] gap-10 lg:gap-16">
          <nav className="hidden lg:block" aria-label="On this page">
            <ol className="sticky top-24 space-y-2.5">
              {SECTIONS.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="t-meta text-fg-3 hover:text-fg transition-colors flex items-baseline gap-3">
                    <span className="index">{s.n}</span>
                    {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="max-w-3xl space-y-16 md:space-y-20 about-paper">
            {/* 01 · What it tests */}
            <Section id="tests" n="01" title="What it tests">
              <p className="t-body text-fg-2 text-pretty">
                Two regions of knowledge, each with three tiers. Easy checks recall, Medium checks understanding, Hard
                checks precision. A <em className="not-italic text-fg">Mixed</em> region draws from every region, and a Mixed tier
                draws from every tier — so you can practise one narrow thing or the whole map at once.
              </p>
              <table className="w-full mt-6 border-t border-line-strong">
                <thead>
                  <tr className="text-left">
                    <th scope="col" className="t-label text-fg-3 font-medium py-3 pr-4">Region</th>
                    {DIFFICULTY_ORDER.map((d) => (
                      <th key={d} scope="col" className="t-label text-fg-3 font-medium py-3 px-2 text-right">
                        {d.charAt(0).toUpperCase() + d.slice(1)}
                      </th>
                    ))}
                    <th scope="col" className="t-label text-fg-3 font-medium py-3 pl-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(catalog && catalog.length ? catalog : PLACEHOLDER).map((c) => {
                    const sum = Object.values(c.difficulties).reduce((a, b) => a + b, 0)
                    return (
                      <tr key={c.id} className="border-t border-line">
                        <th scope="row" className="py-3.5 pr-4 text-left font-medium text-fg flex items-center gap-3">
                          <span className="w-7 h-7 rounded-full border border-line-strong flex items-center justify-center text-fg-2">
                            {c.id === 'python' ? <Code className="w-3.5 h-3.5" /> : <Sigma className="w-3.5 h-3.5" />}
                          </span>
                          {labelCategory(c.id)}
                        </th>
                        {DIFFICULTY_ORDER.map((d) => (
                          <td key={d} className="py-3.5 px-2 text-right num text-fg-2">
                            {catalog ? c.difficulties[d] ?? 0 : '—'}
                          </td>
                        ))}
                        <td className="py-3.5 pl-4 text-right num font-medium text-fg">{catalog ? sum : '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              <p className="t-caption text-fg-3 mt-3">Counts are read live from the question bank. A quiz can be 1 to 50 questions.</p>
            </Section>

            {/* 02 · Scoring */}
            <Section id="scoring" n="02" title="Scoring" kicker="Marks per question">
              <p className="t-body text-fg-2 text-pretty">
                Marks scale with the tier, and a multiple-choice question is worth half of a typed answer at the same tier
                — recognising an answer is easier than producing it. Your percentage is your score over the total marks
                available in that quiz.
              </p>
              <table className="w-full mt-6 border-t border-line-strong">
                <thead>
                  <tr className="text-left">
                    <th scope="col" className="t-label text-fg-3 font-medium py-3 pr-4">Tier</th>
                    <th scope="col" className="t-label text-fg-3 font-medium py-3 px-2 text-right">Typed answer</th>
                    <th scope="col" className="t-label text-fg-3 font-medium py-3 pl-4 text-right">Multiple choice</th>
                  </tr>
                </thead>
                <tbody>
                  {MARKS.map(([tier, typed, mcq]) => (
                    <tr key={tier} className="border-t border-line">
                      <th scope="row" className="py-3.5 pr-4 text-left font-normal">
                        <Tier difficulty={tier} />
                      </th>
                      <td className="py-3.5 px-2 text-right num font-medium text-fg">{typed} marks</td>
                      <td className="py-3.5 pl-4 text-right num text-fg-2">{mcq} marks</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="t-caption text-fg-3 mt-3">
                Example: ten Medium typed questions are worth 40 marks; 30 correct marks is 75%.
              </p>
            </Section>

            {/* 03 · Validation */}
            <Section id="validation" n="03" title="Validation" kicker="How answers are checked">
              <p className="t-body text-fg-2 text-pretty">
                Every answer is compared by one rule set that gets stricter with the tier. The rule is shown under the
                answer box while you take the quiz, so there are no surprises.
              </p>
              <dl className="mt-6 border-t border-line-strong">
                {RULES.map(([k, v, hint]) => (
                  <div key={k} className="grid sm:grid-cols-[11rem_1fr] gap-1 sm:gap-6 py-4 border-b border-line">
                    <dt className="text-fg font-medium">{k}</dt>
                    <dd>
                      <p className="text-fg-2">{v}</p>
                      <p className="t-caption text-fg-3 mt-1 num">{hint}</p>
                    </dd>
                  </div>
                ))}
              </dl>
            </Section>

            {/* 04 · Where the scoring happens */}
            <Section id="server" n="04" title="Where the scoring happens">
              <p className="t-body text-fg-2 text-pretty">
                The browser never sees a correct answer. When you start a quiz the server chooses the questions at random
                and sends only the text and the options. When you finish, it checks your answers with the same scoring
                code as the original command-line quiz, saves the attempt, and returns the marked review.
              </p>
              <ol className="mt-6 border-t border-line-strong">
                {FLOW.map(([step, detail], i) => (
                  <li key={step} className="grid grid-cols-[2.5rem_1fr] gap-4 py-4 border-b border-line">
                    <span className="index pt-1">0{i + 1}</span>
                    <div>
                      <p className="text-fg font-medium">{step}</p>
                      <p className="text-fg-2 mt-1 text-pretty">{detail}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="t-caption text-fg-3 mt-3">Each quiz session is single-use and expires after two hours if it isn’t submitted.</p>
            </Section>

            {/* 05 · The name */}
            <Section id="name" n="05" title="Why “Nexus”">
              <p className="t-body text-fg-2 text-pretty">
                Knowledge isn’t a list you finish; it’s a network you build. Every question is a node, every correct answer a
                connection, and the Living Knowledge Network behind these pages is that idea made visible: quiet while
                you answer, lit where you’ve been.
              </p>
              <dl className="mt-6 grid sm:grid-cols-3 gap-x-8 gap-y-6 border-t border-line-strong pt-6">
                {[
                  ['Connection', 'Topics link together. Algebra feeds calculus; syntax feeds idioms. Mixed quizzes join the dots.'],
                  ['Intelligence', 'Marks follow difficulty and format, and one consistent rule set checks every answer.'],
                  ['Progression', 'Each attempt is a data point. Over time the trend matters more than any single score.'],
                ].map(([k, d]) => (
                  <div key={k}>
                    <dt className="t-h3 text-fg">{k}</dt>
                    <dd className="text-fg-2 mt-2 text-pretty">{d}</dd>
                  </div>
                ))}
              </dl>
            </Section>
          </div>
        </div>

        {/* ── Colophon + CTA ─────────────────────────────────────────── */}
        <Reveal>
          <footer className="mt-20 md:mt-24 border-t border-line-strong pt-8 grid md:grid-cols-[1fr_auto] gap-8 items-end">
            <div className="max-w-xl">
              <span className="eyebrow">Colophon</span>
              <p className="text-fg mt-3">
                Built by <span className="font-medium">Mayank Sarwal</span> as a personal product: a Python quiz engine first, then this interface
                on top of it, unchanged.
              </p>
              <p className="t-caption text-fg-3 mt-2">Paper and Ink themes · one green · Geist · the Living Knowledge Network.</p>
            </div>
            <Link to="/setup" className="btn-primary btn-lg group shrink-0">
              Start a quiz
              <ArrowRight className="arrow w-5 h-5" />
            </Link>
          </footer>
        </Reveal>
      </div>
    </div>
  )
}

/* ── pieces ────────────────────────────────────────────────────────── */

function Fact({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="py-6 px-4 first:pl-0 md:first:pl-0">
      <dt className="t-label text-fg-3">{label}</dt>
      <dd className="t-stat-sm text-fg mt-3 num">{value}</dd>
      {note && <dd className="t-caption text-fg-2 mt-2">{note}</dd>}
    </div>
  )
}

function Section({ id, n, title, kicker, children }: { id: string; n: string; title: string; kicker?: string; children: React.ReactNode }) {
  return (
    <Reveal>
      <section id={id} className="scroll-mt-24">
        <div className="flex items-center gap-3 mb-5">
          <span className="index">{n}</span>
          <span className="hairline flex-1" />
        </div>
        {kicker && <span className="eyebrow">{kicker}</span>}
        <h2 className={`t-section text-fg ${kicker ? 'mt-2' : ''}`}>{title}</h2>
        <div className="mt-5">{children}</div>
      </section>
    </Reveal>
  )
}

const SECTIONS = [
  { id: 'tests', n: '01', title: 'What it tests' },
  { id: 'scoring', n: '02', title: 'Scoring' },
  { id: 'validation', n: '03', title: 'Validation' },
  { id: 'server', n: '04', title: 'Where scoring happens' },
  { id: 'name', n: '05', title: 'Why “Nexus”' },
]

const PLACEHOLDER: CategoryInfo[] = [
  { id: 'maths', difficulties: {} },
  { id: 'python', difficulties: {} },
]

// quiz.py → get_marks(): easy 2 · medium 4 · hard 6, halved for mcq
const MARKS: [string, string, string][] = [
  ['easy', '2', '1'],
  ['medium', '4', '2'],
  ['hard', '6', '3'],
]

// quiz.py → rules_to_check_answer()
const RULES: [string, string, string][] = [
  ['Multiple choice', 'The option letter must match.', 'B = b · anything else is wrong'],
  ['Easy · typed', 'Case doesn’t matter.', 'def = DEF'],
  ['Medium · typed', 'Case doesn’t matter, and extra spaces are ignored.', 'x  =  1 = X = 1'],
  ['Hard · typed', 'Exact match. Spacing and case both count.', 'only leading and trailing spaces are trimmed'],
]

const FLOW: [string, string][] = [
  ['You choose', 'Region, tier and number of questions on the Setup page.'],
  ['The server picks', 'A random sample from the bank, sent without answers, inside a single-use session.'],
  ['You answer', 'Choose an option or type a response. You can move back and change anything until you finish.'],
  ['The server scores', 'Every answer is checked by the rules above, marks are added up, and the attempt is saved to your history.'],
]
