interface LogoProps {
  size?: number
  className?: string
}

/** NEXUS mark — two nodes joined by a path: connection + progression. */
export function LogoMark({ size = 36, className = '' }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="nx-logo-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5ddcff" />
          <stop offset="1" stopColor="#0aa3d4" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="26" fill="#0a0f1f" />
      <rect x="0.5" y="0.5" width="99" height="99" rx="25.5" fill="none" stroke="rgba(93,220,255,0.25)" />
      <path
        d="M30 70V30l40 40V30"
        fill="none"
        stroke="url(#nx-logo-grad)"
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="30" cy="30" r="6.5" fill="#5ddcff" />
      <circle cx="70" cy="70" r="6.5" fill="#5ddcff" />
    </svg>
  )
}

export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`font-display font-semibold tracking-tight text-ink-50 ${className}`}>
      NEXUS<span className="text-accent-300">Quiz</span>
    </span>
  )
}
