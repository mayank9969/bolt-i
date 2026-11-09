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

  function placeMark() {
    var a = document.querySelector('nav.sticky a[href="#home"]')
    if (!a) return false
    if (a.querySelector('.veyra-ui-mark')) {
      Array.prototype.forEach.call(a.querySelectorAll('svg:not(.veyra-ui-mark)'), function (el) {
        el.remove()
      })
      return true
    }
    var img = document.createElement('img')
    img.className = 'veyra-ui-mark'
    img.src = '/practice-relay/blade-mark.svg'
    img.alt = ''
    img.width = 36
    img.height = 42
    a.insertBefore(img, a.firstChild)
    Array.prototype.forEach.call(a.querySelectorAll('svg'), function (el) {
      el.remove()
    })
    return true
  }
  if (!placeMark()) {
    var mo = new MutationObserver(function () {
      if (placeMark()) mo.disconnect()
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
