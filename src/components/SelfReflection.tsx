import { Component, useEffect, useRef, type ReactNode } from 'react'

const SPEED = 0.42

class Guard extends Component<{ children: ReactNode }, { ok: boolean }> {
  state = { ok: true }
  static getDerivedStateFromError() {
    return { ok: false }
  }
  render() {
    return this.state.ok ? this.props.children : null
  }
}

function Stage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const wrap = wrapRef.current
    const cv = canvasRef.current
    if (!wrap || !cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    let raf = 0
    let alive = true
    let t0 = performance.now()
    let lastW = 0
    let renderFn: typeof import('@/about-anim/scene').render | null = null
    let duration = 10
    let aspect = 1600 / 900

    const size = () => {
      const cssW = Math.min(420, Math.floor(wrap.clientWidth || 360))
      const cssH = Math.floor(cssW * aspect)
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const tw = Math.round(cssW * dpr)
      const th = Math.round(cssH * dpr)
      if (tw === lastW && cv.width === tw && cv.height === th) return
      lastW = tw
      cv.width = tw
      cv.height = th
      cv.style.width = cssW + 'px'
      cv.style.height = cssH + 'px'
    }

    const tick = (now: number) => {
      if (!alive) return
      if (renderFn && cv.width > 0) {
        try {
          const t = (((now - t0) / 1000) * SPEED) % duration
          renderFn(ctx, cv, t)
        } catch {
          /* skip a bad frame */
        }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    import('@/about-anim/scene')
      .then((mod) => {
        if (!alive) return
        renderFn = mod.render
        duration = mod.DURATION
        aspect = mod.H / mod.W
        size()
      })
      .catch(() => {})

    const ro = new ResizeObserver(size)
    ro.observe(wrap)
    return () => {
      alive = false
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [])

  return (
    <div ref={wrapRef} className="about-reflection mx-auto w-full max-w-[420px]">
      <canvas ref={canvasRef} className="block w-full h-auto bg-transparent" aria-label="A slow, silent short about looking inward" />
    </div>
  )
}

export default function SelfReflection() {
  return (
    <Guard>
      <Stage />
    </Guard>
  )
}
