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
    .catch(function () {
      /* keep wordmark */
    })

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
    } catch (e) {
      /* ignore */
    }
  }

  function wire(el, action) {
    if (!el || el.getAttribute('data-veyra-wired')) return
    el.setAttribute('data-veyra-wired', '1')
    if (action) el.setAttribute('data-veyra-act', action)
    el.addEventListener('click', function (e) {
      e.preventDefault()
      sendAction(el.getAttribute('data-veyra-act'))
    })
  }

  var STUDIO = [
    {
      act: 'daily',
      n: '01',
      title: 'Daily challenge',
      body: 'A five-question sitting drawn now from the whole bank, mixed difficulty. The engine picks live items; nothing is stored as “today’s paper” in the browser. Confirm on Setup, then start — scoring stays on the server.',
      cta: 'Start today’s five',
    },
    {
      act: 'missed',
      n: '02',
      title: 'Missed questions',
      body: 'If a region’s latest attempt still has wrong answers, this opens Setup on that island for a fresh five. History has no item-level keys, so we do not replay a stored miss list. If nothing is flagged, you go to History instead.',
      cta: 'Revisit misses',
    },
    {
      act: 'focus',
      n: '03',
      title: 'Focus skill',
      body: 'Choose one island and one tier. Same quiz path as Home — questions and marks come from the server, never from a client key.',
      cta: 'Pick a region',
    },
    {
      act: 'concepts',
      n: '04',
      title: 'Concept studio',
      body: 'A lesson that rotates with the day: analogy, idea, a small check. It is not scored by the quiz engine. Checks stay in this browser.',
      cta: 'Open the studio',
    },
    {
      act: 'take',
      n: '05',
      title: 'Today’s take',
      body: 'A prompt for a view in your own words. Unscored and private to this device. Gemini reflection from the desktop tool is not connected here — there is no send.',
      cta: 'Write today’s take',
    },
    {
      act: 'lab',
      n: '06',
      title: 'Four-day lab',
      body: 'Four short sittings already on the site, each opening the live quiz on one island. Not a new engine mode.',
      cta: 'Open the lab',
    },
    {
      act: 'history',
      n: '07',
      title: 'History',
      body: 'Every sitting the engine has stored — category, tier, marks. Nothing is invented if the file is empty.',
      cta: 'Read history',
    },
    {
      act: 'progress',
      n: '08',
      title: 'Progress',
      body: 'The same history, spoken as summaries rather than a ledger. Weakest region, when there is one, is a link back into Setup.',
      cta: 'See progress',
    },
  ]

  function insertStudio() {
    if (document.getElementById('veyra-studio')) return true
    var main = document.querySelector('main')
    if (!main) return false
    var sec = document.createElement('section')
    sec.id = 'veyra-studio'
    sec.className = 'container-v'
    var tiles = STUDIO.map(function (item) {
      return (
        '<button type="button" class="veyra-studio-tile" data-veyra-act="' +
        item.act +
        '">' +
        '<span class="veyra-studio-art" aria-hidden="true"></span>' +
        '<span class="mono-label">' +
        item.n +
        '</span>' +
        '<strong class="veyra-studio-title">' +
        item.title +
        '</strong>' +
        '<span class="veyra-studio-body">' +
        item.body +
        '</span>' +
        '</button>'
      )
    }).join('')
    sec.innerHTML =
      '<div class="mono-label">The sitting</div>' +
      '<h2 class="serif-display veyra-studio-h">What you can do here.</h2>' +
      '<p class="veyra-studio-lead">Live paths into the quiz engine and the studio. Empty frames below are for illustrations still to come.</p>' +
      '<div class="veyra-studio-grid">' +
      tiles +
      '</div>'
    var home = document.getElementById('home')
    if (home && home.parentNode === main) main.insertBefore(sec, home.nextSibling)
    else main.insertBefore(sec, main.firstChild)
    return true
  }

  function wireActions() {
    insertStudio()
    wire(document.querySelector('a[aria-label^="Daily challenge"]'), 'daily')
    var heads = document.querySelectorAll('h3')
    for (var i = 0; i < heads.length; i++) {
      if (!/Missed questions/i.test(heads[i].textContent || '')) continue
      var box = heads[i].closest('div.mt-14') || heads[i]
      box.style.cursor = 'pointer'
      wire(box, 'missed')
    }
    var acts = document.querySelectorAll('[data-veyra-act]')
    for (var j = 0; j < acts.length; j++) wire(acts[j], acts[j].getAttribute('data-veyra-act'))
  }

  var mo = new MutationObserver(function () {
    wireActions()
    if (placeMarks()) {
      /* footer mark is in; keep watching for late Daily badge */
    }
  })
  mo.observe(document.documentElement, { childList: true, subtree: true })
  wireActions()

  window.addEventListener('message', function (e) {
    if (e.source !== window.parent) return
    if (e.origin !== location.origin) return
    var d = e.data
    if (!d || d.type !== 'veyra-theme') return
    apply(d.theme)
  })
})()
