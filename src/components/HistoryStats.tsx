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
          <RangePlot min={d.min} q1={d.q1} median={d.median} q3={d.q3} max={d.max} mean={d.mean} />
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
          <Spark series={series.pct} roll={series.roll} />
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
              more questions. The filled bar is the smoothed rate; the outline is the raw one.
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
}: {
  min: number
  q1: number
  median: number
  q3: number
  max: number
  mean: number
}) {
  const x = (v: number) => 8 + (Math.min(100, Math.max(0, v)) / 100) * 84
  return (
    <svg viewBox="0 0 100 36" className="w-full h-auto" aria-hidden="true">
      <line x1="8" x2="92" y1="18" y2="18" stroke="var(--nx-line-strong)" strokeWidth="0.4" />
      {[0, 50, 100].map((t) => (
        <text key={t} x={x(t)} y="34" textAnchor="middle" fontSize="4" fill="var(--nx-text-3)">
          {t}
        </text>
      ))}
      <motion.line
        x1={x(min)}
        x2={x(max)}
        y1="18"
        y2="18"
        stroke="var(--nx-text)"
        strokeWidth="0.6"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease }}
      />
      <motion.rect
        x={x(q1)}
        y="10"
        width={Math.max(0.8, x(q3) - x(q1))}
        height="16"
        fill="var(--nx-accent)"
        opacity={0.28}
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        style={{ transformOrigin: `${x(q1)}px 18px` }}
        transition={{ duration: 0.9, delay: 0.15, ease }}
      />
      <motion.line
        x1={x(median)}
        x2={x(median)}
        y1="10"
        y2="26"
        stroke="var(--nx-text)"
        strokeWidth="1.2"
        initial={{ scaleY: 0 }}
        whileInView={{ scaleY: 1 }}
        viewport={{ once: true }}
        style={{ transformOrigin: `${x(median)}px 18px` }}
        transition={{ delay: 0.35, duration: 0.4 }}
      />
      <motion.circle
        cx={x(mean)}
        cy="18"
        r="2.2"
        fill="var(--nx-accent-2, var(--nx-accent))"
        initial={{ scale: 0 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 300, damping: 16 }}
      />
    </svg>
  )
}

function Spark({ series, roll }: { series: number[]; roll: number[] }) {
  const w = 320
  const h = 88
  const n = series.length
  const X = (i: number) => (n <= 1 ? w / 2 : (i / (n - 1)) * w)
  const Y = (v: number) => h - (Math.min(100, Math.max(0, v)) / 100) * (h - 8) - 4
  const line = (arr: number[]) => arr.map((v, i) => `${i === 0 ? 'M' : 'L'} ${X(i)} ${Y(v)}`).join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto" aria-hidden="true">
      <line x1="0" x2={w} y1={Y(50)} y2={Y(50)} stroke="var(--nx-line)" strokeDasharray="3 4" />
      <motion.path
        d={line(series)}
        fill="none"
        stroke="var(--nx-line-strong)"
        strokeWidth="1.5"
        pathLength={1}
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.1, ease }}
      />
      <motion.path
        d={line(roll)}
        fill="none"
        stroke="var(--nx-accent)"
        strokeWidth="2.4"
        strokeLinecap="round"
        pathLength={1}
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.3, delay: 0.15, ease }}
      />
    </svg>
  )
}

function IntervalBar({ lo, hi, p }: { lo: number; hi: number; p: number }) {
  const x = (v: number) => 4 + v * 92
  return (
    <svg viewBox="0 0 100 28" className="w-full h-auto" aria-hidden="true">
      <rect x="4" y="11" width="92" height="6" rx="3" fill="var(--nx-line)" />
      <motion.rect
        x={x(lo)}
        y="11"
        width={Math.max(1, x(hi) - x(lo))}
        height="6"
        rx="3"
        fill="var(--nx-accent)"
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        style={{ transformOrigin: `${x(lo)}px 14px` }}
        transition={{ duration: 0.9, ease }}
      />
      <motion.circle
        cx={x(p)}
        cy="14"
        r="3.4"
        fill="var(--nx-text)"
        initial={{ scale: 0 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.4, type: 'spring', stiffness: 320, damping: 14 }}
      />
      <text x="4" y="26" fontSize="4" fill="var(--nx-text-3)">
        0%
      </text>
      <text x="96" y="26" fontSize="4" textAnchor="end" fill="var(--nx-text-3)">
        100%
      </text>
    </svg>
  )
}

function SubjectBars({ name, raw, smooth, sparse }: { name: string; raw: number; smooth: number; sparse: boolean }) {
  return (
    <div>
      <p className="ed-kicker" style={{ fontSize: '1.15rem', marginBottom: '0.4rem' }}>
        {name}
        {sparse ? <span className="ed-soft"> · still thin</span> : null}
      </p>
      <div className="space-y-2">
        <Bar label="Raw" value={raw} tone="line" />
        <Bar label="Smoothed" value={smooth} tone="accent" />
      </div>
    </div>
  )
}

function Bar({ label, value, tone }: { label: string; value: number; tone: 'line' | 'accent' }) {
  return (
    <div className="flex items-center gap-3">
      <span className="t-caption w-20 text-fg-3">{label}</span>
      <div className="flex-1 h-2 rounded-full track overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: tone === 'accent' ? 'var(--nx-accent)' : 'var(--nx-text)' }}
          initial={{ width: 0 }}
          whileInView={{ width: `${Math.min(100, value * 100)}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease }}
        />
      </div>
      <span className="num t-caption w-12 text-right text-fg">{pct01(value)}</span>
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
      <div className="h-2 rounded-full track overflow-hidden">
        <motion.div
          className="h-full rounded-full fill"
          initial={{ width: 0 }}
          whileInView={{ width: `${p * 100}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease }}
        />
      </div>
    </div>
  )
}
