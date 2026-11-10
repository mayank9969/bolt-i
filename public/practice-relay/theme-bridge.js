/* VEYRA Practice ↔ parent Paper/Ink. Same-origin only. Does not touch story art. */
(function () {
  var ALLOWED = { paper: 1, ink: 1 }

  function apply(theme) {
    if (!ALLOWED[theme]) theme = 'paper'
    document.documentElement.setAttribute('data-theme', theme)
  }

  function fromParent() {
    try {
      var t = window.parent && window.parent.document.documentElement.getAttribute('data-theme')
      if (ALLOWED[t]) return t
    } catch (e) {
      /* cross-origin */
    }
    try {
      var q = new URLSearchParams(location.search).get('theme')
      if (ALLOWED[q]) return q
    } catch (e2) {
      /* ignore */
    }
    return 'paper'
  }

  apply(fromParent())

  document.addEventListener(
    'pointermove',
    function (e) {
      var t = e.target
      var hover = false
      try {
        hover = !!(t && t.closest && t.closest('a, button, input, textarea, [role="button"], [data-veyra-act], canvas'))
      } catch (err) {}
      try {
        window.parent.postMessage({ type: 'veyra-cursor', x: e.clientX, y: e.clientY, hover: hover }, '*')
      } catch (err2) {}
    },
    { passive: true },
  )

  if (!document.querySelector('link[href="/practice-relay/veyra-mark.css"]')) {
    var link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = '/practice-relay/veyra-mark.css'
    document.head.appendChild(link)
  }

  var markSvg = ''
  fetch('/practice-relay/blade-mark-live.svg')
    .then(function (r) {
      return r.text()
    })
    .then(function (t) {
      markSvg = t
      placeMarks()
    })
    .catch(function () {})

  function realMark(size) {
    var wrap = document.createElement('div')
    wrap.className = 'veyra-mark nofield is-settled veyra-ui-mark'
    wrap.style.setProperty('--vm-size', size + 'px')
    wrap.setAttribute('aria-hidden', 'true')
    wrap.innerHTML = markSvg
    return wrap
  }

  function placeMarks() {
    if (!markSvg) return false
    var foot = document.querySelector('footer .font-poster')
    if (!foot) return false
    Array.prototype.forEach.call(foot.querySelectorAll('svg'), function (el) {
      if (el.closest('.veyra-mark')) return
      el.remove()
    })
    if (!foot.querySelector('.veyra-mark')) {
      foot.insertBefore(realMark(56), foot.firstChild)
    }
    return true
  }

  function sendAction(action) {
    if (!action) return
    var msg = { type: 'veyra-practice-action', action: action }
    try {
      window.parent.postMessage(msg, '*')
    } catch (e) {
      try {
        window.parent.postMessage(msg, location.origin)
      } catch (e2) {}
    }
  }

  function wire(el) {
    if (!el || el.getAttribute('data-veyra-wired')) return
    el.setAttribute('data-veyra-wired', '1')
    el.addEventListener('click', function (e) {
      e.preventDefault()
      sendAction(el.getAttribute('data-veyra-act'))
    })
  }

  var STUDIO = [
    { act: 'daily', n: '01', kicker: 'Begin', title: 'Try five', meta: 'Mixed subjects' },
    { act: 'concepts', n: '02', kicker: 'Follow', title: 'Open a thread', meta: 'Concept studio' },
    { act: 'take', n: '03', kicker: 'Keep', title: 'Write a take', meta: 'Private · unscored' },
    { act: 'history', n: '04', kicker: 'Return', title: 'Find your trail', meta: 'Sittings so far' },
    { act: 'lab', n: '05', kicker: 'Work', title: 'Open the lab', meta: 'Form and scores' },
    { act: 'missed', n: '06', kicker: 'Repair', title: 'Missed topics', meta: 'What still slips' },
    { act: 'focus', n: '07', kicker: 'Aim', title: 'A longer sitting', meta: 'Pick subject and length' },
    { act: 'progress', n: '08', kicker: 'Chart', title: 'See the line', meta: 'Progress over time' },
  ]

  function insertStudio() {
    var existing = document.getElementById('veyra-studio')
    if (
      existing &&
      existing.querySelectorAll('.veyra-studio-cell').length === STUDIO.length &&
      existing.querySelector('.veyra-studio-play')
    )
      return true
    if (existing) existing.remove()
    var main = document.querySelector('main')
    if (!main) return false
    var sec = document.createElement('section')
    sec.id = 'veyra-studio'
    sec.className = 'container-v'
    var cells = ''
    for (var i = 0; i < STUDIO.length; i++) {
      var item = STUDIO[i]
      cells +=
        '<li>' +
        '<button type="button" class="veyra-studio-cell" data-veyra-act="' +
        item.act +
        '">' +
        '<span class="veyra-studio-num">' +
        item.n +
        '</span>' +
        '<span class="veyra-studio-kicker">' +
        item.kicker +
        '</span>' +
        '<strong class="veyra-studio-title">' +
        item.title +
        '</strong>' +
        '<span class="veyra-studio-meta">' +
        item.meta +
        '</span>' +
        '<span class="veyra-studio-play">Play</span></button></li>'
    }
    sec.innerHTML =
      '<div class="veyra-studio-head">' +
      '<p class="mono-label">The question has eight exits</p>' +
      '<p class="mono-label veyra-studio-aside">Start anywhere · return when you like</p>' +
      '</div>' +
      '<ol class="veyra-studio-collage">' +
      cells +
      '</ol>'
    var home = document.getElementById('home')
    if (home && home.parentNode === main) main.insertBefore(sec, home.nextSibling)
    else main.insertBefore(sec, main.firstChild)
    return true
  }

  if (!window.__veyraStudioClick) {
    window.__veyraStudioClick = true
    document.addEventListener(
      'click',
      function (e) {
        var t = e.target
        if (!t || !t.closest) return
        var el = t.closest('[data-veyra-act]')
        if (!el) return
        e.preventDefault()
        sendAction(el.getAttribute('data-veyra-act'))
      },
      true,
    )
  }

  function swapDaily() {
    var daily = document.querySelector('a[aria-label^="Daily challenge"]')
    if (!daily) return false
    daily.setAttribute('data-veyra-act', 'daily')
    if (daily.getAttribute('data-veyra-art')) return true
    daily.setAttribute('data-veyra-art', '1')
    daily.classList.add('v-daily-disc')
    daily.innerHTML = ''
    var img = document.createElement('img')
    img.src = '/practice-relay/daily-elsewhere.png'
    img.alt = 'Daily challenge — five questions, mixed subjects'
    img.className = 'v-daily-moon'
    daily.appendChild(img)
    return true
  }

  function wireActions() {
    insertStudio()
    swapDaily()
  }

  function swapLeaveRoom() {
    var svg = document.querySelector('svg[aria-label*="geometric tiles"]')
    if (!svg || svg.getAttribute('data-veyra-art')) return !!document.querySelector('.v-leave-room-art')
    var img = document.createElement('img')
    img.className = 'v-leave-room-art'
    img.src = '/practice-relay/leave-room.png'
    img.alt = 'Puzzle portrait — leave room for the next'
    svg.setAttribute('data-veyra-art', '1')
    svg.replaceWith(img)
    return true
  }

  function swapEnding() {
    var art = document.querySelector('.v-ending-art')
    if (!art) return false
    if (art.getAttribute('data-veyra-art') === 'anim') return true
    art.setAttribute('data-veyra-art', 'anim')
    function go() {
      if (window.veyraMountContinue) window.veyraMountContinue(art)
    }
    if (window.veyraMountContinue) go()
    else {
      var s = document.createElement('script')
      s.src = 'continue-anim.js?v=2'
      s.onload = go
      document.head.appendChild(s)
    }
    return true
  }

  function boot() {
    wireActions()
    placeMarks()
    swapDaily()
    swapLeaveRoom()
    swapEnding()
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot)
  } else {
    boot()
  }

  var mo = new MutationObserver(function () {
    if (!document.getElementById('veyra-studio')) insertStudio()
    placeMarks()
    swapDaily()
    swapLeaveRoom()
    swapEnding()
    var acts = document.querySelectorAll('[data-veyra-act]')
    for (var j = 0; j < acts.length; j++) wire(acts[j])
  })
  mo.observe(document.documentElement, { childList: true, subtree: true })

  window.addEventListener('message', function (e) {
    if (e.source !== window.parent) return
    if (e.origin !== location.origin) return
    var d = e.data
    if (!d || d.type !== 'veyra-theme') return
    apply(d.theme)
  })
})()
