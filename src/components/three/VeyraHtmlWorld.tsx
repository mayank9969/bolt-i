import { useEffect, useRef } from 'react'

const STAGE_HTML = `
<section class="stage veyra-inpage-stage" id="stage" aria-label="Veyra archipelago">
  <canvas id="world"></canvas>
  <div class="hud">
    <div class="hint" hidden>15 connected islands</div>
    <div class="interaction" hidden></div>
    <div class="selected" id="selected"></div>
    <div class="focus-shade" id="focusShade"></div>
    <div class="focus-flash" id="focusFlash"></div>
    <div class="focus-story-cue" id="focusStoryCue"></div>
    <div class="focus-puzzle" id="focusPuzzle"><p id="focusPuzzleFeedback"></p></div>
    <div class="subject-info" id="subjectInfo">
      <button type="button" id="subjectInfoClose">Close</button>
      <div id="subjectInfoEyebrow"></div>
      <div id="subjectInfoTitle"></div>
      <div id="subjectInfoText"></div>
    </div>
    <div class="focus-graph" id="focusGraph">
      <div id="focusGraphLabel"></div>
      <canvas id="focusGraphCanvas"></canvas>
    </div>
    <div id="sceneStatus"></div>
  </div>
</section>
`

function loadStyle(href: string) {
  if (document.querySelector(`link[data-veyra-href="${href}"]`)) return
  const l = document.createElement('link')
  l.rel = 'stylesheet'
  l.href = href
  l.dataset.veyraHref = href
  document.head.appendChild(l)
}

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(`script[data-veyra-src="${src}"]`) as HTMLScriptElement | null
    if (existing?.dataset.ready === '1') {
      resolve()
      return
    }
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error(src)), { once: true })
      return
    }
    const s = document.createElement('script')
    s.src = src
    s.async = false
    s.dataset.veyraSrc = src
    s.onload = () => {
      s.dataset.ready = '1'
      resolve()
    }
    s.onerror = () => reject(new Error(src))
    document.head.appendChild(s)
  })
}

export default function VeyraHtmlWorld() {
  const rootRef = useRef<HTMLDivElement>(null)
  const booted = useRef(false)

  useEffect(() => {
    const root = rootRef.current
    if (!root || booted.current) return
    if (document.getElementById('world') && (window as unknown as { VeyraThree?: unknown }).VeyraThree && root.querySelector('canvas')?.dataset.live === '1') return
    booted.current = true
    loadStyle('/veyra-world/demo.css')
    loadStyle('/veyra-world/world.css')
    root.innerHTML = STAGE_HTML
    const canvas = root.querySelector('#world') as HTMLCanvasElement | null
    if (canvas) canvas.dataset.live = '1'

    let cancelled = false
    ;(async () => {
      try {
        await loadScript('/veyra-world/assets/veyra-models/veyra-three.bundle.js')
        await loadScript('/veyra-world/assets/veyra-models/veyra-models-data.js')
        if (cancelled) return
        const code = await fetch('/veyra-world/scene.js').then((r) => {
          if (!r.ok) throw new Error('scene.js')
          return r.text()
        })
        if (cancelled) return
        // scene.js is an async IIFE that reads #stage / #world from the document
        // eslint-disable-next-line no-new-func
        new Function(code)()
      } catch (err) {
        console.error('Veyra world failed to start', err)
        if (root && !cancelled) {
          root.innerHTML = '<p class="veyra-world-error">The archipelago could not start.</p>'
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div
      ref={rootRef}
      className="veyra-html-root absolute inset-0 w-full h-full"
      style={{ background: '#8eb8dc' }}
    />
  )
}
