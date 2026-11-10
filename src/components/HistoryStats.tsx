import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import type { HistoryEntry } from '@/types/quiz'
import { formatPercent } from '@/lib/format'
import { cttByDifficulty, irtReady, sittingSeries } from '@/lib/psychometrics'

const ease = [0.22, 1, 0.36, 1] as const

function pct01(x: number, digits = 0) {
  return formatPercent(x * 100, digits)
}

export default function HistoryStats({ history }: { history: HistoryEntry[] }) {
  if (!history.length) return null
  const series = sittingSeries(history)
  const ctt = cttByDifficulty(history)
  const irt = irtReady(history)
  const d = series.describe
  return (
    <div className="mt-16 space-y-12">
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
              Each mark is one quiz. The teal band is where the <span className="ed-soft">middle half</span> of your
              scores sit. The labeled line is the <span className="ed-soft">median</span> — the middle sitting.
            </>
          }
        >
          <RangePlot q1={d.q1} median={d.median} q3={d.q3} points={series.pct} />
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
  q1,
  median,
  q3,
  points,
}: {
  q1: number
  median: number
  q3: number
  points: number[]
}) {
  const x = (v: number) => 20 + (Math.min(100, Math.max(0, v)) / 100) * 300
  const bins = new Map<number, number>()
  const laid = points.map((p) => {
    const key = Math.round(p / 4)
    const n = bins.get(key) ?? 0
    bins.set(key, n + 1)
    const stack = n % 2 === 0 ? n / 2 : -Math.ceil(n / 2)
    return { p, cy: 50 + stack * 12 }
  })
  const midX = x(median)
  const midAnchor = median > 82 ? 'end' : median < 18 ? 'start' : 'middle'

  return (
    <div>
      <svg viewBox="0 0 340 100" className="w-full h-auto" role="img" aria-label="Each sitting on a 0 to 100 percent line">
        <rect
          x={x(q1)}
          y="26"
          width={Math.max(6, x(q3) - x(q1))}
          height="48"
          fill="var(--nx-accent)"
          fillOpacity="0.16"
          rx="4"
        />
        <line x1="20" x2="320" y1="50" y2="50" stroke="var(--nx-line-strong)" strokeWidth="1.2" />
        {laid.map((pt, i) => (
          <circle
            key={i}
            cx={x(pt.p)}
            cy={pt.cy}
            r="5.5"
            fill="var(--nx-canvas)"
            stroke="var(--nx-text)"
            strokeWidth="1.7"
          />
        ))}
        <line x1={midX} x2={midX} y1="20" y2="80" stroke="var(--nx-accent)" strokeWidth="2.5" />
        <text x={midX} y="14" textAnchor={midAnchor} fontSize="11" fontWeight="600" fill="var(--nx-text)">
          middle {Math.round(median)}%
        </text>
        {[0, 50, 100].map((t) => (
          <text key={t} x={x(t)} y="96" textAnchor="middle" fontSize="11" fill="var(--nx-text-3)">
            {t}%
          </text>
        ))}
      </svg>
      <p className="t-caption text-fg-3 mt-2">Teal band = typical half of sittings</p>
    </div>
  )
}

function IntervalBar({ lo, hi, p }: { lo: number; hi: number; p: number }) {
  const x = (v: number) => 28 + v * 250
  const y = 36
  const pAnchor = p > 0.82 ? 'end' : p < 0.18 ? 'start' : 'middle'
  return (
    <svg viewBox="0 0 300 72" className="w-full h-auto" role="img" aria-label="95 percent Wilson confidence interval">
      {[0, 50, 100].map((t) => (
        <g key={t}>
          <line x1={x(t / 100)} x2={x(t / 100)} y1="18" y2="54" stroke="var(--nx-line)" />
          <text x={x(t / 100)} y="68" textAnchor="middle" fontSize="10" fill="var(--nx-text-3)">
            {t}%
          </text>
        </g>
      ))}
      <line x1={x(lo)} x2={x(hi)} y1={y} y2={y} stroke="var(--nx-accent)" strokeWidth="5" strokeLinecap="round" />
      <line x1={x(lo)} x2={x(lo)} y1={y - 9} y2={y + 9} stroke="var(--nx-accent)" strokeWidth="2" />
      <line x1={x(hi)} x2={x(hi)} y1={y - 9} y2={y + 9} stroke="var(--nx-accent)" strokeWidth="2" />
      <rect x={x(p) - 5} y={y - 5} width="10" height="10" fill="var(--nx-text)" />
      <text x={x(p)} y="14" textAnchor={pAnchor} fontSize="11" fontWeight="600" fill="var(--nx-text)">
        {Math.round(p * 100)}% observed
      </text>
    </svg>
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
    <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45, ease }}>
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
            <motion.div
              className="h-full bg-accent origin-left"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, ease }}
              style={{ width: `${p * 100}%` }}
            />
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
                <motion.div
                  className="h-full bg-fg origin-left"
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.9, delay: 0.12, ease }}
                  style={{ width: `${Math.min(100, Math.abs(discrimination) * 100)}%` }}
                />
              </div>
              <p className="num text-sm mt-1">{discrimination.toFixed(2)}</p>
            </>
          )}
        </div>
      </div>
    </motion.div>
  )
}
