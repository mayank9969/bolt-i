import { motion } from 'framer-motion'
import type { HistoryEntry } from '@/types/quiz'
import { formatPercent, labelCategory } from '@/lib/format'
import { normaliseCategoryId } from '@/lib/categories'
import { cttByDifficulty, irtReady, sittingSeries, sparseSubjects } from '@/lib/psychometrics'

function pct01(x: number, digits = 1) {
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
    <div className="mt-16 space-y-16">
      <section className="grid lg:grid-cols-12 gap-x-10 gap-y-6">
        <div className="lg:col-span-4">
          <span className="index">Stats</span>
          <h2 className="ed-kicker" style={{ fontFamily: 'var(--ed-display)', fontSize: 'clamp(1.4rem,2.2vw,1.8rem)' }}>
            How the record is read
          </h2>
          <p className="text-sm text-fg-2 mt-3 max-w-sm text-pretty">
            Descriptive summaries, a five-sitting rolling mean, Wilson intervals, and Bayesian smoothing on thin
            subjects. Today’s Take is not in this ledger.
          </p>
        </div>
        <motion.div
          className="lg:col-span-8 grid sm:grid-cols-2 gap-x-8 gap-y-6 border-t border-line pt-6"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          {d && (
            <dl className="space-y-2 text-sm">
              <dt className="figcap">Descriptive (percentages)</dt>
              <dd className="text-fg num">
                mean {formatPercent(d.mean, 1)} · sd {formatPercent(d.sd, 1)}
              </dd>
              <dd className="text-fg-2 num">
                median {formatPercent(d.median, 1)} · IQR {formatPercent(d.q1, 1)}–{formatPercent(d.q3, 1)}
              </dd>
              <dd className="text-fg-2 num">
                min {formatPercent(d.min, 1)} · max {formatPercent(d.max, 1)}
              </dd>
            </dl>
          )}
          <dl className="space-y-2 text-sm">
            <dt className="figcap">Rolling average (last 5 sittings)</dt>
            <dd className="text-fg num">{lastRoll != null ? formatPercent(lastRoll, 1) : '—'}</dd>
            {series.wilson && (
              <>
                <dt className="figcap mt-4">Wilson 95% interval (all items answered)</dt>
                <dd className="text-fg num">
                  {pct01(series.wilson.p)} ({pct01(series.wilson.lo)} – {pct01(series.wilson.hi)})
                </dd>
                <dd className="text-fg-3 t-caption">
                  {series.correct} / {series.total} correct
                </dd>
              </>
            )}
            {series.bayesOverall != null && (
              <>
                <dt className="figcap mt-4">Bayesian overall (Beta(1,1))</dt>
                <dd className="text-fg num">{pct01(series.bayesOverall)}</dd>
              </>
            )}
          </dl>
        </motion.div>
      </section>

      {sparse.length > 0 && (
        <section className="grid lg:grid-cols-12 gap-x-10 gap-y-6">
          <div className="lg:col-span-4">
            <span className="index">Sparse subjects</span>
            <h2 className="ed-kicker" style={{ fontFamily: 'var(--ed-display)', fontSize: 'clamp(1.4rem,2.2vw,1.8rem)' }}>
              Smoothed where the sample is thin
            </h2>
            <p className="text-sm text-fg-2 mt-3 max-w-sm">
              Raw accuracy is shown beside a Laplace-smoothed rate. Sparse rows (fewer than four sittings or twenty
              questions) lean on the prior so a single sitting cannot dominate.
            </p>
          </div>
          <ul className="lg:col-span-8 border-t border-line">
            {sparse.map((s) => (
              <li key={s.id} className="grid grid-cols-[1fr_auto_auto] gap-4 py-3 border-b border-line text-sm">
                <span className="text-fg">
                  {labelCategory(s.id)}
                  {s.sparse && <span className="ml-2 figcap">sparse</span>}
                </span>
                <span className="num text-fg-2">raw {pct01(s.raw)}</span>
                <span className="num text-fg">smooth {pct01(s.smoothed)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="grid lg:grid-cols-12 gap-x-10 gap-y-6">
        <div className="lg:col-span-4">
          <span className="index">CTT</span>
          <h2 className="ed-kicker" style={{ fontFamily: 'var(--ed-display)', fontSize: 'clamp(1.4rem,2.2vw,1.8rem)' }}>
            Difficulty and discrimination
          </h2>
          <p className="text-sm text-fg-2 mt-3 max-w-sm">
            Classical Test Theory on the engine’s difficulty labels. p is proportion correct. Discrimination is the
            upper–lower gap when a band has at least four sittings. Mixed papers are omitted from these bands.
          </p>
        </div>
        <div className="lg:col-span-8">
          {ctt.length ? (
            <ul className="border-t border-line">
              {ctt.map((b) => (
                <li key={b.difficulty} className="grid grid-cols-[7rem_1fr_auto] gap-4 py-3 border-b border-line text-sm">
                  <span className="text-fg capitalize">{b.difficulty}</span>
                  <span className="num text-fg-2">
                    p {pct01(b.p)} · {b.n} sitting{b.n === 1 ? '' : 's'}
                  </span>
                  <span className="num text-fg">
                    {b.discrimination == null ? 'D —' : `D ${b.discrimination.toFixed(2)}`}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-fg-2 text-sm border-t border-line pt-4">
              No easy / medium / hard sittings to index yet.
            </p>
          )}
          <p className="t-caption text-fg-3 mt-6 max-w-prose">{irt.reason}</p>
        </div>
      </section>
    </div>
  )
}
