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
