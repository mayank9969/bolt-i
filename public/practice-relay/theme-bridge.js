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
    if (!a || a.querySelector('.veyra-ui-mark')) return !!a
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('class', 'veyra-ui-mark')
    svg.setAttribute('viewBox', '0 0 48 48')
    svg.setAttribute('aria-hidden', 'true')
    svg.innerHTML =
      '<path d="M10 7.5 L24 40 L38 7.5" fill="none" stroke="currentColor" stroke-width="5.2" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M24 14 C28 18 31 22 24 28 C17 22 20 18 24 14Z" fill="#16827e"/>' +
      '<circle cx="24" cy="20" r="2.2" fill="#b3121b"/>'
    a.insertBefore(svg, a.firstChild)
    var star = a.querySelector('svg.text-cobalt, svg:not(.veyra-ui-mark)')
    if (star && star !== svg) star.remove()
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
