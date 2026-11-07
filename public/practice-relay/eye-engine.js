/* Animated curiosity eye — canvas iris that looks and blinks. */
(function (g) {
  g.startVeyraEye = function startVeyraEye(canvas) {
    const ctx = canvas.getContext('2d')
    if (!ctx) return () => {}
    const W = 480
    const H = 330
    const CX = 240
    const CY = 165
    canvas.width = W
    canvas.height = H
    let lookX = 0
    let lookY = 0
    let tX = 0
    let tY = 0
    let blink = 1
    let blinkT = 0
    let nextBlink = 180
    let frame = 0
    let running = true
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const move = (e) => {
      const r = canvas.getBoundingClientRect()
      const dx = e.clientX - (r.left + r.width / 2)
      const dy = e.clientY - (r.top + r.height / 2)
      const len = Math.max(1, Math.hypot(dx, dy))
      const s = Math.min(1, len / 220)
      tX = (dx / len) * s * 22
      tY = (dy / len) * s * 16
    }
    window.addEventListener('pointermove', move, { passive: true })

    function lidPath(open) {
      const o = 72 * open
      ctx.beginPath()
      ctx.moveTo(68, CY)
      ctx.quadraticCurveTo(CX, CY - o, 412, CY)
      ctx.quadraticCurveTo(CX, CY + o, 68, CY)
      ctx.closePath()
    }

    function draw(ts) {
      if (!running) return
      frame = requestAnimationFrame(draw)
      lookX += (tX - lookX) * 0.12
      lookY += (tY - lookY) * 0.12
      if (!reduced) {
        blinkT++
        if (blinkT > nextBlink) {
          const k = (blinkT - nextBlink) / 10
          blink = k < 1 ? 1 - k : k < 2 ? k - 1 : 1
          if (k >= 2) {
            blink = 1
            blinkT = 0
            nextBlink = 140 + Math.random() * 220
          }
        }
      }
      ctx.clearRect(0, 0, W, H)
      ctx.save()
      lidPath(Math.max(0.04, blink))
      ctx.clip()

      ctx.fillStyle = '#fcf6e9'
      ctx.fill()
      const ix = CX + lookX
      const iy = CY + lookY
      const grd = ctx.createRadialGradient(ix - 8, iy - 10, 8, ix, iy, 78)
      grd.addColorStop(0, '#3d8a62')
      grd.addColorStop(0.45, '#17492b')
      grd.addColorStop(1, '#0d2418')
      ctx.beginPath()
      ctx.arc(ix, iy, 70, 0, Math.PI * 2)
      ctx.fillStyle = grd
      ctx.fill()
      ctx.strokeStyle = '#151b18'
      ctx.lineWidth = 4
      ctx.stroke()

      ctx.save()
      ctx.translate(ix, iy)
      ctx.rotate(ts * 0.00015)
      ctx.strokeStyle = 'rgba(233,194,94,0.75)'
      ctx.lineWidth = 1.4
      for (let i = 0; i < 28; i++) {
        const a = (i / 28) * Math.PI * 2
        ctx.beginPath()
        ctx.moveTo(Math.cos(a) * 18, Math.sin(a) * 18)
        ctx.lineTo(Math.cos(a) * 64, Math.sin(a) * 64)
        ctx.stroke()
      }
      ctx.restore()

      ctx.beginPath()
      ctx.arc(ix, iy, 54, 0, Math.PI * 2)
      ctx.strokeStyle = '#e6b750'
      ctx.lineWidth = 2
      ctx.stroke()

      ctx.beginPath()
      ctx.arc(ix, iy, 28, 0, Math.PI * 2)
      ctx.fillStyle = '#111917'
      ctx.fill()
      ctx.beginPath()
      ctx.arc(ix + 10, iy - 12, 8, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255,249,233,0.9)'
      ctx.fill()
      ctx.restore()

      lidPath(Math.max(0.04, blink))
      ctx.strokeStyle = '#151b18'
      ctx.lineWidth = 4
      ctx.stroke()

      ctx.strokeStyle = '#151b18'
      ctx.lineWidth = 2.4
      ctx.lineCap = 'round'
      for (let i = -4; i <= 4; i++) {
        const a = (i / 5) * 0.7
        ctx.beginPath()
        ctx.moveTo(CX + Math.sin(a) * 86, CY - 62)
        ctx.lineTo(CX + Math.sin(a) * 98, CY - 86)
        ctx.stroke()
      }
    }
    frame = requestAnimationFrame(draw)
    return () => {
      running = false
      cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', move)
    }
  }
})(typeof window !== 'undefined' ? window : globalThis)
