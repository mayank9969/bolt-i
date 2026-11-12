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
    { act: 'daily', n: '01', kicker: 'Begin', title: 'Try five', meta: 'Quick start · mixed' },
    { act: 'concepts', n: '02', kicker: 'Follow', title: 'Open a thread', meta: 'A guided concept' },
    { act: 'take', n: '03', kicker: 'Keep', title: 'Write a Take', meta: 'Private · unscored' },
    { act: 'lab', n: '04', kicker: 'Work', title: 'Open the Lab', meta: 'Sourced topics today' },
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

  function hideTapRow() {
    var nodes = document.querySelectorAll('p, button')
    for (var i = 0; i < nodes.length; i++) {
      var tx = (nodes[i].textContent || '').replace(/\s+/g, ' ')
      if (/spaces still open|still open ·|Clear my tile/i.test(tx)) {
        nodes[i].style.display = 'none'
      }
    }
  }

  function swapLeaveRoom() {
    if (document.querySelector('.v-puzzle')) {
      hideTapRow()
      return true
    }
    var target =
      document.querySelector('svg[aria-label*="geometric tiles"]') || document.querySelector('.v-leave-room-art')
    if (!target) return false
    var N = 3
    var src = new URL('leave-room.png', location.href).href
    var wrap = document.createElement('div')
    wrap.className = 'v-puzzle-wrap'
    var board = document.createElement('div')
    board.className = 'v-puzzle'
    board.style.setProperty('--n', String(N))
    var order = []
    var i
    for (i = 0; i < N * N; i++) order.push(i)
    for (i = order.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1))
      var tmp = order[i]
      order[i] = order[j]
      order[j] = tmp
    }
    var pick = -1
    function solved() {
      for (var k = 0; k < order.length; k++) if (order[k] !== k) return false
      return true
    }
    function paint() {
      board.innerHTML = ''
      order.forEach(function (piece, slot) {
        var cell = document.createElement('button')
        cell.type = 'button'
        cell.className = 'v-puzzle-cell' + (pick === slot ? ' is-pick' : '')
        var r = Math.floor(piece / N)
        var c = piece % N
        cell.style.backgroundImage = 'url("' + src + '")'
        cell.style.backgroundSize = N * 100 + '% ' + N * 100 + '%'
        cell.style.backgroundPosition = (N === 1 ? 0 : (c / (N - 1)) * 100) + '% ' + (N === 1 ? 0 : (r / (N - 1)) * 100) + '%'
        cell.title = 'Tap two pieces to swap'
        cell.addEventListener('click', function () {
          if (solved()) return
          if (pick < 0) {
            pick = slot
          } else if (pick === slot) {
            pick = -1
          } else {
            var a = order[pick]
            order[pick] = order[slot]
            order[slot] = a
            pick = -1
          }
          paint()
        })
        board.appendChild(cell)
      })
      how.textContent = solved() ? 'The picture holds.' : 'Tap a piece, then another to swap.'
      life.textContent = solved()
        ? 'You built it piece by piece.'
        : 'Puzzles are like life — they have to be made piece by piece.'
    }
    var how = document.createElement('p')
    how.className = 'v-puzzle-how'
    var life = document.createElement('p')
    life.className = 'v-puzzle-life'
    wrap.appendChild(board)
    target.replaceWith(wrap)
    var section = document.getElementById('leave-open')
    if (section) {
      section.appendChild(how)
    } else {
      wrap.appendChild(how)
    }
    var foot = document.querySelector('footer')
    if (foot) {
      var oldLife = foot.querySelector('.v-puzzle-life')
      if (oldLife) oldLife.remove()
      var curious = Array.from(foot.querySelectorAll('span, p')).find(function (n) {
        return /curious person/i.test(n.textContent || '')
      })
      if (curious && curious.parentElement) curious.parentElement.insertBefore(life, curious)
      else foot.insertBefore(life, foot.firstChild)
    } else if (section) {
      section.appendChild(life)
    }
    paint()
    hideTapRow()
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
      s.src = 'continue-anim.js?v=3'
      s.onload = go
      document.head.appendChild(s)
    }
    return true
  }

  function stripRelay() {
    ;['same-paper', 'your-hands', 'leave-open', 'crossings', 'subject', 'try-it'].forEach(function (id) {
      var el = document.getElementById(id)
      if (el) el.setAttribute('hidden', '')
    })
    var heads = document.querySelectorAll('h2, h3, p, span')
    for (var i = 0; i < heads.length; i++) {
      var tx = (heads[i].textContent || '').replace(/\s+/g, ' ').trim()
      if (
        /Missed questions|same paper|Changing Hands|NOT FINISHED|Take your place in the relay|LEAVE ROOM/i.test(
          tx,
        )
      ) {
        var block = heads[i].closest('section, article, div')
        if (block && block.id !== 'home' && block.id !== 'veyra-studio') {
          block.setAttribute('hidden', '')
        }
      }
    }
  }

  function boot() {
    wireActions()
    stripRelay()
    placeMarks()
    swapDaily()
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot)
  } else {
    boot()
  }

  var mo = new MutationObserver(function () {
    if (!document.getElementById('veyra-studio')) insertStudio()
    stripRelay()
    placeMarks()
    swapDaily()
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
