/* The Question Continues — 5s stills animation (scene / man / crowd / orange). */
(function () {
  if (window.__veyraContinueAnim) return
  window.__veyraContinueAnim = true

  var DURATION = 5
  var Q_PATH = 'M 14 50 C 14 8, 82 6, 84 46 C 86 82, 48 90, 46 118 L 46 128'
  var BASE = '/practice-relay/anim/'

  function clamp(x, a, b) {
    if (a === undefined) a = 0
    if (b === undefined) b = 1
    return Math.min(b, Math.max(a, x))
  }
  function seg(t, a, b) {
    return clamp((t - a) / (b - a))
  }
  function lerp(a, b, k) {
    return a + (b - a) * k
  }
  function easeInOut(x) {
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2
  }
  function easeOut(x) {
    return 1 - Math.pow(1 - x, 3)
  }
  function easeIn(x) {
    return x * x * x
  }
  function easeOutBack(x) {
    var c1 = 1.70158
    var c3 = c1 + 1
    return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2)
  }

  function mount(host) {
    if (!host || host.getAttribute('data-veyra-continue')) return
    host.setAttribute('data-veyra-continue', '1')
    host.innerHTML = ''
    host.classList.add('v-continue-host')

    host.innerHTML =
      '<svg width="0" height="0" aria-hidden="true" style="position:absolute">' +
      '<defs>' +
      '<filter id="v-boil" x="-5%" y="-5%" width="110%" height="110%">' +
      '<feTurbulence id="v-boil-n" type="fractalNoise" baseFrequency="0.011 0.014" numOctaves="2" seed="3" result="n"/>' +
      '<feDisplacementMap in="SourceGraphic" in2="n" scale="7"/>' +
      '</filter>' +
      '<filter id="v-rough" x="-20%" y="-20%" width="140%" height="140%">' +
      '<feTurbulence id="v-rough-n" type="fractalNoise" baseFrequency="0.09" numOctaves="2" seed="2" result="n"/>' +
      '<feDisplacementMap in="SourceGraphic" in2="n" scale="2.6"/>' +
      '</filter>' +
      '</defs></svg>' +
      '<div class="v-continue-frame">' +
      '<div class="v-continue-stage" title="Click to replay">' +
      '<div class="v-continue-rig">' +
      '<div class="v-sc">' +
      '<img class="v-sc-img" alt="" draggable="false"/>' +
      '<div class="v-mist v-mist-a"></div><div class="v-mist v-mist-b"></div>' +
      '<div class="v-man"><img class="v-man-img" alt="" draggable="false"/></div>' +
      '<svg class="v-q-draw" viewBox="0 0 1568 1045" preserveAspectRatio="none">' +
      '<g transform="translate(1218 452) scale(1.75)" class="v-q-g"></g></svg>' +
      '</div>' +
      '<div class="v-crowd"><div class="v-crowd-in"><img class="v-crowd-img" alt="" draggable="false"/></div></div>' +
      '<div class="v-ring"></div><div class="v-glow"></div>' +
      '<div class="v-orange"><img class="v-orange-img" alt="" draggable="false"/></div>' +
      '<canvas class="v-dust"></canvas>' +
      '</div>' +
      '<div class="v-copy v-copy-a"><p class="v-kicker">01 — blend in</p><p class="v-line">Disappear into<br>the crowd?</p></div>' +
      '<div class="v-copy v-copy-b"><p class="v-kicker">02 — or</p><p class="v-stand">Stand<br><span class="v-out">out</span></p><p class="v-blank">Your page is still blank.</p></div>' +
      '<div class="v-grain"></div><div class="v-vig"></div><div class="v-cover"></div>' +
      '<div class="v-bar"></div>' +
      '</div>' +
      '<div class="v-continue-cap"><span class="v-cap">The question begins</span><span class="v-time">0.0s / 5.0s · Replay ↻</span></div>' +
      '</div>'

    var qg = host.querySelector('.v-q-g')
    qg.innerHTML =
      '<path class="v-qp" d="' +
      Q_PATH +
      '" pathLength="1" fill="none" stroke="#c4302b" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 1" filter="url(#v-rough)"/>' +
      '<g class="v-qd" transform="translate(46 152)"><circle r="8.5" fill="#c4302b"/></g>'

    host.querySelector('.v-sc-img').src = BASE + 'scene.jpg'
    host.querySelector('.v-man-img').src = BASE + 'man.jpg'
    host.querySelector('.v-crowd-img').src = BASE + 'crowd.jpg'
    host.querySelector('.v-orange-img').src = BASE + 'orange.jpg'

    var stage = host.querySelector('.v-continue-stage')
    var rig = host.querySelector('.v-continue-rig')
    var sc = host.querySelector('.v-sc')
    var man = host.querySelector('.v-man')
    var crowd = host.querySelector('.v-crowd')
    var crowdIn = host.querySelector('.v-crowd-in')
    var ring = host.querySelector('.v-ring')
    var glow = host.querySelector('.v-glow')
    var orange = host.querySelector('.v-orange')
    var cover = host.querySelector('.v-cover')
    var bar = host.querySelector('.v-bar')
    var cap = host.querySelector('.v-cap')
    var timeEl = host.querySelector('.v-time')
    var copyA = host.querySelector('.v-copy-a')
    var copyB = host.querySelector('.v-copy-b')
    var qp = host.querySelector('.v-qp')
    var qd = host.querySelector('.v-qd')
    var boil = host.querySelector('#v-boil-n')
    var rough = host.querySelector('#v-rough-n')
    var cv = host.querySelector('.v-dust')
    var mistA = host.querySelector('.v-mist-a')
    var mistB = host.querySelector('.v-mist-b')

    var specks = []
    var s = 7
    function rnd() {
      s = (s + 0x6d2b79f5) >>> 0
      var t = s
      t = Math.imul(t ^ (t >>> 15), t | 1)
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
    for (var i = 0; i < 70; i++) {
      specks.push({
        x: rnd(),
        y: rnd(),
        vx: (rnd() - 0.5) * 0.02,
        size: 0.6 + rnd() * 2.6,
        alpha: 0.25 + rnd() * 0.6,
        ph: rnd() * 6.28,
        rise: 0.4 + rnd() * 0.9,
      })
    }

    var start = performance.now()
    var lastBoil = -1
    var prev = start
    var raf = 0
    var playing = false

    function replay() {
      start = performance.now()
      playing = true
    }

    function tick(now) {
      raf = requestAnimationFrame(tick)
      if (!playing) return
      var live = (now - start) / 1000
      var dt = Math.min(0.05, (now - prev) / 1000)
      prev = now
      var t = Math.min(live, DURATION)
      var W = stage.clientWidth || 800

      var step = Math.floor(live * 10)
      if (step !== lastBoil) {
        lastBoil = step
        if (boil) boil.setAttribute('seed', String((step * 7) % 23))
        if (rough) rough.setAttribute('seed', String((step * 5) % 17))
      }

      rig.style.transform =
        'scale(1.012) translate(' +
        Math.sin(live * 1.7) * 0.12 +
        '%, ' +
        Math.cos(live * 1.3) * 0.1 +
        '%) rotate(' +
        Math.sin(live * 0.9) * 0.08 +
        'deg)'

      var coverOp = 1 - easeOut(seg(t, 0, 0.55))
      cover.style.opacity = String(coverOp)

      var sceneScale = 1 + 0.1 * easeOut(seg(t, 0, 1.8)) + 0.55 * easeIn(seg(t, 1.8, 2.7))
      var sceneOp = 1 - seg(t, 2.65, 2.75)
      sc.style.display = t < 2.8 ? 'block' : 'none'
      sc.style.opacity = String(sceneOp)
      sc.style.transform = 'scale(' + sceneScale + ')'

      var walk = easeOut(seg(t, 0, 1.8))
      var stride = 1 - seg(t, 1.2, 1.8)
      man.style.left = lerp(33, 36.5, walk) + '%'
      man.style.bottom = lerp(8, 17, walk) + '%'
      man.style.height = lerp(66, 57, walk) + '%'
      man.style.opacity = String(easeOut(seg(t, 0.05, 0.6)))
      man.style.transform =
        'translate(-50%, ' + Math.sin(live * 11) * 0.55 * stride + '%) rotate(' + Math.sin(live * 5.5) * 0.9 * stride + 'deg)'

      var qP = easeInOut(seg(t, 0.4, 1.4))
      var qDot = easeOutBack(seg(t, 1.42, 1.62))
      qp.style.strokeDashoffset = String(1 - qP)
      qd.style.transform = 'translate(46px, 152px) scale(' + Math.max(0, qDot) + ')'

      mistA.style.left = -30 + live * 3 + '%'
      mistB.style.left = 60 - live * 2.4 + '%'

      var b = easeInOut(seg(t, 1.8, 2.65))
      var R = b * 1.4 * W
      crowd.style.display = b > 0 ? 'block' : 'none'
      crowd.style.webkitMaskImage =
        'radial-gradient(circle at 87% 58%, #000 ' + (R * 0.82).toFixed(1) + 'px, transparent ' + R.toFixed(1) + 'px)'
      crowd.style.maskImage = crowd.style.webkitMaskImage
      var dim = easeInOut(seg(t, 3.2, 4.0))
      crowd.style.opacity = String(1 - 0.82 * dim)
      crowd.style.filter = dim > 0 ? 'grayscale(' + 0.85 * dim + ') blur(' + 2.6 * dim + 'px)' : 'none'
      var crowdScale = (1.34 - 0.3 * easeOut(seg(t, 1.8, 3.3))) * (1 + 0.025 * seg(t, 3.0, 5)) * (1 - 0.06 * dim)
      crowdIn.style.transform =
        'translate(' +
        Math.sin(live * 1.9) * 0.2 +
        '%, 0) rotate(' +
        Math.sin(live * 1.3) * 0.12 +
        'deg) scale(' +
        crowdScale * (1 + Math.sin(live * 2.4) * 0.0035) +
        ')'

      var ringOp = b > 0 ? 1 - seg(b, 0.82, 1) : 0
      ring.style.opacity = String(ringOp)
      ring.style.background =
        'radial-gradient(circle at 87% 58%, transparent ' +
        (R * 0.72).toFixed(1) +
        'px, rgba(36,30,28,.32) ' +
        (R * 0.92).toFixed(1) +
        'px, transparent ' +
        (R * 1.1 + 6).toFixed(1) +
        'px)'

      var oIn = seg(t, 3.25, 4.0)
      var oOp = easeOut(seg(t, 3.25, 3.7))
      var oX = lerp(50, 29, easeInOut(seg(t, 3.75, 4.6)))
      var oRise = easeOutBack(oIn)
      var g = easeOut(seg(t, 3.4, 4.3))
      glow.style.opacity = String(g)
      glow.style.background =
        'radial-gradient(ellipse 38% 62% at ' + oX + '% 52%, rgba(255,150,50,' + 0.34 * g + '), transparent 80%)'
      orange.style.opacity = String(oOp)
      orange.style.left = oX + '%'
      orange.style.transform =
        'translate(-50%, ' + (1 - clamp(oRise, 0, 1.15)) * 9 + '%) scale(' + (0.92 + 0.08 * clamp(oRise, 0, 1.2)) + ')'
      orange.style.display = oOp > 0.01 ? 'block' : 'none'

      var bTextOp = easeOut(seg(t, 2.3, 2.5)) * (1 - easeIn(seg(t, 3.3, 3.65)))
      copyA.style.opacity = String(bTextOp)
      copyB.style.opacity = String(t > 3.6 ? 1 : 0)

      bar.style.width = (t / DURATION) * 100 + '%'
      var caption =
        t < 1.8 ? 'The question begins' : t < 3.3 ? 'Everyone is walking the same way' : t < 4.4 ? 'Someone just stepped out' : 'The question continues'
      cap.textContent = caption
      timeEl.textContent = t.toFixed(1) + 's / 5.0s · Replay ↻'

      var ctx = cv.getContext('2d')
      if (ctx) {
        var w = cv.clientWidth
        var h = cv.clientHeight
        var dpr = Math.min(2, window.devicePixelRatio || 1)
        if (cv.width !== Math.round(w * dpr)) {
          cv.width = Math.round(w * dpr)
          cv.height = Math.round(h * dpr)
        }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        ctx.clearRect(0, 0, w, h)
        var m = easeInOut(seg(t, 3.3, 3.95))
        var intensity = lerp(0.3, 1, seg(t, 1.8, 2.6))
        for (var k = 0; k < specks.length; k++) {
          var sp = specks[k]
          var vy = lerp(0.018 * sp.rise, -0.05 * sp.rise, m)
          sp.x += (sp.vx + Math.sin(live * 0.8 + sp.ph) * 0.004) * dt
          sp.y += vy * dt
          if (sp.y > 1.02) sp.y = -0.02
          if (sp.y < -0.02) sp.y = 1.02
          if (sp.x < -0.02) sp.x = 1.02
          if (sp.x > 1.02) sp.x = -0.02
          var flick = 0.6 + 0.4 * Math.sin(live * 3 + sp.ph * 4)
          var aDust = sp.alpha * 0.45 * intensity * (1 - m)
          var aEmber = sp.alpha * 0.9 * m * flick * seg(t, 3.5, 4.2)
          if (aDust > 0.01) {
            ctx.fillStyle = 'rgba(38,33,30,' + aDust + ')'
            ctx.beginPath()
            ctx.ellipse(sp.x * w, sp.y * h, sp.size * 0.8, sp.size * 1.9, 0.5, 0, 6.3)
            ctx.fill()
          }
          if (aEmber > 0.01) {
            ctx.fillStyle = 'rgba(255,' + (110 + sp.ph * 8) + ',40,' + aEmber + ')'
            ctx.beginPath()
            ctx.arc(sp.x * w, sp.y * h, sp.size * 0.9, 0, 6.3)
            ctx.fill()
          }
        }
      }
    }

    stage.addEventListener('click', replay)
    timeEl.style.cursor = 'pointer'
    timeEl.addEventListener('click', replay)

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting && !playing) replay()
        })
      },
      { threshold: 0.35 },
    )
    io.observe(stage)
    raf = requestAnimationFrame(tick)
  }

  window.veyraMountContinue = mount
})()
