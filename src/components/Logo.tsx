import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
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
  const path = useLocation().pathname

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
    let loopT = 0
    let vanishT = 0

    const play = () => {
      window.clearTimeout(settleT)
      window.clearTimeout(loopT)
      window.clearTimeout(vanishT)
      busy = true
      el.style.opacity = ''
      el.classList.remove('is-run', 'is-settled', 'is-rippling', 'is-vanish')
      void el.offsetWidth
      el.classList.add('is-run')
      settleT = window.setTimeout(() => {
        el.classList.add('is-settled')
        busy = false
        loopT = window.setTimeout(() => {
          el.classList.add('is-vanish')
          vanishT = window.setTimeout(() => play(), 720)
        }, 4800)
      }, 3300)
    }

    const replay = () => {
      if (busy) return
      play()
    }

    el.classList.add('is-armed')
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          el.classList.toggle('is-paused', !e.isIntersecting)
          if (e.isIntersecting && !el.classList.contains('is-run')) replay()
        })
      },
      { threshold: 0.2 },
    )
    io.observe(el)
    el.addEventListener('pointerenter', replay)
    el.addEventListener('click', replay)
    const onShow = () => replay()
    const onVis = () => {
      if (document.visibilityState === 'visible') replay()
    }
    window.addEventListener('pageshow', onShow)
    document.addEventListener('visibilitychange', onVis)
    requestAnimationFrame(() => requestAnimationFrame(play))

    return () => {
      io.disconnect()
      window.clearTimeout(settleT)
      window.clearTimeout(loopT)
      window.clearTimeout(vanishT)
      window.removeEventListener('pageshow', onShow)
      document.removeEventListener('visibilitychange', onVis)
      el.removeEventListener('pointerenter', replay)
      el.removeEventListener('click', replay)
    }
  }, [animated, path])

  return (
    <div
      ref={rootRef}
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
          style={{ ['--d' as string]: '1.2s', ['--t' as string]: '.8s' }}
          d="M18 14 L30 14 L50 62 L42 62 Z"
        />
        <path
          className="curlP"
          d="M18 14 C12 20 10 30 16 34 C20 36 24 33 23 29 C20 31 17 29 18 25 C19 21 20 17 18 14 Z"
        />
        <g className="starG" style={{ ['--d' as string]: '2.2s' }}>
          <path className="starP" d="M50 22 L54 36 L50 50 L46 36 Z" />
        </g>
      </svg>
    </div>
  )
}

export function Wordmark({ className = '' }: { className?: string }) {
  return <span className={`font-semibold tracking-tight text-fg ${className}`}>VEYRA</span>
}
