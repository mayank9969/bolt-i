import { useEffect, useRef, useState } from 'react'

/** Quiet jungle bed via Web Audio — starts only after the visitor turns it on. */
export default function AmbientAudio() {
  const [on, setOn] = useState(false)
  const [ok, setOk] = useState(true)
  const ctxRef = useRef<AudioContext | null>(null)
  const gainRef = useRef<GainNode | null>(null)
  const birdsRef = useRef<number[]>([])

  useEffect(() => {
    if (!on) {
      gainRef.current?.gain.setTargetAtTime(0, ctxRef.current?.currentTime ?? 0, 0.4)
      return
    }
    let cancelled = false
    const boot = async () => {
      try {
        const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        const ctx = ctxRef.current ?? new Ctx()
        ctxRef.current = ctx
        if (ctx.state === 'suspended') await ctx.resume()
        if (cancelled) return
        if (!gainRef.current) {
          const noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
          const data = noise.getChannelData(0)
          for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.35
          const src = ctx.createBufferSource()
          src.buffer = noise
          src.loop = true
          const filter = ctx.createBiquadFilter()
          filter.type = 'lowpass'
          filter.frequency.value = 900
          const gain = ctx.createGain()
          gain.gain.value = 0
          src.connect(filter)
          filter.connect(gain)
          gain.connect(ctx.destination)
          src.start()
          gainRef.current = gain
        }
        gainRef.current.gain.setTargetAtTime(0.045, ctx.currentTime, 0.6)
        const chirp = () => {
          if (!ctxRef.current || cancelled || ctxRef.current.state !== 'running') return
          const o = ctx.createOscillator()
          const g = ctx.createGain()
          o.type = 'sine'
          o.frequency.value = 1200 + Math.random() * 900
          g.gain.value = 0.012
          o.connect(g)
          g.connect(ctx.destination)
          o.start()
          g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35)
          o.stop(ctx.currentTime + 0.4)
          birdsRef.current.push(window.setTimeout(chirp, 4000 + Math.random() * 7000))
        }
        birdsRef.current.push(window.setTimeout(chirp, 1800))
      } catch {
        setOk(false)
      }
    }
    boot()
    return () => {
      cancelled = true
      birdsRef.current.forEach((id) => clearTimeout(id))
      birdsRef.current = []
    }
  }, [on])

  useEffect(
    () => () => {
      birdsRef.current.forEach((id) => clearTimeout(id))
      gainRef.current?.gain.setValueAtTime(0, ctxRef.current?.currentTime ?? 0)
      ctxRef.current?.close().catch(() => undefined)
    },
    [],
  )

  if (!ok) return null
  return (
    <button
      type="button"
      className="island-chip"
      style={{ position: 'absolute', left: 12, bottom: 12, zIndex: 4 }}
      aria-pressed={on}
      onClick={() => setOn((v) => !v)}
    >
      {on ? 'Sound on' : 'Sound off'}
    </button>
  )
}
