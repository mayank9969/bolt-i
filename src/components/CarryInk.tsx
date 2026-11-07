/** Question mark → ink line → branches → a new mark. Theme via currentColor. */

type Props = { className?: string; compact?: boolean }

export default function CarryInk({ className = '', compact = false }: Props) {
  const w = compact ? 280 : 640
  const h = compact ? 72 : 220
  return (
    <svg
      className={`carry-ink ${compact ? 'carry-ink--compact' : ''} ${className}`}
      viewBox={compact ? '0 18 640 80' : '0 0 640 220'}
      width={w}
      height={h}
      role="img"
      aria-hidden={compact}
      aria-label={compact ? undefined : 'A question mark becomes an ink line that branches and leaves a new mark'}
    >
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <path
          className="carry-ink__stem"
          d="M92 48c0-22 16-36 40-36 22 0 38 12 38 32 0 18-10 28-28 40-14 10-22 18-22 36"
          strokeWidth="3.2"
        />
        <circle cx="142" cy="148" r="11" strokeWidth="3.2" />
        <path
          className="carry-ink__flow"
          d="M154 148 C220 148 240 92 310 96 C380 100 390 150 456 154 C500 156 530 140 568 118"
          strokeWidth="2.4"
        />
        <path d="M312 96 C328 70 350 58 378 52" strokeWidth="1.6" opacity="0.85" />
        <path d="M390 132 C410 168 430 186 462 198" strokeWidth="1.6" opacity="0.85" />
        <path d="M456 154 C480 176 510 182 548 176" strokeWidth="1.5" opacity="0.7" />
      </g>
      <circle cx="568" cy="118" r="7" fill="currentColor" />
      <circle cx="378" cy="52" r="3.5" fill="currentColor" opacity="0.85" />
      <circle cx="462" cy="198" r="3.5" fill="currentColor" opacity="0.85" />
      <circle cx="548" cy="176" r="3" fill="currentColor" opacity="0.7" />
    </svg>
  )
}
