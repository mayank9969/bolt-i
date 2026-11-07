/** Fine contour petals — a thought opening. Colour from CSS currentColor. */
export default function WireFlower({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`wire-flower ${className}`}
      viewBox="0 0 280 280"
      role="img"
      aria-hidden="true"
    >
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="140" cy="140" rx="18" ry="18" strokeWidth="1.1" opacity="0.9" />
        <ellipse cx="140" cy="140" rx="8" ry="8" strokeWidth="0.9" />
        {[0, 36, 72, 108, 144, 180, 216, 252, 288, 324].map((deg) => (
          <g key={deg} transform={`rotate(${deg} 140 140)`}>
            <path
              d="M140 122 C148 86 168 58 140 28 C112 58 132 86 140 122"
              strokeWidth="0.85"
              opacity="0.88"
            />
            <path
              d="M140 118 C146 92 156 70 140 48"
              strokeWidth="0.55"
              opacity="0.55"
            />
          </g>
        ))}
        {[18, 90, 162, 234, 306].map((deg) => (
          <g key={`b${deg}`} transform={`rotate(${deg} 140 140)`}>
            <path
              d="M140 148 C176 156 214 178 232 214"
              strokeWidth="0.7"
              opacity="0.5"
            />
            <circle cx="232" cy="214" r="2.2" fill="currentColor" stroke="none" opacity="0.7" />
          </g>
        ))}
      </g>
    </svg>
  )
}
