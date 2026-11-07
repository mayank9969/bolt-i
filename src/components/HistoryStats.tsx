import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import type { HistoryEntry } from '@/types/quiz'
import { formatPercent, labelCategory } from '@/lib/format'
import { normaliseCategoryId } from '@/lib/categories'
import { cttByDifficulty, irtReady, sittingSeries, sparseSubjects } from '@/lib/psychometrics'

const ease = [0.22, 1, 0.36, 1] as const

function pct01(x: number, digits = 0) {
  return formatPercent(x * 100, digits)
}

export default function HistoryStats({ history }: { history: HistoryEntry[] }) {
  if (!history.length) return null
  const series = sittingSeries(history)
  const ctt = cttByDifficulty(history)
  const irt = irtReady(history)
  const sparse = sparseSubjects(history, normaliseCategoryId)
  const d = series.describe
  const lastRoll = series.roll[series.roll.length - 1]

  return (
    <div className="mt-20 space-y-20">
      {d && (
        <Chapter
          kicker="The shape of your scores"
          title={
            <>
              Most sittings cluster around <span className="ed-hit">{formatPercent(d.median, 0)}</span>
            </>
          }
          meaning={
            <>
              The <span className="ed-soft">median</span> is the middle sitting — half of your scores sit below it.
              The <span className="ed-soft">mean</span> is pulled by extremes. The box is the middle half of your
              work; the whiskers are the lowest and highest sitting the engine stored.
            </>
          }
        >
          <RangePlot min={d.min} q1={d.q1} median={d.median} q3={d.q3} max={d.max} mean={d.mean} points={series.pct} />
          <p className="ed-prose mt-5 text-[1rem]">
            Spread (standard deviation) is {formatPercent(d.sd, 0)}. A large spread means sittings disagree with each
            other; a small one means you tend to land in the same place.
          </p>
        </Chapter>
      )}

      {lastRoll != null && series.pct.length > 1 && (
        <Chapter
          kicker="Recent form"
          title={
            <>
              The last five sittings average <span className="ed-hit">{formatPercent(lastRoll, 0)}</span>
            </>
          }
          meaning={
            <>
              Each point is a sitting. The smoother line is a <span className="ed-soft">rolling mean</span> of the last
              five, so one bad paper does not rewrite the whole story.
            </>
          }
        >
          <Spark series={series.pct} roll={series.roll} attempts={series.chronological.map((h) => h.attempt)} />
        </Chapter>
      )}

      {series.wilson && (
        <Chapter
          kicker="How sure this is"
          title={
            <>
              True accuracy likely sits between{' '}
              <span className="ed-hit">
                {pct01(series.wilson.lo)} and {pct01(series.wilson.hi)}
              </span>
            </>
          }
          meaning={
            <>
              You answered {series.correct} of {series.total} items correctly ({pct01(series.wilson.p)}). A{' '}
              <span className="ed-soft">Wilson interval</span> is a cautious band around that rate: if you kept working
              in the same way, the long-run share of correct answers would usually fall inside it. Narrower as you
              answer more.
            </>
          }
        >
          <IntervalBar lo={series.wilson.lo} hi={series.wilson.hi} p={series.wilson.p} />
        </Chapter>
      )}

      {sparse.length > 0 && (
        <Chapter
          kicker="Thin subjects"
          title={
            <>
              Where the sample is small, we <span className="ed-hit">lean toward the middle</span>
            </>
          }
          meaning={
            <>
              Raw accuracy on two sittings can look like a verdict. A{' '}
              <span className="ed-soft">Bayesian (Laplace) smooth</span> pulls a thin subject toward 50% until you have
              more questions. Each subject is a dumbbell: raw accuracy on the left, smoothed on the right.
            </>
          }
        >
          <div className="space-y-6">
            {sparse.map((s) => (
              <SubjectBars key={s.id} name={labelCategory(s.id)} raw={s.raw} smooth={s.smoothed} sparse={s.sparse} />
            ))}
          </div>
        </Chapter>
      )}

      <Chapter
        kicker="Easy and hard papers"
        title={
          <>
            How often you were right, and whether the band <span className="ed-hit">separates</span> strong and weak
            sittings
          </>
        }
        meaning={
          <>
            In Classical Test Theory, <span className="ed-soft">p</span> is how often that difficulty was answered
            correctly (higher means easier for you). <span className="ed-soft">Discrimination</span> is the gap between
            your stronger and weaker sittings in that band. It only appears after four sittings so it is not a fluke.
            Mixed papers are left out.
          </>
        }
      >
        {ctt.length ? (
          <div className="space-y-8">
            {ctt.map((b) => (
              <CttRow key={b.difficulty} {...b} />
            ))}
          </div>
        ) : (
          <p className="ed-prose">No easy, medium, or hard sittings to index yet.</p>
        )}
        <p className="ed-prose mt-8 text-[1rem]">{irt.reason}</p>
      </Chapter>
    </div>
  )
}

function Chapter({
  kicker,
  title,
  meaning,
  children,
}: {
  kicker: string
  title: ReactNode
  meaning: ReactNode
  children: ReactNode
}) {
  return (
    <motion.section
      className="grid lg:grid-cols-12 gap-x-12 gap-y-8 border-t border-line-strong pt-10"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.55, ease }}
    >
      <div className="lg:col-span-5">
        <p className="ed-eyebrow">{kicker}</p>
        <h2 className="ed-kicker mt-4">{title}</h2>
        <p className="ed-prose mt-4">{meaning}</p>
      </div>
      <div className="lg:col-span-7">{children}</div>
    </motion.section>
  )
}

function RangePlot({
  min,
  q1,
  median,
  q3,
  max,
  mean,
  points,
}: {
  min: number
  q1: number
  median: number
  q3: number
  max: number
  mean: number
  points: number[]
}) {
  const x = (v: number) => 28 + (Math.min(100, Math.max(0, v)) / 100) * 250
  const y = 36
  const jitter = (i: number) => y - 18 + ((i * 17) % 12)
  return (
    <svg viewBox="0 0 300 72" className="w-full h-auto" role="img" aria-label="Box plot of sitting percentages from 0 to 100">
      {[0, 25, 50, 75, 100].map((t) => (
        <g key={t}>
          <line x1={x(t)} x2={x(t)} y1="8" y2="58" stroke="var(--nx-line)" strokeWidth="0.6" />
          <text x={x(t)} y="70" textAnchor="middle" fontSize="9" fill="var(--nx-text-3)">
            {t}%
          </text>
        </g>
      ))}
      <line x1={x(min)} x2={x(q1)} y1={y} y2={y} stroke="var(--nx-text)" strokeWidth="1.6" />
      <line x1={x(q3)} x2={x(max)} y1={y} y2={y} stroke="var(--nx-text)" strokeWidth="1.6" />
      <line x1={x(min)} x2={x(min)} y1={y - 7} y2={y + 7} stroke="var(--nx-text)" strokeWidth="1.6" />
      <line x1={x(max)} x2={x(max)} y1={y - 7} y2={y + 7} stroke="var(--nx-text)" strokeWidth="1.6" />
      <rect x={x(q1)} y={y - 14} width={Math.max(2, x(q3) - x(q1))} height="28" fill="var(--nx-accent)" fillOpacity="0.25" stroke="var(--nx-accent)" strokeWidth="1.4" />
      <line x1={x(median)} x2={x(median)} y1={y - 14} y2={y + 14} stroke="var(--nx-text)" strokeWidth="2.2" />
      <polygon points={`${x(mean)},${y - 6} ${x(mean) + 5},${y} ${x(mean)},${y + 6} ${x(mean) - 5},${y}`} fill="var(--nx-text)" />
      {points.map((p, i) => (
        <circle key={i} cx={x(p)} cy={jitter(i)} r="2.4" fill="var(--nx-text)" fillOpacity="0.45" />
      ))}
      <text x="4" y="32" fontSize="8" fill="var(--nx-text-3)">
        box
      </text>
      <text x="4" y="42" fontSize="8" fill="var(--nx-text-3)">
        plot
      </text>
    </svg>
  )
}

function Spark({ series, roll, attempts }: { series: number[]; roll: number[]; attempts: number[] }) {
  const w = 340
  const h = 160
  const pad = { l: 28, r: 8, t: 12, b: 24 }
  const n = series.length
  const X = (i: number) => pad.l + (n <= 1 ? 0 : (i / (n - 1)) * (w - pad.l - pad.r))
  const Y = (v: number) => pad.t + (1 - Math.min(100, Math.max(0, v)) / 100) * (h - pad.t - pad.b)
  const poly = (arr: number[]) => arr.map((v, i) => `${i === 0 ? 'M' : 'L'}${X(i)} ${Y(v)}`).join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto" role="img" aria-label="Sitting scores and five-sitting rolling mean">
      {[0, 50, 100].map((t) => (
        <g key={t}>
          <line x1={pad.l} x2={w - pad.r} y1={Y(t)} y2={Y(t)} stroke="var(--nx-line)" />
          <text x={pad.l - 4} y={Y(t) + 3} textAnchor="end" fontSize="9" fill="var(--nx-text-3)">
            {t}
          </text>
        </g>
      ))}
      <path d={poly(series)} fill="none" stroke="var(--nx-text-3)" strokeWidth="1.5" />
      <path d={poly(roll)} fill="none" stroke="var(--nx-accent)" strokeWidth="2.4" />
      {series.map((v, i) => (
        <circle key={i} cx={X(i)} cy={Y(v)} r="3.2" fill="var(--nx-canvas)" stroke="var(--nx-text)" strokeWidth="1.4" />
      ))}
      {attempts.map((a, i) =>
        i % Math.ceil(n / 6) === 0 || i === n - 1 ? (
          <text key={a} x={X(i)} y={h - 6} textAnchor="middle" fontSize="9" fill="var(--nx-text-3)">
            #{a}
          </text>
        ) : null,
      )}
      <text x={pad.l} y="10" fontSize="9" fill="var(--nx-text-3)">
        grey: sitting · teal: rolling mean of 5
      </text>
    </svg>
  )
}

function IntervalBar({ lo, hi, p }: { lo: number; hi: number; p: number }) {
  const x = (v: number) => 28 + v * 250
  const y = 28
  return (
    <svg viewBox="0 0 300 56" className="w-full h-auto" role="img" aria-label="95 percent Wilson confidence interval">
      {[0, 25, 50, 75, 100].map((t) => (
        <g key={t}>
          <line x1={x(t / 100)} x2={x(t / 100)} y1="10" y2="42" stroke="var(--nx-line)" />
          <text x={x(t / 100)} y="54" textAnchor="middle" fontSize="9" fill="var(--nx-text-3)">
            {t}%
          </text>
        </g>
      ))}
      <line x1={x(lo)} x2={x(hi)} y1={y} y2={y} stroke="var(--nx-accent)" strokeWidth="4" />
      <line x1={x(lo)} x2={x(lo)} y1={y - 8} y2={y + 8} stroke="var(--nx-accent)" strokeWidth="2" />
      <line x1={x(hi)} x2={x(hi)} y1={y - 8} y2={y + 8} stroke="var(--nx-accent)" strokeWidth="2" />
      <rect x={x(p) - 5} y={y - 5} width="10" height="10" fill="var(--nx-text)" />
      <text x={x(p)} y="14" textAnchor="middle" fontSize="10" fill="var(--nx-text)">
        {Math.round(p * 100)}% observed
      </text>
    </svg>
  )
}

function SubjectBars({ name, raw, smooth, sparse }: { name: string; raw: number; smooth: number; sparse: boolean }) {
  const x = (v: number) => 8 + v * 220
  const y = 22
  return (
    <div>
      <p className="ed-kicker" style={{ fontSize: '1.15rem', marginBottom: '0.2rem' }}>
        {name}
        {sparse ? <span className="ed-soft"> · still thin</span> : null}
      </p>
      <svg viewBox="0 0 280 40" className="w-full h-auto" role="img" aria-label={`${name} raw versus smoothed accuracy`}>
        <line x1="8" x2="228" y1={y} y2={y} stroke="var(--nx-line)" />
        <line x1={x(raw)} x2={x(smooth)} y1={y} y2={y} stroke="var(--nx-text)" strokeWidth="2" />
        <circle cx={x(raw)} cy={y} r="5" fill="var(--nx-text)" />
        <circle cx={x(smooth)} cy={y} r="5" fill="var(--nx-accent)" />
        <text x={x(raw)} y="12" textAnchor="middle" fontSize="9" fill="var(--nx-text-3)">
          raw {pct01(raw)}
        </text>
        <text x={x(smooth)} y="38" textAnchor="middle" fontSize="9" fill="var(--nx-text-3)">
          smooth {pct01(smooth)}
        </text>
      </svg>
    </div>
  )
}

function CttRow({
  difficulty,
  n,
  p,
  discrimination,
}: {
  difficulty: string
  n: number
  p: number
  discrimination: number | null
}) {
  return (
    <div>
      <p className="ed-kicker capitalize" style={{ fontSize: '1.2rem' }}>
        {difficulty}
      </p>
      <p className="ed-prose text-[1rem] mt-1 mb-3">
        You were right {pct01(p)} of the time across {n} sitting{n === 1 ? '' : 's'}.
        {discrimination == null
          ? ' Discrimination waits until there are four sittings in this band.'
          : ` Stronger sittings outscored weaker ones by ${(discrimination * 100).toFixed(0)} points here.`}
      </p>
      <div className="grid grid-cols-2 gap-6 mt-3">
        <div>
          <p className="t-caption text-fg-3 mb-1">Difficulty p (share correct)</p>
          <div className="h-3 rounded-sm bg-line overflow-hidden">
            <div className="h-full bg-accent" style={{ width: `${p * 100}%` }} />
          </div>
          <p className="num text-sm mt-1">{pct01(p)}</p>
        </div>
        <div>
          <p className="t-caption text-fg-3 mb-1">Discrimination D</p>
          {discrimination == null ? (
            <p className="text-sm text-fg-2">Need 4 sittings</p>
          ) : (
            <>
              <div className="h-3 rounded-sm bg-line overflow-hidden">
                <div className="h-full bg-fg" style={{ width: `${Math.min(100, Math.abs(discrimination) * 100)}%` }} />
              </div>
              <p className="num text-sm mt-1">{discrimination.toFixed(2)}</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
