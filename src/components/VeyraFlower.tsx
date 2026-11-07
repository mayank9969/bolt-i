import { useEffect, useRef } from 'react'
import { mountVeyraFlower } from '@/lib/veyraFlower'
import '@/styles/veyra-flower.css'

export default function VeyraFlower() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    mountVeyraFlower(el)
  }, [])

  return (
    <div
      ref={ref}
      className="veyra-flower"
      role="img"
      aria-label="A luminous, iridescent wireframe flower opening from a single point of light"
    >
      <svg viewBox="0 0 600 800" focusable="false" aria-hidden="true">
        <defs>
          <radialGradient id="vf-pA" gradientUnits="userSpaceOnUse" cx="300" cy="340" r="240">
            <stop offset="0" style={{ stopColor: 'var(--vf-tint-c)', stopOpacity: 0.26 }} />
            <stop offset=".3" style={{ stopColor: 'var(--vf-tint-b)', stopOpacity: 0.2 }} />
            <stop offset=".6" style={{ stopColor: 'var(--vf-tint-a)', stopOpacity: 0.16 }} />
            <stop offset="1" style={{ stopColor: 'var(--vf-tint-b)', stopOpacity: 0.06 }} />
          </radialGradient>
          <radialGradient id="vf-pB" gradientUnits="userSpaceOnUse" cx="300" cy="340" r="240">
            <stop offset="0" style={{ stopColor: 'var(--vf-tint-d)', stopOpacity: 0.22 }} />
            <stop offset=".3" style={{ stopColor: 'var(--vf-tint-c)', stopOpacity: 0.18 }} />
            <stop offset=".58" style={{ stopColor: 'var(--vf-tint-b)', stopOpacity: 0.18 }} />
            <stop offset="1" style={{ stopColor: 'var(--vf-tint-a)', stopOpacity: 0.1 }} />
          </radialGradient>
          <radialGradient id="vf-pC" gradientUnits="userSpaceOnUse" cx="300" cy="340" r="240">
            <stop offset="0" style={{ stopColor: 'var(--vf-tint-b)', stopOpacity: 0.24 }} />
            <stop offset=".35" style={{ stopColor: 'var(--vf-tint-a)', stopOpacity: 0.19 }} />
            <stop offset=".7" style={{ stopColor: 'var(--vf-tint-c)', stopOpacity: 0.12 }} />
            <stop offset="1" style={{ stopColor: 'var(--vf-tint-a)', stopOpacity: 0.06 }} />
          </radialGradient>
          <radialGradient id="vf-pIn" gradientUnits="userSpaceOnUse" cx="300" cy="340" r="130">
            <stop offset="0" style={{ stopColor: 'var(--vf-tint-d)', stopOpacity: 0.3 }} />
            <stop offset=".45" style={{ stopColor: 'var(--vf-tint-c)', stopOpacity: 0.22 }} />
            <stop offset="1" style={{ stopColor: 'var(--vf-tint-a)', stopOpacity: 0.14 }} />
          </radialGradient>
          <radialGradient id="vf-halo">
            <stop offset="0" style={{ stopColor: 'var(--vf-halo)', stopOpacity: 0.7 }} />
            <stop offset=".4" style={{ stopColor: 'var(--vf-halo)', stopOpacity: 0.2 }} />
            <stop offset="1" style={{ stopColor: 'var(--vf-halo)', stopOpacity: 0 }} />
          </radialGradient>
          <linearGradient id="vf-fadeY" gradientUnits="userSpaceOnUse" x1="0" y1="640" x2="0" y2="800">
            <stop offset="0" stopColor="#fff" />
            <stop offset="1" stopColor="#000" />
          </linearGradient>
          <mask id="vf-baseMask" maskUnits="userSpaceOnUse" x="-200" y="-200" width="1000" height="1200">
            <rect x="-200" y="-200" width="1000" height="1200" fill="url(#vf-fadeY)" />
          </mask>
          <radialGradient id="vf-wide">
            <stop offset="0" style={{ stopColor: 'var(--vf-tint-b)', stopOpacity: 0.16 }} />
            <stop offset=".55" style={{ stopColor: 'var(--vf-tint-a)', stopOpacity: 0.07 }} />
            <stop offset="1" style={{ stopColor: 'var(--vf-tint-a)', stopOpacity: 0 }} />
          </radialGradient>
        </defs>
        <g className="sway">
          <circle className="bloom-wide" cx="300" cy="340" r="270" />
          <g mask="url(#vf-baseMask)">
            <g data-vf="leaves" />
            <g data-vf="stem" />
          </g>
          <g data-vf="petals" />
          <g data-vf="inner" />
          <g data-vf="stamens" />
          <g data-vf="heart">
            <circle className="bloom" cx="300" cy="340" r="66" />
            <g data-vf-rings="" />
            <circle className="birth" cx="300" cy="340" r="3" />
            <circle className="core" cx="300" cy="340" r="3" />
          </g>
          <g data-vf="motes" />
        </g>
      </svg>
    </div>
  )
}
