import '@/styles/veyra-mark.css'

interface LogoProps {
  size?: number
  className?: string
  animated?: boolean
}

/**
 * Bold V mark — static, theme-aware. Same mark as the tab icon and
 * Practice footers. Crimson on Paper, Ink on Ink.
 */
export function LogoMark({ size = 36, className = '' }: LogoProps) {
  return (
    <div
      className={`veyra-mark nofield ${className}`.trim()}
      style={{ ['--vm-size' as string]: `${size}px` }}
      role="img"
      aria-label="VEYRA"
    >
      <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
        <path
          className="blade"
          d="M18 14 L38 14 L50 62 L62 14 L82 14 L50 88 Z"
        />
        <path
          className="facet"
          d="M18 14 L30 14 L50 62 L42 62 Z"
        />
        <path
          className="curlP"
          d="M18 14 C12 20 10 30 16 34 C20 36 24 33 23 29 C20 31 17 29 18 25 C19 21 20 17 18 14 Z"
        />
        <path className="starP" d="M50 22 L54 36 L50 50 L46 36 Z" />
      </svg>
    </div>
  )
}

export function Wordmark({ className = '' }: { className?: string }) {
  return <span className={`font-semibold tracking-tight text-fg ${className}`}>VEYRA</span>
}
