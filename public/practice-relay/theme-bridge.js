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
    try {
      window.parent.postMessage({ type: 'veyra-practice-action', action: action }, location.origin)
    } catch (e) {}
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

  function wireActions() {
    insertStudio()
    var daily = document.querySelector('a[aria-label^="Daily challenge"]')
    if (daily) {
      daily.setAttribute('data-veyra-act', 'daily')
      wire(daily)
    }
    var acts = document.querySelectorAll('[data-veyra-act]')
    for (var j = 0; j < acts.length; j++) wire(acts[j])
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
    if (!art || art.getAttribute('data-veyra-art')) return !!art
    art.setAttribute('data-veyra-art', '1')
    art.innerHTML = ''
    var img = document.createElement('img')
    img.src = '/practice-relay/question-continues.png'
    img.alt = 'The question continues'
    img.className = 'v-ending-photo'
    art.appendChild(img)
    return true
  }

  function boot() {
    wireActions()
    placeMarks()
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
