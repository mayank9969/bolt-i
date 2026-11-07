/* Painted iris matching the high-graphics reference: almond, fibers, gold ring, wet highlight. */
(function (g) {
  g.startVeyraEye = function startVeyraEye(canvas) {
    const ctx = canvas.getContext('2d')
    if (!ctx) return () => {}

    let lookX = 0
    let lookY = 0
    let tX = 0
    let tY = 0
    let blink = 1
    let nextBlink = 160
    let blinkT = 0
    let running = true
    let raf = 0
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    function resize() {
      const cssW = Math.max(280, canvas.clientWidth || 360)
      const cssH = cssW * 0.55
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      canvas.width = Math.round(cssW * dpr)
      canvas.height = Math.round(cssH * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      canvas.style.width = cssW + 'px'
      canvas.style.height = cssH + 'px'
    }
    resize()

    const move = (e) => {
      const r = canvas.getBoundingClientRect()
      tX = (e.clientX - (r.left + r.width / 2)) / (r.width * 0.5)
      tY = (e.clientY - (r.top + r.height / 2)) / (r.height * 0.5)
      tX = Math.max(-1, Math.min(1, tX))
      tY = Math.max(-1, Math.min(1, tY))
    }
    window.addEventListener('pointermove', move, { passive: true })

    function almond(cx, cy, rx, ry) {
      ctx.beginPath()
      ctx.moveTo(cx - rx, cy)
      ctx.bezierCurveTo(cx - rx * 0.35, cy - ry, cx + rx * 0.35, cy - ry, cx + rx, cy)
      ctx.bezierCurveTo(cx + rx * 0.35, cy + ry, cx - rx * 0.35, cy + ry, cx - rx, cy)
      ctx.closePath()
    }

    function draw() {
      if (!running) return
      raf = requestAnimationFrame(draw)
      lookX += (tX - lookX) * 0.1
      lookY += (tY - lookY) * 0.1
      if (!reduced) {
        blinkT++
        if (blinkT > nextBlink) {
          const k = (blinkT - nextBlink) / 8
          blink = k < 1 ? 1 - k : k < 2 ? k - 1 : 1
          if (k >= 2) {
            blink = 1
            blinkT = 0
            nextBlink = 140 + Math.random() * 220
          }
        }
      }

      const w = canvas.clientWidth
      const h = canvas.clientHeight
      ctx.clearRect(0, 0, w, h)
      const cx = w * 0.5
      const cy = h * 0.52
      const rx = w * 0.46
      const ry = h * 0.38 * Math.max(0.06, blink)

      almond(cx, cy, rx, ry)
      ctx.save()
      ctx.clip()

      const sclera = ctx.createRadialGradient(cx - rx * 0.1, cy - ry * 0.2, 8, cx, cy, rx)
      sclera.addColorStop(0, '#f4f1ea')
      sclera.addColorStop(0.55, '#e8e4dc')
      sclera.addColorStop(1, '#c9c3b8')
      ctx.fillStyle = sclera
      ctx.fillRect(cx - rx, cy - ry, rx * 2, ry * 2)

      const ix = cx + lookX * rx * 0.16
      const iy = cy + lookY * ry * 0.22
      const irisR = Math.min(rx, ry) * 1.05

      const base = ctx.createRadialGradient(ix, iy, irisR * 0.08, ix, iy, irisR)
      base.addColorStop(0, '#2f7a3a')
      base.addColorStop(0.28, '#1f6a32')
      base.addColorStop(0.62, '#14532a')
      base.addColorStop(0.86, '#0c2f18')
      base.addColorStop(1, '#07140c')
      ctx.beginPath()
      ctx.arc(ix, iy, irisR, 0, Math.PI * 2)
      ctx.fillStyle = base
      ctx.fill()

      ctx.save()
      ctx.beginPath()
      ctx.arc(ix, iy, irisR, 0, Math.PI * 2)
      ctx.clip()
      for (let i = 0; i < 96; i++) {
        const a = (i / 96) * Math.PI * 2 + Math.sin(i * 1.7) * 0.04
        const wobble = 0.72 + Math.sin(i * 3.1) * 0.18
        ctx.beginPath()
        ctx.moveTo(ix + Math.cos(a) * irisR * 0.22, iy + Math.sin(a) * irisR * 0.22)
        ctx.lineTo(ix + Math.cos(a) * irisR * wobble, iy + Math.sin(a) * irisR * wobble)
        ctx.strokeStyle = i % 3 === 0 ? 'rgba(90,190,80,0.55)' : 'rgba(20,70,35,0.45)'
        ctx.lineWidth = i % 5 === 0 ? 1.8 : 0.9
        ctx.stroke()
      }
      ctx.restore()

      ctx.beginPath()
      ctx.arc(ix, iy, irisR * 0.38, 0, Math.PI * 2)
      const gold = ctx.createRadialGradient(ix, iy, irisR * 0.18, ix, iy, irisR * 0.4)
      gold.addColorStop(0, 'rgba(40,30,8,0)')
      gold.addColorStop(0.45, 'rgba(196,154,42,0.95)')
      gold.addColorStop(0.78, 'rgba(140,100,20,0.55)')
      gold.addColorStop(1, 'rgba(20,40,16,0)')
      ctx.fillStyle = gold
      ctx.fill()

      ctx.beginPath()
      ctx.arc(ix, iy, irisR * 0.2, 0, Math.PI * 2)
      ctx.fillStyle = '#0a0c0a'
      ctx.fill()
      ctx.beginPath()
      ctx.arc(ix, iy, irisR * 0.235, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(10,20,12,0.7)'
      ctx.lineWidth = 3
      ctx.stroke()

      ctx.beginPath()
      ctx.ellipse(ix - irisR * 0.22, iy - irisR * 0.28, irisR * 0.11, irisR * 0.14, -0.4, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255,255,250,0.92)'
      ctx.fill()
      ctx.beginPath()
      ctx.ellipse(ix + irisR * 0.18, iy + irisR * 0.12, irisR * 0.05, irisR * 0.04, 0.3, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255,255,255,0.28)'
      ctx.fill()

      ctx.restore()

      almond(cx, cy, rx, ry)
      ctx.strokeStyle = 'rgba(90,86,80,0.28)'
      ctx.lineWidth = 1.2
      ctx.stroke()

      ctx.save()
      almond(cx, cy, rx, ry)
      ctx.clip()
      const lid = ctx.createLinearGradient(cx, cy - ry, cx, cy)
      lid.addColorStop(0, 'rgba(70,66,60,0.28)')
      lid.addColorStop(1, 'rgba(70,66,60,0)')
      ctx.fillStyle = lid
      ctx.fillRect(cx - rx, cy - ry, rx * 2, ry)
      const lid2 = ctx.createLinearGradient(cx, cy + ry, cx, cy)
      lid2.addColorStop(0, 'rgba(50,48,44,0.22)')
      lid2.addColorStop(1, 'rgba(50,48,44,0)')
      ctx.fillStyle = lid2
      ctx.fillRect(cx - rx, cy, rx * 2, ry)
      ctx.restore()
    }

    raf = requestAnimationFrame(draw)
    window.addEventListener('resize', resize)
    return () => {
      running = false
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('resize', resize)
    }
  }
})(typeof window !== 'undefined' ? window : globalThis)
