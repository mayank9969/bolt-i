import { useEffect, useId, useRef } from 'react'
import '@/styles/veyra-mark.css'

interface LogoProps {
  size?: number
  className?: string
  animated?: boolean
}

/**
 * Blade V · Curl — the Animated mark from index.html (not the flower, not Bloom V).
 * Crimson on Paper, Ink on Ink. Studio Paper colourway is unused.
 */
export function LogoMark({ size = 36, className = '', animated = true }: LogoProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const uid = useId().replace(/:/g, '')

  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce || !animated) {
      el.classList.add('is-settled')
      return
    }

    let busy = false
    let settleT = 0
    let ripT = 0

    const play = () => {
      window.clearTimeout(settleT)
      window.clearTimeout(ripT)
      busy = false
      el.classList.remove('is-run', 'is-settled', 'is-rippling')
      void el.offsetWidth
      el.classList.add('is-run')
      settleT = window.setTimeout(() => el.classList.add('is-settled'), 3300)
    }

    const ripple = () => {
      if (busy || !el.classList.contains('is-settled')) return
      busy = true
      el.classList.add('is-rippling')
      ripT = window.setTimeout(() => {
        el.classList.remove('is-rippling')
        busy = false
      }, 2100)
    }

    el.classList.add('is-armed')
    const start = () => play()
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          el.classList.toggle('is-paused', !e.isIntersecting)
        })
      },
      { threshold: 0.2 },
    )
    io.observe(el)
    el.addEventListener('pointerenter', ripple)
    el.addEventListener('click', ripple)
    const onShow = (ev: PageTransitionEvent) => {
      if (ev.persisted) start()
    }
    window.addEventListener('pageshow', onShow)
    requestAnimationFrame(() => requestAnimationFrame(start))

    return () => {
      io.disconnect()
      window.clearTimeout(settleT)
      window.clearTimeout(ripT)
      window.removeEventListener('pageshow', onShow)
      el.removeEventListener('pointerenter', ripple)
      el.removeEventListener('click', ripple)
    }
  }, [animated])

  const halo = `${uid}-halo`
  const ml = `${uid}-ml`
  const mc = `${uid}-mc`
  const mr = `${uid}-mr`

  return (
    <div
      ref={rootRef}
      className={`veyra-mark nofield ${className}`.trim()}
      style={{ ['--vm-size' as string]: `${size}px` }}
      role="img"
      aria-label="VEYRA"
    >
      <svg viewBox="180 120 660 780" aria-hidden="true" focusable="false">
        <defs>
          <radialGradient id={halo}>
            <stop offset="0" style={{ stopColor: 'var(--b)' }} stopOpacity={0.55} />
            <stop offset=".45" style={{ stopColor: 'var(--b)' }} stopOpacity={0.16} />
            <stop offset="1" style={{ stopColor: 'var(--b)' }} stopOpacity={0} />
          </radialGradient>
          <mask id={ml} maskUnits="userSpaceOnUse" x="-100" y="-100" width="1200" height="1200">
            <path
              className="ink"
              style={{ ['--d' as string]: '.6s', ['--t' as string]: '1.4s' }}
              pathLength={1}
              strokeWidth={250}
              d="M310 195C380 330 432 590 500 856"
            />
          </mask>
          <mask id={mc} maskUnits="userSpaceOnUse" x="-100" y="-100" width="1200" height="1200">
            <path
              className="ink"
              style={{ ['--d' as string]: '.25s', ['--t' as string]: '.9s' }}
              pathLength={1}
              strokeWidth={95}
              d="M230 172C182 196 156 258 194 292C214 308 244 298 246 272"
            />
          </mask>
          <mask id={mr} maskUnits="userSpaceOnUse" x="-100" y="-100" width="1200" height="1200">
            <path
              className="ink"
              style={{ ['--d' as string]: '2s', ['--t' as string]: '1.4s' }}
              pathLength={1}
              strokeWidth={200}
              d="M500 856C578 690 648 430 676 268C692 208 748 176 800 136"
            />
          </mask>
        </defs>

        <circle className="halo" cx="515" cy="400" r="300" style={{ fill: `url(#${halo})` }} />

        <g mask={`url(#${ml})`}>
          <path
            className="blade"
            d="M230 170C290 176 360 190 402 212C414 430 450 660 500 856C420 720 292 440 230 170Z"
          />
          <path
            className="facet"
            style={{ ['--d' as string]: '1.7s', ['--t' as string]: '.8s' }}
            d="M330 186C364 194 390 202 402 212C414 430 450 660 500 856C462 700 392 480 330 186Z"
          />
        </g>
        <g className="curlG" mask={`url(#${mc})`}>
          <path
            className="curlP"
            d="M230 170C170 185 138 262 190 302C216 320 254 302 248 268C232 290 204 282 210 254C214 230 232 200 230 170Z"
          />
        </g>
        <g mask={`url(#${mr})`}>
          <path
            className="blade"
            d="M500 856C556 700 612 450 632 262C640 214 676 184 730 178C770 174 796 160 806 128C808 190 782 236 750 292C702 440 592 730 500 856Z"
          />
          <path
            className="facet"
            style={{ ['--d' as string]: '3.05s', ['--t' as string]: '.8s' }}
            d="M632 262C640 214 676 184 730 178C770 174 796 160 806 128C790 176 700 214 660 330Z"
          />
        </g>

        <path className="thorn" style={{ ['--d' as string]: '2s' }} d="M279 322L230 344L281 350Z" />
        <path className="thorn" style={{ ['--d' as string]: '3.3s' }} d="M711 384L768 398L710 412Z" />
        <g className="flG">
          <path
            className="flP"
            style={{ ['--d' as string]: '3.35s' }}
            d="M500 856C470 880 430 884 404 868C440 872 470 862 500 856Z"
          />
          <path
            className="flP"
            style={{ ['--d' as string]: '3.45s' }}
            d="M500 856C530 880 570 884 596 868C560 872 530 862 500 856Z"
          />
        </g>

        <g className="starG" style={{ ['--d' as string]: '3.7s' }}>
          <path className="starP" d="M515 215Q515 400 585 400Q515 400 515 585Q515 400 445 400Q515 400 515 215Z" />
          <path className="lnS" d="M515 215Q515 400 585 400Q515 400 515 585Q515 400 445 400Q515 400 515 215Z" />
        </g>

        <path
          className="ln"
          style={{ ['--d' as string]: '.2s', ['--t' as string]: '.9s' }}
          pathLength={1}
          d="M230 170C170 185 138 262 190 302C216 320 254 302 248 268C232 290 204 282 210 254C214 230 232 200 230 170Z"
        />
        <path
          className="ln"
          style={{ ['--d' as string]: '.55s', ['--t' as string]: '1.35s' }}
          pathLength={1}
          d="M230 170C290 176 360 190 402 212C414 430 450 660 500 856C420 720 292 440 230 170Z"
        />
        <path
          className="ln"
          style={{ ['--d' as string]: '1.95s', ['--t' as string]: '1.35s' }}
          pathLength={1}
          d="M500 856C556 700 612 450 632 262C640 214 676 184 730 178C770 174 796 160 806 128C808 190 782 236 750 292C702 440 592 730 500 856Z"
        />

        <path
          className="pulse hot"
          style={{ ['--d' as string]: '4.7s', ['--t' as string]: '1.2s', ['--rd' as string]: '0s' }}
          pathLength={1}
          d="M230 170C290 176 360 190 402 212C414 430 450 660 500 856C420 720 292 440 230 170Z"
        />
        <path
          className="pulse"
          style={{ ['--d' as string]: '4.7s', ['--t' as string]: '1.15s', ['--rd' as string]: '0s' }}
          pathLength={1}
          d="M230 170C290 176 360 190 402 212C414 430 450 660 500 856C420 720 292 440 230 170Z"
        />
        <path
          className="pulse"
          style={{ ['--d' as string]: '4.85s', ['--t' as string]: '1.15s', ['--rd' as string]: '.12s' }}
          pathLength={1}
          d="M500 856C556 700 612 450 632 262C640 214 676 184 730 178C770 174 796 160 806 128C808 190 782 236 750 292C702 440 592 730 500 856Z"
        />

        <circle className="spark" style={{ ['--d' as string]: '.05s' }} cx="230" cy="170" r="7" />
        <circle className="flare" style={{ ['--d' as string]: '3.8s' }} cx="515" cy="400" r="16" />
      </svg>
    </div>
  )
}

export function Wordmark({ className = '' }: { className?: string }) {
  return <span className={`font-semibold tracking-tight text-fg ${className}`}>VEYRA</span>
}
