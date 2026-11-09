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

  function markImg() {
    var img = document.createElement('img')
    img.className = 'veyra-ui-mark'
    img.src = '/practice-relay/blade-mark.svg'
    img.alt = ''
    img.width = 36
    img.height = 42
    return img
  }

  function stripStars(host) {
    Array.prototype.forEach.call(host.querySelectorAll('svg'), function (el) {
      el.remove()
    })
  }

  function placeIn(host, where) {
    if (!host) return false
    stripStars(host)
    if (host.querySelector('.veyra-ui-mark')) return true
    var img = markImg()
    if (where === 'start') host.insertBefore(img, host.firstChild)
    else host.appendChild(img)
    return true
  }

  function placeMarks() {
    var nav = placeIn(document.querySelector('nav.sticky a[href="#home"]'), 'start')
    var foot = placeIn(document.querySelector('footer .font-poster'), 'end')
    return nav && foot
  }
  if (!placeMarks()) {
    var mo = new MutationObserver(function () {
      if (placeMarks()) mo.disconnect()
    })
    mo.observe(document.documentElement, { childList: true, subtree: true })
  }

  window.addEventListener('message', function (e) {
    if (e.source !== window.parent) return
    if (e.origin !== location.origin) return
    var d = e.data
    if (!d || d.type !== 'veyra-theme') return
    apply(d.theme)
  })
})()
