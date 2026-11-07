import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import type { HistoryEntry } from '@/types/quiz'
import { formatPercent, labelCategory } from '@/lib/format'
import { normaliseCategoryId } from '@/lib/categories'
import { cttByDifficulty, irtReady, sittingSeries, sparseSubjects } from '@/lib/psychometrics'

const ease = [0.22, 1, 0.36, 1] as const

function spline(pts: [number, number][]) {
  if (!pts.length) return ''
  if (pts.length === 1) return `M${pts[0][0]} ${pts[0][1]}`
  let d = `M${pts[0][0].toFixed(2)} ${pts[0][1].toFixed(2)}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[Math.min(pts.length - 1, i + 2)]
    const c1x = p1[0] + (p2[0] - p0[0]) / 6
    const c1y = p1[1] + (p2[1] - p0[1]) / 6
    const c2x = p2[0] - (p3[0] - p1[0]) / 6
    const c2y = p2[1] - (p3[1] - p1[1]) / 6
    d += ` C${c1x.toFixed(2)} ${c1y.toFixed(2)} ${c2x.toFixed(2)} ${c2y.toFixed(2)} ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`
  }
  return d
}

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
  const x = (v: number) => 10 + (Math.min(100, Math.max(0, v)) / 100) * 80
  const box = spline([
    [x(q1), 22],
    [x(q1) + 1.2, 8],
    [x((q1 + q3) / 2), 6],
    [x(q3) - 1.2, 8],
    [x(q3), 22],
    [x(q3) - 1.2, 36],
    [x((q1 + q3) / 2), 38],
    [x(q1) + 1.2, 36],
    [x(q1), 22],
  ])
  return (
    <svg viewBox="0 0 100 52" className="w-full h-auto" aria-hidden="true">
      <path d={`M${x(min)} 22 C${x(min)} 18, ${x(q1)} 16, ${x(q1)} 22`} fill="none" stroke="var(--nx-text)" strokeWidth="0.7" />
      <path d={`M${x(q3)} 22 C${x(q3)} 16, ${x(max)} 18, ${x(max)} 22`} fill="none" stroke="var(--nx-text)" strokeWidth="0.7" />
      <motion.path
        d={box}
        fill="var(--nx-accent)"
        fillOpacity={0.22}
        stroke="var(--nx-accent)"
        strokeWidth="0.5"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      />
      <motion.line
        x1={x(median)}
        x2={x(median)}
        y1="8"
        y2="36"
        stroke="var(--nx-text)"
        strokeWidth="1.4"
        initial={{ scaleY: 0 }}
        whileInView={{ scaleY: 1 }}
        viewport={{ once: true }}
        style={{ transformOrigin: `${x(median)}px 22px` }}
      />
      <motion.circle cx={x(mean)} cy="22" r="2.4" fill="var(--nx-text)" initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.4, type: 'spring' }} />
      <text x={x(median)} y="48" textAnchor="middle" fontSize="3.4" fill="var(--nx-text-3)">
        median {Math.round(median)}
      </text>
      <text x={x(mean)} y="5" textAnchor="middle" fontSize="3.4" fill="var(--nx-text-3)">
        mean {Math.round(mean)}
      </text>
    </svg>
  )
}

function Spark({ series, roll }: { series: number[]; roll: number[] }) {
  const w = 320
  const h = 110
  const n = series.length
  const X = (i: number) => (n <= 1 ? w / 2 : (i / (n - 1)) * w)
  const Y = (v: number) => h - 18 - (Math.min(100, Math.max(0, v)) / 100) * (h - 28)
  const rawPts: [number, number][] = series.map((v, i) => [X(i), Y(v)])
  const rollPts: [number, number][] = roll.map((v, i) => [X(i), Y(v)])
  const area = `${spline(rollPts)} L ${X(n - 1)} ${h - 14} L 0 ${h - 14} Z`
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto overflow-visible" aria-hidden="true">
      <path d={`M0 ${Y(50)} C ${w * 0.3} ${Y(50) - 2}, ${w * 0.7} ${Y(50) + 2}, ${w} ${Y(50)}`} fill="none" stroke="var(--nx-line)" strokeDasharray="4 6" />
      <motion.path d={area} fill="var(--nx-accent)" fillOpacity={0.12} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} />
      <motion.path
        d={spline(rawPts)}
        fill="none"
        stroke="var(--nx-text-3)"
        strokeWidth="1.6"
        strokeLinecap="round"
        pathLength={1}
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.3, ease }}
      />
      <motion.path
        d={spline(rollPts)}
        fill="none"
        stroke="var(--nx-accent)"
        strokeWidth="3"
        strokeLinecap="round"
        pathLength={1}
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.5, delay: 0.1, ease }}
      />
      {rawPts.map((p, i) => (
        <motion.circle
          key={i}
          cx={p[0]}
          cy={p[1]}
          r="3"
          fill="var(--nx-canvas)"
          stroke="var(--nx-text)"
          strokeWidth="1.2"
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 + i * 0.04, type: 'spring', stiffness: 300, damping: 16 }}
        />
      ))}
    </svg>
  )
}

function IntervalBar({ lo, hi, p }: { lo: number; hi: number; p: number }) {
  const x = (v: number) => 8 + v * 84
  const hill = spline([
    [x(Math.max(0, lo - 0.08)), 34],
    [x(lo), 22],
    [x(p), 10],
    [x(hi), 22],
    [x(Math.min(1, hi + 0.08)), 34],
  ])
  return (
    <svg viewBox="0 0 100 48" className="w-full h-auto" aria-hidden="true">
      <line x1="8" x2="92" y1="34" y2="34" stroke="var(--nx-line-strong)" strokeWidth="0.4" />
      <motion.path
        d={`${hill} L ${x(Math.min(1, hi + 0.08))} 34 L ${x(Math.max(0, lo - 0.08))} 34 Z`}
        fill="var(--nx-accent)"
        fillOpacity={0.28}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      />
      <motion.path
        d={hill}
        fill="none"
        stroke="var(--nx-accent)"
        strokeWidth="1.4"
        pathLength={1}
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.1, ease }}
      />
      <circle cx={x(p)} cy="10" r="2.2" fill="var(--nx-text)" />
      <text x={x(lo)} y="44" textAnchor="middle" fontSize="3.6" fill="var(--nx-text-3)">
        {Math.round(lo * 100)}%
      </text>
      <text x={x(p)} y="6" textAnchor="middle" fontSize="3.6" fill="var(--nx-text)">
        {Math.round(p * 100)}%
      </text>
      <text x={x(hi)} y="44" textAnchor="middle" fontSize="3.6" fill="var(--nx-text-3)">
        {Math.round(hi * 100)}%
      </text>
    </svg>
  )
}

function SubjectBars({ name, raw, smooth, sparse }: { name: string; raw: number; smooth: number; sparse: boolean }) {
  const w = 200
  const h = 56
  const peak = (v: number) => 48 - v * 36
  const rawC = spline([
    [0, 48],
    [w * 0.35, peak(raw) + 6],
    [w * 0.55, peak(raw)],
    [w, 48],
  ])
  const smC = spline([
    [0, 48],
    [w * 0.4, peak(smooth) + 4],
    [w * 0.62, peak(smooth)],
    [w, 48],
  ])
  return (
    <div>
      <p className="ed-kicker" style={{ fontSize: '1.15rem', marginBottom: '0.35rem' }}>
        {name}
        {sparse ? <span className="ed-soft"> · still thin</span> : null}
      </p>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto" aria-hidden="true">
        <motion.path d={`${rawC} L ${w} 48 L 0 48 Z`} fill="var(--nx-text)" fillOpacity={0.12} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} />
        <motion.path
          d={`${smC} L ${w} 48 L 0 48 Z`}
          fill="var(--nx-accent)"
          fillOpacity={0.35}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.12 }}
        />
        <motion.path d={smC} fill="none" stroke="var(--nx-accent)" strokeWidth="2" pathLength={1} initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1.1, ease }} />
        <text x="4" y="12" fontSize="9" fill="var(--nx-text-3)">
          raw {pct01(raw)} · smooth {pct01(smooth)}
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
      <svg viewBox="0 0 200 40" className="w-full h-auto" aria-hidden="true">
        <motion.path
          d={spline([
            [0, 36],
            [40, 36 - p * 22],
            [110, 36 - p * 28],
            [200, 36],
          ]) + ' L 200 36 L 0 36 Z'}
          fill="var(--nx-accent)"
          fillOpacity={0.3}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        />
        <motion.path
          d={spline([
            [0, 36],
            [40, 36 - p * 22],
            [110, 36 - p * 28],
            [200, 36],
          ])}
          fill="none"
          stroke="var(--nx-accent)"
          strokeWidth="2"
          pathLength={1}
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.15, ease }}
        />
      </svg>
    </div>
  )
}
