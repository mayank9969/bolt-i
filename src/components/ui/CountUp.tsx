import { useEffect, useRef, useState } from 'react'

interface CountUpProps {
  value: number
  decimals?: number
  duration?: number
  delay?: number
  className?: string
  suffix?: string
}

/** Animates a number from 0 to `value` with an ease-out curve. */
export default function CountUp({ value, decimals = 0, duration = 1.1, delay = 0, className = '', suffix = '' }: CountUpProps) {
  const [display, setDisplay] = useState(0)
  const raf = useRef(0)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      setDisplay(value)
      return
    }
    let start: number | null = null
    const total = duration * 1000
    const timeout = window.setTimeout(() => {
      const step = (ts: number) => {
        if (start === null) start = ts
        const p = Math.min((ts - start) / total, 1)
        const eased = 1 - Math.pow(1 - p, 3)
        setDisplay(value * eased)
        if (p < 1) raf.current = requestAnimationFrame(step)
      }
      raf.current = requestAnimationFrame(step)
    }, delay * 1000)
    return () => {
      window.clearTimeout(timeout)
      cancelAnimationFrame(raf.current)
    }
  }, [value, duration, delay])

  return (
    <span className={`num ${className}`}>
      {display.toFixed(decimals)}
      {suffix}
    </span>
  )
}
