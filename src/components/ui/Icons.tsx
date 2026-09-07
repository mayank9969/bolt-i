import type { SVGProps } from 'react'

type P = SVGProps<SVGSVGElement>
const base = (p: P): P => ({
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  ...p,
})

export const ArrowRight = (p: P) => (
  <svg {...base(p)}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
)
export const ArrowLeft = (p: P) => (
  <svg {...base(p)}><path d="M19 12H5M11 18l-6-6 6-6" /></svg>
)
export const Check = (p: P) => (
  <svg {...base({ strokeWidth: 2.4, ...p })}><path d="M5 13l4 4L19 7" /></svg>
)
export const Cross = (p: P) => (
  <svg {...base({ strokeWidth: 2.4, ...p })}><path d="M6 6l12 12M6 18L18 6" /></svg>
)
export const Sigma = (p: P) => (
  <svg {...base(p)}><path d="M18 5H6l6 7-6 7h12" /></svg>
)
export const Code = (p: P) => (
  <svg {...base(p)}><path d="M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16" /></svg>
)
export const Layers = (p: P) => (
  <svg {...base(p)}><path d="M12 3l9 5-9 5-9-5 9-5z" /><path d="M3 13l9 5 9-5" /></svg>
)
export const Clock = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
)
export const Trend = (p: P) => (
  <svg {...base(p)}><path d="M3 17l6-6 4 4 8-8" /><path d="M15 7h6v6" /></svg>
)
export const Target = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.2" fill="currentColor" /></svg>
)
export const Shield = (p: P) => (
  <svg {...base(p)}><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" /><path d="M9 12l2 2 4-4" /></svg>
)
export const Sparkle = (p: P) => (
  <svg {...base(p)}><path d="M12 3l2.2 5.8L20 11l-5.8 2.2L12 19l-2.2-5.8L4 11l5.8-2.2L12 3z" /></svg>
)
export const Minus = (p: P) => (
  <svg {...base(p)}><path d="M5 12h14" /></svg>
)
export const Plus = (p: P) => (
  <svg {...base(p)}><path d="M12 5v14M5 12h14" /></svg>
)
export const Refresh = (p: P) => (
  <svg {...base(p)}><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></svg>
)
export const Bolt = (p: P) => (
  <svg {...base(p)}><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" /></svg>
)

/* ── Region icons (one per knowledge category) ─────────────────────────── */
export const Flask = (p: P) => (
  <svg {...base(p)}><path d="M9 3h6M10 3v6l-5.5 9.5A1.5 1.5 0 0 0 5.8 21h12.4a1.5 1.5 0 0 0 1.3-2.5L14 9V3" /><path d="M7.5 15h9" /></svg>
)
export const Chip = (p: P) => (
  <svg {...base(p)}><rect x="7" y="7" width="10" height="10" rx="1.5" /><path d="M10 10h4v4h-4zM9 3v4M15 3v4M9 17v4M15 17v4M3 9h4M3 15h4M17 9h4M17 15h4" /></svg>
)
export const Binary = (p: P) => (
  <svg {...base(p)}><rect x="4" y="3" width="5" height="7" rx="2" /><rect x="15" y="14" width="5" height="7" rx="2" /><path d="M17 3v7M15 10h4M6 14v7M4 21h4" /></svg>
)
export const Atom = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" /><ellipse cx="12" cy="12" rx="9" ry="3.6" /><ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(60 12 12)" /><ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(120 12 12)" /></svg>
)
export const Molecule = (p: P) => (
  <svg {...base(p)}><circle cx="6" cy="17" r="2.5" /><circle cx="18" cy="17" r="2.5" /><circle cx="12" cy="6" r="2.5" /><path d="M8.3 15.6l2.4-7.2M15.7 15.6l-2.4-7.2M8.5 17h7" /></svg>
)
export const Leaf = (p: P) => (
  <svg {...base(p)}><path d="M5 20c0-8 4-14 14-15-1 10-7 14-14 15z" /><path d="M5 20c3-5 6-8 10-10" /></svg>
)
export const Orbit = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="3.5" /><path d="M4.4 7.6c-1.9 3.2-2 6.3-.5 7.8 2 2 7.3.3 11.8-3.7s6.6-9 4.6-11c-1.5-1.5-4.6-.9-7.8 1.1" /><circle cx="19" cy="17" r="1.2" fill="currentColor" stroke="none" /></svg>
)
export const Globe = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18" /></svg>
)
export const Column = (p: P) => (
  <svg {...base(p)}><path d="M4 21h16M5 9h14M12 3l8 5H4l8-5zM7 9v9M12 9v9M17 9v9M5 18h14" /></svg>
)
export const Puzzle = (p: P) => (
  <svg {...base(p)}><path d="M9 4a2 2 0 1 1 4 0h4v4a2 2 0 1 0 0 4v4h-4a2 2 0 1 1-4 0H5v-4a2 2 0 1 1 0-4V4h4z" /></svg>
)
export const Quote = (p: P) => (
  <svg {...base(p)}><path d="M4 7h6v6H6a2 2 0 0 1-2-2V7zM10 13c0 3-2 5-5 5M14 7h6v6h-4a2 2 0 0 1-2-2V7zM20 13c0 3-2 5-5 5" /></svg>
)
