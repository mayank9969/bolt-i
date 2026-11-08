import { Component, useEffect, useRef, useState, type ReactNode } from 'react'

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

/** Quiet A-minor pad — no voice, no beat, just a low sad wash. */
function startPad(ctx: AudioContext) {
  const master = ctx.createGain()
  master.gain.setValueAtTime(0, ctx.currentTime)
  master.connect(ctx.destination)

  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 720
  filter.Q.value = 0.85
  filter.connect(master)

  const lfo = ctx.createOscillator()
  const lfoGain = ctx.createGain()
  lfo.type = 'sine'
  lfo.frequency.value = 0.07
  lfoGain.gain.value = 90
  lfo.connect(lfoGain)
  lfoGain.connect(filter.frequency)
  lfo.start()

  const voices: OscillatorNode[] = []
  const notes: [number, OscillatorType, number][] = [
    [110, 'sine', 0.55],
    [164.81, 'sine', 0.38],
    [220, 'triangle', 0.12],
    [261.63, 'sine', 0.1],
    [329.63, 'sine', 0.06],
  ]
  notes.forEach(([freq, type, g]) => {
    const o = ctx.createOscillator()
    const gain = ctx.createGain()
    o.type = type
    o.frequency.value = freq
    gain.gain.value = g
    o.connect(gain)
    gain.connect(filter)
    o.start()
    voices.push(o)
  })

  master.gain.linearRampToValueAtTime(0.14, ctx.currentTime + 1.8)

  return {
    stop() {
      try {
        master.gain.cancelScheduledValues(ctx.currentTime)
        master.gain.setValueAtTime(master.gain.value || 0.14, ctx.currentTime)
        master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5)
      } catch {
        /* closed */
      }
      window.setTimeout(() => {
        voices.concat(lfo).forEach((o) => {
          try {
            o.stop()
          } catch {
            /* stopped */
          }
        })
        void ctx.close()
      }, 600)
    },
  }
}

function Stage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const inView = useRef(true)
  const wantSound = useRef(false)
  const pad = useRef<{ stop: () => void } | null>(null)
  const [soundOn, setSoundOn] = useState(false)

  const syncPad = async (on: boolean) => {
    wantSound.current = on
    if (on && inView.current && !pad.current) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const ctx = new AC()
      await ctx.resume()
      if (!wantSound.current || !inView.current) {
        void ctx.close()
        return
      }
      pad.current = startPad(ctx)
    }
    if ((!on || !inView.current) && pad.current) {
      pad.current.stop()
      pad.current = null
    }
  }

  useEffect(() => {
    const wrap = wrapRef.current
    const cv = canvasRef.current
    if (!wrap || !cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    let raf = 0
    let alive = true
    const t0 = performance.now()
    let lastW = 0
    let renderFn: typeof import('@/about-anim/scene').render | null = null
    let duration = 10
    let aspect = 1600 / 900

    const size = () => {
      const cssW = Math.max(280, Math.floor(wrap.clientWidth || 640))
      const cssH = Math.floor(cssW * aspect)
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const tw = Math.round(cssW * dpr)
      const th = Math.round(cssH * dpr)
      if (tw === lastW && cv.width === tw && cv.height === th) return
      lastW = tw
      cv.width = tw
      cv.height = th
      cv.style.width = '100%'
      cv.style.height = 'auto'
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
    const io = new IntersectionObserver(
      (entries) => {
        inView.current = entries.some((e) => e.isIntersecting)
        void syncPad(wantSound.current)
      },
      { threshold: 0 },
    )
    io.observe(wrap)

    return () => {
      alive = false
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      pad.current?.stop()
      pad.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div ref={wrapRef} className="about-reflection relative w-full">
      <canvas ref={canvasRef} className="block w-full h-auto" aria-label="A slow short about looking inward" />
      <button
        type="button"
        className="absolute bottom-3 right-3 rounded-full border border-current/30 bg-canvas/80 px-3 py-1.5 text-[0.65rem] tracking-[0.18em] uppercase text-fg backdrop-blur-sm"
        aria-pressed={soundOn}
        onClick={() => {
          const next = !soundOn
          setSoundOn(next)
          void syncPad(next)
        }}
      >
        {soundOn ? 'Sound on' : 'Sound off'}
      </button>
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
