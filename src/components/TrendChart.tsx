import { useState } from 'react'
import { motion } from 'framer-motion'
import type { HistoryEntry } from '@/types/quiz'
import { formatPercent, labelCategory } from '@/lib/format'

interface TrendChartProps {
  history: HistoryEntry[] // oldest → newest
}

export default function TrendChart({ history }: TrendChartProps) {
  const [hover, setHover] = useState<number | null>(null)
  const data = history.slice(-14)

  const W = 640
  const H = 220
  const pad = { top: 22, right: 18, bottom: 28, left: 36 }
  const cw = W - pad.left - pad.right
  const ch = H - pad.top - pad.bottom
  const stepX = data.length > 1 ? cw / (data.length - 1) : 0

  const pts = data.map((e, i) => ({
    x: pad.left + (data.length > 1 ? i * stepX : cw / 2),
    y: pad.top + ch - (Math.min(e.percentage, 100) / 100) * ch,
    e,
  }))

  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const area = pts.length > 1 ? `${line} L ${pts[pts.length - 1].x} ${pad.top + ch} L ${pts[0].x} ${pad.top + ch} Z` : ''

  const avg = data.reduce((s, e) => s + e.percentage, 0) / (data.length || 1)
  const avgY = pad.top + ch - (avg / 100) * ch

  return (
    <div className="surface rounded-2.5xl p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display text-lg text-ink-50">Score trend</h3>
          <p className="text-xs text-ink-500 mt-0.5">Last {data.length} attempt{data.length === 1 ? '' : 's'}</p>
        </div>
        <span className="chip chip-accent num">avg {formatPercent(avg, 0)}</span>
      </div>

      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" onMouseLeave={() => setHover(null)}>
          <defs>
            <linearGradient id="nx-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2cc4f5" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#2cc4f5" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="nx-line" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#5ddcff" />
              <stop offset="100%" stopColor="#2cc4f5" />
            </linearGradient>
          </defs>

          {[0, 25, 50, 75, 100].map((v) => {
            const y = pad.top + ch - (v / 100) * ch
            return (
              <g key={v}>
                <line x1={pad.left} x2={W - pad.right} y1={y} y2={y} stroke="rgba(159,173,204,0.08)" />
                <text x={pad.left - 8} y={y + 3.5} textAnchor="end" fontSize="10" fill="#52648d" fontFamily="JetBrains Mono, monospace">
                  {v}
                </text>
              </g>
            )
          })}

          {/* average line */}
          <line x1={pad.left} x2={W - pad.right} y1={avgY} y2={avgY} stroke="rgba(93,220,255,0.35)" strokeDasharray="3 5" />

          {area && <motion.path d={area} fill="url(#nx-area)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.4 }} />}
          {pts.length > 1 && (
            <motion.path
              d={line}
              fill="none"
              stroke="url(#nx-line)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.1, ease: 'easeInOut' }}
            />
          )}

          {pts.map((p, i) => (
            <g key={i}>
              {/* hit area */}
              <rect
                x={p.x - stepX / 2 || p.x - 20}
                y={0}
                width={stepX || 40}
                height={H}
                fill="transparent"
                onMouseEnter={() => setHover(i)}
                onTouchStart={() => setHover(i)}
              />
              <motion.circle
                cx={p.x}
                cy={p.y}
                r={hover === i ? 6 : 4}
                fill="#070b16"
                stroke="#5ddcff"
                strokeWidth="2"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + i * 0.05, duration: 0.3 }}
                style={{ filter: hover === i ? 'drop-shadow(0 0 6px rgba(93,220,255,0.9))' : undefined }}
              />
              {hover === i && <line x1={p.x} x2={p.x} y1={pad.top} y2={pad.top + ch} stroke="rgba(93,220,255,0.25)" />}
              <text x={p.x} y={H - 8} textAnchor="middle" fontSize="10" fill="#52648d" fontFamily="JetBrains Mono, monospace">
                #{p.e.attempt}
              </text>
            </g>
          ))}
        </svg>

        {hover !== null && pts[hover] && (
          <div
            className="absolute pointer-events-none surface-strong rounded-xl px-3 py-2 text-xs -translate-x-1/2 -translate-y-full"
            style={{ left: `${(pts[hover].x / W) * 100}%`, top: `${(pts[hover].y / H) * 100}%`, marginTop: -12 }}
          >
            <p className="font-display text-base text-ink-50 num">{formatPercent(pts[hover].e.percentage)}</p>
            <p className="text-ink-400 whitespace-nowrap">
              {labelCategory(pts[hover].e.category)} · {pts[hover].e.difficulty}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
