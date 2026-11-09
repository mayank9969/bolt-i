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
    if (!el || el.getAttribute('data-veyra-act')) return
    el.setAttribute('data-veyra-act', action)
    el.addEventListener('click', function (e) {
      e.preventDefault()
      sendAction(action)
    })
  }

  function wireActions() {
    wire(document.querySelector('a[aria-label^="Daily challenge"]'), 'daily')
    var heads = document.querySelectorAll('h3')
    for (var i = 0; i < heads.length; i++) {
      if (!/Missed questions/i.test(heads[i].textContent || '')) continue
      var box = heads[i].closest('div.mt-14') || heads[i]
      box.style.cursor = 'pointer'
      wire(box, 'missed')
    }
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
