import { EYE_FRAGMENT_SHADER, EYE_VERTEX_SHADER } from './curiousEyeShader'
import { OcularMindEngine } from './ocularMind'
import { OcularAudioEngine } from './ocularAudio'

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader)
    return null
  }
  return shader
}

export function startEye(canvas: HTMLCanvasElement, onLabel: (s: string) => void) {
  const mind = new OcularMindEngine()
  mind.setPreset('autonomous')
  const audio = new OcularAudioEngine()
  mind.onSaccade = (amp, cur, unc) => audio.playSaccadePulse(amp, cur, unc)
  mind.onRipple = (intensity) => audio.playRippleChime(intensity)

  let gl: WebGLRenderingContext | null = null
  try {
    gl = (canvas.getContext('webgl', { antialias: false, alpha: false, depth: false }) ||
      canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null
  } catch {
    gl = null
  }

  let program: WebGLProgram | null = null
  const loc: Record<string, WebGLUniformLocation | null> = {}
  if (gl) {
    const vs = compile(gl, gl.VERTEX_SHADER, EYE_VERTEX_SHADER)
    const fs = compile(gl, gl.FRAGMENT_SHADER, EYE_FRAGMENT_SHADER)
    if (vs && fs) {
      program = gl.createProgram()
      if (program) {
        gl.attachShader(program, vs)
        gl.attachShader(program, fs)
        gl.linkProgram(program)
        if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
          gl.useProgram(program)
          const buf = gl.createBuffer()
          gl.bindBuffer(gl.ARRAY_BUFFER, buf)
          gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW)
          const pos = gl.getAttribLocation(program, 'aPosition')
          gl.enableVertexAttribArray(pos)
          gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0)
          ;[
            'uResolution',
            'uTime',
            'uGaze',
            'uTorsion',
            'uPupilRadius',
            'uPupilVel',
            'uPupilEcc',
            'uFluidWobble',
            'uRipplePhase',
            'uRippleAmp',
            'uStromaTension',
            'uCuriosity',
            'uUncertainty',
            'uWonder',
            'uStartle',
            'uMacroZoom',
            'uTearWave',
            'uStarburst',
            'uFocusPoint',
            'uFocusGlow',
          ].forEach((name) => {
            loc[name] = gl!.getUniformLocation(program!, name)
          })
        } else {
          program = null
          gl = null
        }
      }
    } else {
      gl = null
    }
  }

  const fit = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = Math.max(1, Math.floor((canvas.clientWidth || 320) * dpr))
    const h = Math.max(1, Math.floor((canvas.clientHeight || 320) * dpr))
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w
      canvas.height = h
    }
    gl?.viewport(0, 0, canvas.width, canvas.height)
  }
  fit()

  const toNorm = (cx: number, cy: number) => {
    const r = canvas.getBoundingClientRect()
    const nx = ((cx - r.left) / Math.max(1, r.width)) * 2 - 1
    const ny = -(((cy - r.top) / Math.max(1, r.height)) * 2 - 1)
    return { nx, ny }
  }

  let lastPtr = performance.now()
  let lastTap = 0
  const move = (e: PointerEvent) => {
    const now = performance.now()
    const dt = (now - lastPtr) / 1000
    lastPtr = now
    const { nx, ny } = toNorm(e.clientX, e.clientY)
    mind.onPointerMove(nx, ny, dt)
  }
  const down = (e: PointerEvent) => {
    const now = performance.now()
    if (now - lastTap < 280) mind.onDoubleTap()
    lastTap = now
    const { nx, ny } = toNorm(e.clientX, e.clientY)
    mind.onPointerDown(nx, ny)
  }

  window.addEventListener('pointermove', move, { passive: true })
  canvas.addEventListener('pointerdown', down)
  window.addEventListener('pointerup', () => mind.onPointerUp())
  window.addEventListener('resize', fit)

  let raf = 0
  let prev = performance.now()
  let lastLabel = 0
  const loop = (now: number) => {
    const dt = (now - prev) / 1000
    prev = now
    const state = mind.step(dt)
    const tel = mind.getTelemetry()
    if (now - lastLabel > 4200) {
      lastLabel = now
      const startle = state.startle > 0.45
      const label = startle
        ? "who's there?"
        : tel.phase === 'uncertain_hesitation'
          ? 'is it safe?'
          : tel.phase === 'deep_wonder'
            ? 'i want to know everything.'
            : tel.wonder > 0.7
              ? 'closer…'
              : tel.curiosity > 0.75
                ? 'curious…'
                : 'hmm…'
      onLabel(label)
    }
    if (gl && program) {
      gl.useProgram(program)
      gl.uniform2f(loc.uResolution, canvas.width, canvas.height)
      gl.uniform1f(loc.uTime, state.time)
      gl.uniform2f(loc.uGaze, state.gazeX, state.gazeY)
      gl.uniform1f(loc.uTorsion, state.irisTorsion)
      gl.uniform1f(loc.uPupilRadius, state.pupilRadius)
      gl.uniform1f(loc.uPupilVel, state.pupilVelocity)
      gl.uniform2f(loc.uPupilEcc, state.pupilEccentricityX, state.pupilEccentricityY)
      gl.uniform1f(loc.uFluidWobble, state.irisFluidWobble)
      gl.uniform1f(loc.uRipplePhase, state.irisRipplePhase)
      gl.uniform1f(loc.uRippleAmp, state.irisRippleAmp)
      gl.uniform1f(loc.uStromaTension, state.stromaTension)
      gl.uniform1f(loc.uCuriosity, state.curiosity)
      gl.uniform1f(loc.uUncertainty, state.uncertainty)
      gl.uniform1f(loc.uWonder, state.wonder)
      gl.uniform1f(loc.uStartle, state.startle)
      gl.uniform1f(loc.uMacroZoom, state.macroZoom)
      gl.uniform1f(loc.uTearWave, state.tearFilmWave)
      gl.uniform1f(loc.uStarburst, state.starburstIntensity)
      gl.uniform2f(loc.uFocusPoint, state.focusPointX, state.focusPointY)
      gl.uniform1f(loc.uFocusGlow, state.focusGlow)
      gl.drawArrays(gl.TRIANGLES, 0, 6)
    }
    raf = requestAnimationFrame(loop)
  }
  raf = requestAnimationFrame(loop)

  return () => {
    cancelAnimationFrame(raf)
    audio.dispose()
    window.removeEventListener('resize', fit)
  }
}
