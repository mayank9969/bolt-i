import { useEffect, useRef, useState } from 'react'
import { DURATION, H, W, render } from '@/about-anim/scene'

const SPEED = 0.42

/** Silent, slow loop of the uploaded self-reflection short. */
export default function SelfReflection() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState({ w: 360, h: 640, dpr: 1 })

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const fit = () => {
      const w = Math.min(420, el.clientWidth || 360)
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      setBox({ w: Math.floor(w), h: Math.floor((w * H) / W), dpr })
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const cv = canvasRef.current
    const ctx = cv?.getContext('2d')
    if (!cv || !ctx) return
    let raf = 0
    const t0 = performance.now()
    const tick = (now: number) => {
      const t = (((now - t0) / 1000) * SPEED) % DURATION
      render(ctx, cv, t)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [box])

  return (
    <div ref={wrapRef} className="about-reflection mx-auto w-full max-w-[420px]">
      <canvas
        ref={canvasRef}
        width={Math.round(box.w * box.dpr)}
        height={Math.round(box.h * box.dpr)}
        style={{ width: box.w, height: box.h, display: 'block', borderRadius: 2 }}
        aria-label="A slow, silent short about looking inward"
      />
    </div>
  )
}
