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
    <div id="sceneStatus" class="scene-status">Loading the archipelago…</div>
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

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    loadStyle('/veyra-world/world.css')
    if (!root.querySelector('#world')) root.innerHTML = STAGE_HTML

    const w = window as unknown as { __VEYRA_SCENE?: boolean }
    if (w.__VEYRA_SCENE) return
    w.__VEYRA_SCENE = true

    ;(async () => {
      try {
        await loadScript('/veyra-world/assets/veyra-models/veyra-three.bundle.js')
        await loadScript('/veyra-world/scene.js')
      } catch (err) {
        console.error('Veyra world failed to start', err)
        const status = document.getElementById('sceneStatus')
        if (status) {
          status.textContent = 'The archipelago could not start.'
          status.classList.add('error')
        }
      }
    })()
  }, [])

  return <div ref={rootRef} className="veyra-html-root absolute inset-0 w-full h-full" />
}
