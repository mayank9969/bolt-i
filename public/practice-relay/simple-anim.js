/* The Question Continues — simple CSS film from the four stills. */
(function () {
  if (window.__veyraSimpleAnim) return
  window.__veyraSimpleAnim = true

  var DURATION = 5

  function mount(host) {
    if (!host || host.getAttribute('data-veyra-continue')) return
    host.setAttribute('data-veyra-continue', '1')
    host.classList.add('v-continue-host')

    host.innerHTML =
      '<div class="v-continue-frame">' +
      '<div class="v-continue-stage" title="Click to replay">' +
      '<img class="v-simple-img v-simple-scene" alt="" draggable="false" />' +
      '<img class="v-simple-img v-simple-man" alt="" draggable="false" />' +
      '<img class="v-simple-img v-simple-crowd" alt="" draggable="false" />' +
      '<img class="v-simple-img v-simple-orange" alt="" draggable="false" />' +
      '<div class="v-copy v-copy-a"><p class="v-kicker">01 — blend in</p><p class="v-line">Disappear into<br>the crowd?</p></div>' +
      '<div class="v-copy v-copy-b"><p class="v-kicker">02 — or</p><p class="v-stand">Stand<br><span class="v-out">out</span></p><p class="v-blank">Your page is still blank.</p></div>' +
      '<div class="v-bar"></div>' +
      '</div>' +
      '<div class="v-continue-cap"><span class="v-cap">The question begins</span><span class="v-time">0.0s / 5.0s · Replay ↻</span></div>' +
      '</div>'

    var stills = window.__veyraStills || {}
    function srcFor(key, file) {
      return stills[key] || '/practice-relay/anim/' + file
    }
    host.querySelector('.v-simple-scene').src = srcFor('scene', 'scene.jpg')
    host.querySelector('.v-simple-man').src = srcFor('man', 'man.jpg')
    host.querySelector('.v-simple-crowd').src = srcFor('crowd', 'crowd.jpg')
    host.querySelector('.v-simple-orange').src = srcFor('orange', 'orange.jpg')

    var stage = host.querySelector('.v-continue-stage')
    var cap = host.querySelector('.v-cap')
    var timeEl = host.querySelector('.v-time')
    var copyA = host.querySelector('.v-copy-a')
    var copyB = host.querySelector('.v-copy-b')
    var bar = host.querySelector('.v-bar')

    var start = performance.now()
    function replay() {
      start = performance.now()
      /* Restart CSS loops */
      var imgs = host.querySelectorAll('.v-simple-img')
      for (var i = 0; i < imgs.length; i++) {
        imgs[i].style.animation = 'none'
        void imgs[i].offsetWidth
        imgs[i].style.animation = ''
      }
      bar.style.animation = 'none'
      void bar.offsetWidth
      bar.style.animation = ''
    }
    stage.addEventListener('click', replay)
    timeEl.style.cursor = 'pointer'
    timeEl.addEventListener('click', replay)

    function tick(now) {
      requestAnimationFrame(tick)
      var live = (now - start) / 1000
      if (live >= DURATION) start = now
      var t = Math.min((now - start) / 1000, DURATION)
      var aOp = t < 2.3 ? 0 : t < 2.5 ? (t - 2.3) / 0.2 : t < 3.3 ? 1 : t < 3.65 ? 1 - (t - 3.3) / 0.35 : 0
      copyA.style.opacity = String(aOp)
      copyB.style.opacity = String(t > 3.6 ? 1 : 0)
      bar.style.width = (t / DURATION * 100) + '%'
      cap.textContent = t < 1.8 ? 'The question begins' : t < 3.3 ? 'Everyone is walking the same way' : t < 4.4 ? 'Someone just stepped out' : 'The question continues'
      timeEl.textContent = t.toFixed(1) + 's / 5.0s · Replay ↻'
    }
    requestAnimationFrame(tick)
  }

  window.veyraMountContinue = mount
})()
