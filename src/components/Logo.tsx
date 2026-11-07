interface LogoProps {
  size?: number
  className?: string
  /** CSS-animated Bloom V (default). Pass false for a still mark. */
  animated?: boolean
}

function starPath(cx: number, cy: number, rv: number, rh: number) {
  return (
    `M${cx} ${cy - rv}Q${cx} ${cy} ${cx + rh} ${cy}` +
    `Q${cx} ${cy} ${cx} ${cy + rv}Q${cx} ${cy} ${cx - rh} ${cy}Q${cx} ${cy} ${cx} ${cy - rv}Z`
  )
}

/**
 * Bloom V from the VEYRA logo set: two petals form a V, a star is the bud.
 * Animated version unfolds once and the star breathes. Colours follow Paper / Ink.
 */
export function LogoMark({ size = 36, className = '', animated = true }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="220 140 560 820"
      className={`veyra-logo ${animated ? 'is-animated' : ''} ${className}`.trim()}
      aria-hidden="true"
    >
      <g className="veyra-logo-bloom">
        <path className="veyra-logo-petal" d="M500 820C360 720 240 480 260 180C400 330 480 560 500 820Z" />
        <path className="veyra-logo-petal" d="M500 820C640 720 760 480 740 180C600 330 520 560 500 820Z" />
      </g>
      <g className="veyra-logo-vein" fill="none" strokeLinecap="round">
        <path d="M500 790C440 640 340 440 280 240" />
        <path d="M500 790C560 640 660 440 720 240" />
        <path d="M500 820L500 930" />
      </g>
      <path className="veyra-logo-star" d={starPath(500, 330, 130, 58)} />
    </svg>
  )
}

export function Wordmark({ className = '' }: { className?: string }) {
  return <span className={`font-semibold tracking-tight text-fg ${className}`}>VEYRA</span>
}
