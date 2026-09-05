interface LogoProps {
  size?: number
  className?: string
}

/**
 * NEXUS mark — two nodes joined by a path: connection + progression.
 * Colours come from tokens via currentColor / CSS variables so the
 * mark adapts to every theme without a rebuild.
 */
export function LogoMark({ size = 36, className = '' }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      aria-hidden="true"
    >
      <rect width="100" height="100" rx="26" fill="var(--nx-card-strong)" />
      <rect x="0.5" y="0.5" width="99" height="99" rx="25.5" fill="none" stroke="var(--nx-line-strong)" />
      <path
        d="M30 70V30l40 40V30"
        fill="none"
        stroke="var(--nx-text)"
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="30" cy="30" r="7" fill="var(--nx-accent)" />
      <circle cx="70" cy="70" r="7" fill="var(--nx-accent)" />
    </svg>
  )
}

export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`font-semibold tracking-tight text-fg ${className}`}>
      NEXUS<span className="t-italic text-accent">Quiz</span>
    </span>
  )
}
