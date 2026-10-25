import { useEffect, useRef } from 'react'

const STAGE_HTML = `
<section class="stage veyra-inpage-stage" id="stage" aria-label="Veyra archipelago">
  <canvas id="world"></canvas>
  <div class="hud">
    <div class="hint">15 connected islands · a world of ideas</div>
    <div class="interaction">Move your cursor to look · Select an island</div>
    <div class="selected" id="selected"></div>
    <div class="focus-shade" id="focusShade" aria-hidden="true"></div>
    <div class="focus-flash" id="focusFlash" aria-hidden="true"></div>
    <div class="focus-story-cue" id="focusStoryCue" aria-live="polite"></div>
    <aside class="focus-puzzle" id="focusPuzzle" aria-hidden="true">
      <strong>Assemble the discovery</strong>
      <div class="focus-puzzle-buttons">
        <button type="button" data-step="0">Observe</button>
        <button type="button" data-step="1">Compare</button>
        <button type="button" data-step="2">Connect</button>
      </div>
      <p id="focusPuzzleFeedback">Choose the steps in order to reveal the final clue.</p>
    </aside>
    <article class="subject-info" id="subjectInfo" role="dialog" aria-modal="true" aria-hidden="true" aria-labelledby="subjectInfoTitle">
      <button class="focus-close" id="subjectInfoClose" type="button" aria-label="Close subject details">×</button>
      <span class="eyebrow" id="subjectInfoEyebrow">Island field note</span>
      <h2 id="subjectInfoTitle"></h2>
      <p id="subjectInfoText"></p>
      <aside class="focus-graph" id="focusGraph" aria-hidden="true">
        <span class="focus-graph-label" id="focusGraphLabel"></span>
        <div id="focusGraphCanvas"></div>
        <div class="focus-graph-status">The 3D story works without the graph connection.</div>
      </aside>
    </article>
    <div class="scene-status" id="sceneStatus" role="status">Preparing the 3D archipelago…</div>
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
