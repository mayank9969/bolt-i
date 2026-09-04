import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer, PerformanceMonitor } from '@react-three/drei'
import * as THREE from 'three'
import { BEHAVIOUR, buildNetwork, damp, type Network, type NetworkMode } from './network'
import { getScene, setScene, subscribeScene, type CameraPreset, type SceneState } from './store'
import { onThemeChange, readToken, tokenHex } from '@/lib/theme'

/**
 * THE LIVING KNOWLEDGE NETWORK
 *
 * One persistent WebGL scene under every page. Three regions of knowledge
 * (Maths · Python · Mixed) sit at different depths; each has a dark core,
 * a ring of secondary nodes and a cloud of leaves. Hairline links carry
 * signals from the cores outward; optional links relink slowly so the
 * network rearranges instead of spinning. Fog dissolves the far regions
 * into the paper.
 *
 * The page decides the *behaviour* (alive / responsive / quiet / activated /
 * accumulated / atmospheric), the camera preset, the focused region and how
 * much of the network is "activated". Nothing here re-renders React per
 * frame — everything is read imperatively from the store.
 */

type Quality = 'high' | 'medium' | 'low'

interface Palette {
  canvas: THREE.Color
  ink: THREE.Color
  accent: THREE.Color
  accentB: THREE.Color
  node: THREE.Color
  core: THREE.Color
  line: THREE.Color
  key: string
  fill: string
  dark: boolean
}

function readPalette(): Palette {
  const canvas = new THREE.Color(tokenHex('--nx-canvas-rgb'))
  const ink = new THREE.Color(tokenHex('--nx-text-rgb'))
  const dark = canvas.getHSL({ h: 0, s: 0, l: 0 }).l < 0.5
  return {
    canvas,
    ink,
    accent: new THREE.Color(tokenHex('--nx-accent-rgb')),
    accentB: new THREE.Color(tokenHex('--nx-accent-b-rgb')),
    node: new THREE.Color(readToken('--nx-3d-node') || '#efe9dd'),
    core: new THREE.Color(readToken('--nx-3d-core') || '#1a1917'),
    line: new THREE.Color(readToken('--nx-3d-strut') || '#8d8880'),
    key: readToken('--nx-3d-key') || '#fff4e6',
    fill: readToken('--nx-3d-fill') || '#b9c6dd',
    dark,
  }
}

/* ── camera presets: desktop and phone framings, [position], [look-at] ──
   Verified numerically (projected cluster centres) so the cores land where the
   layout expects them: Home right/centre, Setup right, Quiz far right + faint,
   Result centre-right, History upper-right, About right edge. */
interface CamPreset {
  pos: [number, number, number]
  look: [number, number, number]
  fov: number
  phone: { pos: [number, number, number]; look: [number, number, number]; fov: number }
}
const CAMERAS: Record<CameraPreset, CamPreset> = {
  hero: { pos: [3.4, 0.9, 6.6], look: [1.1, -0.35, -2.2], fov: 38, phone: { pos: [0.5, 0.5, 10], look: [0.5, -2.5, -5], fov: 44 } },
  side: { pos: [-1, 0, 7.5], look: [-2, -0.5, -5], fov: 36, phone: { pos: [-0.5, 1, 13.5], look: [-0.5, -3, -1], fov: 44 } },
  far: { pos: [1.5, 3.5, 10], look: [-6, -2.5, -4.5], fov: 40, phone: { pos: [-0.5, 1, 13.5], look: [-0.5, -3, -1], fov: 44 } },
  reveal: { pos: [-0.8, 0.6, 8.8], look: [-2, -0.5, -5], fov: 38, phone: { pos: [0.5, 0.5, 11], look: [0.5, -2.5, -5], fov: 44 } },
  archive: { pos: [-1, -1, 9.5], look: [-3, -1, -2], fov: 40, phone: { pos: [-0.5, 1, 13.5], look: [-0.5, -3, -1], fov: 44 } },
  museum: { pos: [-3, -1, 9.5], look: [-3, 0, -2], fov: 34, phone: { pos: [-0.5, 1, 13.5], look: [-0.5, -3, -1], fov: 44 } },
}
const REVEAL_START: [number, number, number] = [-0.2, 0.2, 4.6]

const MAX_PULSES = 8

/* ── line shader — hairlines with travelling signals, fog, focus ───── */
const lineVert = /* glsl */ `
  attribute float aKind;
  attribute float aHash;
  attribute float aCluster;
  attribute float aLit;
  attribute float aHover;
  varying float vKind;
  varying float vHash;
  varying float vCluster;
  varying float vLit;
  varying float vHover;
  varying vec3 vWorld;
  varying float vDepth;
  void main() {
    vKind = aKind; vHash = aHash; vCluster = aCluster; vLit = aLit; vHover = aHover;
    vWorld = position;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`
const lineFrag = /* glsl */ `
  uniform float uTime;
  uniform vec3 uLine;
  uniform vec3 uAccent;
  uniform vec3 uCanvas;
  uniform float uDensity;
  uniform float uPresence;
  uniform float uFocus;
  uniform float uFocusMix;
  uniform float uRelink;
  uniform float uFogNear;
  uniform float uFogFar;
  uniform float uDark;
  uniform vec4 uPulses[${MAX_PULSES}];
  varying float vKind;
  varying float vHash;
  varying float vCluster;
  varying float vLit;
  varying float vHover;
  varying vec3 vWorld;
  varying float vDepth;
  void main() {
    // base alpha by kind: trunk, link, bridge, optional
    float a = vKind < 0.5 ? 0.62 : vKind < 1.5 ? 0.34 : vKind < 2.5 ? 0.30 : 0.26;
    // optional links breathe in and out (relink) and thin out with density
    if (vKind > 2.5) {
      float breathe = uRelink > 0.0 ? smoothstep(0.15, 0.55, 0.5 + 0.5 * sin(uTime / uRelink * 6.2831 + vHash * 6.2831)) : 1.0;
      float dens = step(vHash, 0.15 + uDensity * 0.85);
      a *= breathe * dens;
    } else if (vKind > 1.5 && vKind < 2.5) {
      a *= 0.6 + 0.4 * uDensity;
    }
    // travelling signal: expanding shells from a core
    float sig = 0.0;
    for (int i = 0; i < ${MAX_PULSES}; i++) {
      vec4 p = uPulses[i];
      if (p.w <= 0.0) continue;
      float age = uTime - p.w;
      if (age < 0.0 || age > 3.2) continue;
      float d = distance(vWorld, p.xyz);
      float front = age * 1.9;
      float band = exp(-pow((d - front) * 2.2, 2.0));
      sig += band * (1.0 - age / 3.2);
    }
    sig = min(sig, 1.0);
    float lit = max(vLit, vHover);
    vec3 col = mix(uLine, uAccent, clamp(lit * 0.85 + sig, 0.0, 1.0));
    a += sig * 0.5 + lit * 0.22 + vHover * 0.4;
    // focus: other regions recede
    if (uFocusMix > 0.0 && abs(vCluster - uFocus) > 0.5) a *= 1.0 - 0.72 * uFocusMix;
    // depth fog → paper
    float fog = smoothstep(uFogNear, uFogFar, vDepth);
    col = mix(col, uCanvas, fog);
    a *= (1.0 - fog * 0.9) * uPresence;
    gl_FragColor = vec4(col, a);
  }
`

/* ── dust shader — soft warm specks that drift ─────────────────────── */
const dustVert = /* glsl */ `
  attribute float aSize;
  attribute float aSeed;
  uniform float uTime;
  uniform float uPixel;
  varying float vSeed;
  varying float vDepth;
  void main() {
    vSeed = aSeed;
    vec3 p = position;
    p.x += sin(uTime * 0.11 + aSeed * 6.2831) * 0.35;
    p.y += cos(uTime * 0.09 + aSeed * 4.1) * 0.28 + sin(uTime * 0.05 + aSeed) * 0.1;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vDepth = -mv.z;
    gl_PointSize = aSize * uPixel * (16.0 / max(2.0, -mv.z));
    gl_Position = projectionMatrix * mv;
  }
`
const dustFrag = /* glsl */ `
  uniform vec3 uInk;
  uniform vec3 uAccent;
  uniform vec3 uCanvas;
  uniform float uOpacity;
  uniform float uTime;
  uniform float uFogNear;
  uniform float uFogFar;
  varying float vSeed;
  varying float vDepth;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float r = length(c);
    if (r > 0.5) discard;
    float soft = smoothstep(0.5, 0.05, r);
    float twinkle = 0.55 + 0.45 * sin(uTime * (0.6 + vSeed) + vSeed * 20.0);
    vec3 col = vSeed > 0.82 ? uAccent : uInk;
    float fog = smoothstep(uFogNear, uFogFar, vDepth);
    col = mix(col, uCanvas, fog);
    gl_FragColor = vec4(col, soft * twinkle * uOpacity * (1.0 - fog));
  }
`

const _v = new THREE.Vector3()
const _v2 = new THREE.Vector3()
const _v3 = new THREE.Vector3()
const _m = new THREE.Matrix4()
const _q = new THREE.Quaternion()
const _s = new THREE.Vector3()
const _c = new THREE.Color()

function NetworkObject({ palette, quality }: { palette: Palette; quality: Quality }) {
  const net = useMemo<Network>(() => buildNetwork({ leaves: quality === 'low' ? 22 : 38 }), [quality])
  const { size } = useThree()

  // ── live buffers ──
  const pos = useMemo(() => new Float32Array(net.home), [net])
  const off = useMemo(() => new Float32Array(net.count * 3), [net]) // cursor repulsion offsets (damped)
  const litSm = useMemo(() => new Float32Array(net.count), [net]) // smoothed activation per node
  const hoverSm = useMemo(() => new Float32Array(net.count), [net])
  const ndc = useMemo(() => new Float32Array(net.count * 2), [net])

  const nodesRef = useRef<THREE.InstancedMesh>(null)
  const linesRef = useRef<THREE.LineSegments>(null)
  const dustRef = useRef<THREE.Points>(null)
  const hubRefs = useRef<(THREE.Mesh | null)[]>([])
  const haloRefs = useRef<(THREE.Mesh | null)[]>([])
  const glowRef = useRef<THREE.PointLight>(null)

  // ── geometry for lines: 2 verts per edge ──
  const lineGeo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const n = net.edgeCount * 2
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3))
    const kind = new Float32Array(n)
    const hash = new Float32Array(n)
    const cl = new Float32Array(n)
    for (let e = 0; e < net.edgeCount; e++) {
      const a = net.edges[e * 2]
      const b = net.edges[e * 2 + 1]
      const h = ((e * 2654435761) >>> 0) / 4294967296
      kind[e * 2] = kind[e * 2 + 1] = net.edgeKind[e]
      hash[e * 2] = hash[e * 2 + 1] = h
      cl[e * 2] = cl[e * 2 + 1] = Math.min(net.cluster[a], net.cluster[b])
    }
    g.setAttribute('aKind', new THREE.BufferAttribute(kind, 1))
    g.setAttribute('aHash', new THREE.BufferAttribute(hash, 1))
    g.setAttribute('aCluster', new THREE.BufferAttribute(cl, 1))
    g.setAttribute('aLit', new THREE.BufferAttribute(new Float32Array(n), 1))
    g.setAttribute('aHover', new THREE.BufferAttribute(new Float32Array(n), 1))
    return g
  }, [net])

  const lineMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: lineVert,
        fragmentShader: lineFrag,
        transparent: true,
        depthWrite: false,
        uniforms: {
          uTime: { value: 0 },
          uLine: { value: palette.line.clone() },
          uAccent: { value: palette.accent.clone() },
          uCanvas: { value: palette.canvas.clone() },
          uDensity: { value: 0.6 },
          uPresence: { value: 1 },
          uFocus: { value: -1 },
          uFocusMix: { value: 0 },
          uRelink: { value: 4 },
          uFogNear: { value: 7 },
          uFogFar: { value: 21 },
          uDark: { value: palette.dark ? 1 : 0 },
          uPulses: { value: Array.from({ length: MAX_PULSES }, () => new THREE.Vector4(0, 0, 0, 0)) },
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  // ── dust ──
  const dustCount = quality === 'high' ? 240 : quality === 'medium' ? 140 : 0
  const dustGeo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const p = new Float32Array(dustCount * 3)
    const sz = new Float32Array(dustCount)
    const seed = new Float32Array(dustCount)
    let s = 1234
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647)
    for (let i = 0; i < dustCount; i++) {
      // scatter through the volume the clusters occupy
      p[i * 3] = (rnd() - 0.5) * 12 + 0.8
      p[i * 3 + 1] = (rnd() - 0.5) * 7
      p[i * 3 + 2] = -rnd() * 11 + 2
      sz[i] = 1.2 + rnd() * 2.4
      seed[i] = rnd()
    }
    g.setAttribute('position', new THREE.BufferAttribute(p, 3))
    g.setAttribute('aSize', new THREE.BufferAttribute(sz, 1))
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
    return g
  }, [dustCount])
  const dustMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: dustVert,
        fragmentShader: dustFrag,
        transparent: true,
        depthWrite: false,
        uniforms: {
          uTime: { value: 0 },
          uPixel: { value: 1 },
          uInk: { value: palette.ink.clone() },
          uAccent: { value: palette.accent.clone() },
          uCanvas: { value: palette.canvas.clone() },
          uOpacity: { value: 0 },
          uFogNear: { value: 7 },
          uFogFar: { value: 21 },
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  // ── materials for nodes and cores ──
  const nodeMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.55, metalness: 0.02 }), [])
  const coreMat = useMemo(
    () =>
      quality === 'low'
        ? new THREE.MeshStandardMaterial({ color: palette.core, roughness: 0.35, metalness: 0.3 })
        : new THREE.MeshPhysicalMaterial({ color: palette.core, roughness: 0.22, metalness: 0.15, clearcoat: 1, clearcoatRoughness: 0.15 }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [quality],
  )
  const haloMat = useMemo(() => new THREE.MeshBasicMaterial({ color: palette.accent, transparent: true, opacity: 0.25, depthWrite: false, side: THREE.DoubleSide }), [])

  // palette → uniforms/materials (theme switch without remounting the canvas)
  useEffect(() => {
    lineMat.uniforms.uLine.value.copy(palette.line)
    lineMat.uniforms.uAccent.value.copy(palette.accent)
    lineMat.uniforms.uCanvas.value.copy(palette.canvas)
    lineMat.uniforms.uDark.value = palette.dark ? 1 : 0
    dustMat.uniforms.uInk.value.copy(palette.ink)
    dustMat.uniforms.uAccent.value.copy(palette.accent)
    dustMat.uniforms.uCanvas.value.copy(palette.canvas)
    ;(coreMat as THREE.MeshStandardMaterial).color.copy(palette.core)
    haloMat.color.copy(palette.accent)
  }, [palette, lineMat, dustMat, coreMat, haloMat])

  // ── smoothed scene parameters ──
  const sm = useRef({
    activation: 0,
    density: 0.6,
    presence: 1,
    focusMix: 0,
    focus: -1,
    dust: 0,
    liveliness: 1,
    cursor: 0,
    camPos: new THREE.Vector3(...CAMERAS.hero.pos),
    camLook: new THREE.Vector3(...CAMERAS.hero.look),
    fov: CAMERAS.hero.fov,
    lastPreset: 'hero' as CameraPreset,
    lastPulse: 0,
    nextAmbient: 1.5,
    pulseSlot: 0,
    hoverNode: -1,
    hoverEdges: [] as number[],
    frame: 0,
  })
  const weights = useRef<[number, number, number] | null>(null)
  const modeRef = useRef<NetworkMode>('alive')

  // camera snap logic on preset change
  useEffect(() => {
    const apply = (s: SceneState) => {
      const S = sm.current
      modeRef.current = s.mode
      weights.current = s.clusterWeights
      if (s.camera !== S.lastPreset) {
        if (s.camera === 'reveal') {
          // Result: start close to the first core, then pull back to reveal
          S.camPos.set(...REVEAL_START)
        }
        S.lastPreset = s.camera
      }
      if (s.pulse !== S.lastPulse) {
        S.lastPulse = s.pulse
        const strength = (s.pulse % 1000) / 100
        firePulse(s.focusCluster >= 0 ? s.focusCluster : Math.floor(Math.random() * 3), strength)
      }
    }
    apply(getScene())
    return subscribeScene(apply)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const clockRef = useRef(0)
  function firePulse(cluster: number, strength = 1) {
    const S = sm.current
    const u = lineMat.uniforms.uPulses.value as THREE.Vector4[]
    const h = net.hubs[Math.max(0, Math.min(2, cluster))]
    const shots = Math.max(1, Math.min(3, Math.round(strength)))
    for (let k = 0; k < shots; k++) {
      const slot = S.pulseSlot++ % MAX_PULSES
      u[slot].set(pos[h * 3], pos[h * 3 + 1], pos[h * 3 + 2], clockRef.current + k * 0.35)
    }
  }

  const narrow = size.width < 768
  const aspectFix = Math.min(1, size.width / 1200)

  useFrame(({ clock, camera: cam }, rawDt) => {
    const t = clock.elapsedTime
    clockRef.current = t
    const dt = Math.min(0.05, rawDt)
    const s = getScene()
    const S = sm.current
    const B = BEHAVIOUR[s.mode]
    const quiet = s.mode === 'quiet'
    S.frame++

    // ── smoothed parameters ──
    const targetAct = s.clusterWeights ? 1 : s.activation
    S.activation = damp(S.activation, targetAct, s.mode === 'activated' ? 0.55 : 2.2, dt)
    S.density = damp(S.density, s.density, 2.5, dt)
    S.presence = damp(S.presence, B.presence * (narrow && quiet ? 0.7 : 1), 2.5, dt)
    S.dust = damp(S.dust, B.dust, 2, dt)
    S.liveliness = damp(S.liveliness, B.liveliness, 2, dt)
    S.cursor = damp(S.cursor, B.cursor * (s.pointerIn ? 1 : 0), 3, dt)
    if (s.focusCluster >= 0) S.focus = s.focusCluster
    S.focusMix = damp(S.focusMix, s.focusCluster >= 0 ? 1 : 0, 3, dt)

    // ── ambient signals from the cores ──
    if (B.pulseRate > 0 && t > S.nextAmbient) {
      firePulse(s.focusCluster >= 0 ? s.focusCluster : Math.floor(Math.random() * 3), 1)
      S.nextAmbient = t + (1 / B.pulseRate) * (0.6 + Math.random() * 0.8)
    }

    // ── camera ──
    const base = CAMERAS[s.camera]
    const preset = narrow ? base.phone : base
    _v.set(...preset.pos)
    _v2.set(...preset.look)
    // scroll on Home: dolly forward into the network along its depth axis
    if (s.camera === 'hero' && s.scroll > 0) {
      const k = s.scroll
      _v.x -= k * 1.6
      _v.z -= k * 4.2
      _v.y -= k * 0.2
      _v2.z -= k * 2.5
    }
    // focus: drift the look target toward the region
    if (S.focusMix > 0 && S.focus >= 0) {
      const c = net.centers[S.focus]
      _v2.lerp(_v3.set(c[0], c[1], c[2]), S.focusMix * 0.55)
      _v.x += (c[0] - preset.look[0]) * 0.3 * S.focusMix
      _v.z += (c[2] - preset.look[2]) * 0.35 * S.focusMix
    }
    // cursor parallax (camera, not object)
    _v.x += s.px * 0.32 * S.cursor
    _v.y += s.py * 0.18 * S.cursor
    // slow cinematic drift so nothing is ever perfectly still
    const drift = S.liveliness * 0.12
    _v.x += Math.sin(t * 0.09) * drift
    _v.y += Math.cos(t * 0.07) * drift * 0.6
    const camLambda = s.camera === 'reveal' ? 0.65 : 1.6
    S.camPos.lerp(_v, 1 - Math.exp(-camLambda * dt))
    S.camLook.lerp(_v2, 1 - Math.exp(-2 * dt))
    cam.position.copy(S.camPos)
    cam.lookAt(S.camLook)
    const pc = cam as THREE.PerspectiveCamera
    const wantFov = preset.fov
    if (Math.abs(pc.fov - wantFov) > 0.05) {
      pc.fov = damp(pc.fov, wantFov, 2, dt)
      pc.updateProjectionMatrix()
    }

    // ── node positions: home + organic drift + cursor repulsion ──
    const live = S.liveliness
    const heavy = !quiet || S.frame % 2 === 0 // quiz: update positions at half rate
    let nearest = -1
    let nearestD = 0.045 * 0.045
    if (heavy) {
      for (let i = 0; i < net.count; i++) {
        const tier = net.tier[i]
        const ph = net.phase[i]
        const amp = (tier === 0 ? 0.02 : tier === 1 ? 0.06 : 0.11) * live
        const hx = net.home[i * 3]
        const hy = net.home[i * 3 + 1]
        const hz = net.home[i * 3 + 2]
        let x = hx + Math.sin(t * 0.31 + ph) * amp + Math.sin(t * 0.13 + ph * 2.1) * amp * 0.5
        let y = hy + Math.cos(t * 0.27 + ph * 1.3) * amp
        let z = hz + Math.sin(t * 0.19 + ph * 0.7) * amp * 0.8

        // project to NDC for cursor interaction + hover
        _v.set(x, y, z).project(cam)
        ndc[i * 2] = _v.x
        ndc[i * 2 + 1] = _v.y
        let ox = 0
        let oy = 0
        if (S.cursor > 0.01 && _v.z < 1) {
          const dx = _v.x - s.px
          const dy = _v.y - s.py
          const d2 = dx * dx + dy * dy
          const R = 0.22
          if (d2 < R * R) {
            const d = Math.sqrt(d2) || 1e-4
            const f = (1 - d / R) * 0.28 * S.cursor * (tier === 0 ? 0.15 : 1)
            ox = (dx / d) * f
            oy = (dy / d) * f * 0.7
          }
          if (s.hoverable && tier > 0 && d2 < nearestD) {
            nearestD = d2
            nearest = i
          }
        }
        off[i * 3] = damp(off[i * 3], ox, 4, dt)
        off[i * 3 + 1] = damp(off[i * 3 + 1], oy, 4, dt)
        x += off[i * 3]
        y += off[i * 3 + 1]
        pos[i * 3] = x
        pos[i * 3 + 1] = y
        pos[i * 3 + 2] = z
      }
    }

    // ── hover bookkeeping (Home only) ──
    if (s.hoverable) {
      if (nearest !== S.hoverNode) {
        const hov = lineGeo.getAttribute('aHover') as THREE.BufferAttribute
        S.hoverEdges.forEach((e) => {
          hov.setX(e * 2, 0)
          hov.setX(e * 2 + 1, 0)
        })
        S.hoverEdges = nearest >= 0 ? net.adjacency[nearest] : []
        S.hoverEdges.forEach((e) => {
          hov.setX(e * 2, 1)
          hov.setX(e * 2 + 1, 1)
        })
        hov.needsUpdate = true
        S.hoverNode = nearest
        if (nearest >= 0) {
          setScene({
            hover: {
              node: nearest,
              cluster: net.cluster[nearest],
              tier: net.tier[nearest],
              x: ((ndc[nearest * 2] + 1) / 2) * size.width,
              y: ((1 - ndc[nearest * 2 + 1]) / 2) * size.height,
            },
          })
        } else setScene({ hover: null })
      } else if (nearest >= 0 && S.frame % 6 === 0) {
        setScene({ hover: { node: nearest, cluster: net.cluster[nearest], tier: net.tier[nearest], x: ((ndc[nearest * 2] + 1) / 2) * size.width, y: ((1 - ndc[nearest * 2 + 1]) / 2) * size.height } })
      }
    } else if (S.hoverNode !== -1) {
      const hov = lineGeo.getAttribute('aHover') as THREE.BufferAttribute
      S.hoverEdges.forEach((e) => {
        hov.setX(e * 2, 0)
        hov.setX(e * 2 + 1, 0)
      })
      hov.needsUpdate = true
      S.hoverEdges = []
      S.hoverNode = -1
      setScene({ hover: null })
    }

    // ── node instances: colour + scale encode activation, focus, presence ──
    const nodes = nodesRef.current
    const w = weights.current
    if (nodes) {
      const presenceMix = 1 - S.presence
      for (let i = 0; i < net.count; i++) {
        const tier = net.tier[i]
        const cl = net.cluster[i]
        const isHub = tier === 0
        const litTarget = w ? (net.clusterRank[i] <= w[cl] ? 1 : 0) : net.activationRank[i] <= S.activation ? 1 : 0
        litSm[i] = damp(litSm[i], litTarget, 3.5, dt)
        hoverSm[i] = damp(hoverSm[i], i === S.hoverNode ? 1 : 0, 10, dt)
        const lit = litSm[i]
        const focusDim = S.focusMix > 0 && cl !== S.focus ? 1 - S.focusMix * 0.6 : 1
        const breathe = 1 + Math.sin(t * 0.8 + net.phase[i]) * 0.04 * live
        const densityScale = tier === 2 ? 0.55 + S.density * 0.45 : 1
        const r = isHub ? 0 : net.radius[i] * breathe * densityScale * (1 + lit * 0.4) * (1 + hoverSm[i] * 0.9) * (0.6 + focusDim * 0.4) * (0.7 + S.presence * 0.3)
        _m.compose(_v.set(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]), _q.identity(), _s.setScalar(r))
        nodes.setMatrixAt(i, _m)
        // colour: bone → accent when activated; hover → accent; dim toward canvas for focus/presence
        _c.copy(palette.node).lerp(palette.accent, Math.min(1, lit * 0.9 + hoverSm[i]))
        if (tier === 1 && lit < 0.5) _c.lerp(palette.accentB, 0.25 * (1 - lit)) // secondaries carry the cool secondary tone
        _c.lerp(palette.canvas, Math.min(0.9, (1 - focusDim) * 0.8 + presenceMix * 0.75))
        nodes.setColorAt(i, _c)
      }
      nodes.instanceMatrix.needsUpdate = true
      if (nodes.instanceColor) nodes.instanceColor.needsUpdate = true
    }

    // ── cores and halos ──
    for (let c = 0; c < 3; c++) {
      const h = net.hubs[c]
      const mesh = hubRefs.current[c]
      const halo = haloRefs.current[c]
      const focusDim = S.focusMix > 0 && c !== S.focus ? 1 - S.focusMix * 0.5 : 1
      if (mesh) {
        mesh.position.set(pos[h * 3], pos[h * 3 + 1], pos[h * 3 + 2])
        mesh.rotation.y = t * 0.12 * (c % 2 ? -1 : 1)
        mesh.rotation.x = t * 0.05
        mesh.scale.setScalar((0.26 + litSm[h] * 0.04) * focusDim * (0.75 + S.presence * 0.25))
      }
      if (halo) {
        halo.position.copy(mesh ? mesh.position : _v)
        halo.rotation.z = t * 0.15 + c
        halo.rotation.x = Math.PI / 2.4 + Math.sin(t * 0.2 + c) * 0.15
        const clusterLit = w ? w[c] : Math.max(0, Math.min(1, (S.activation - c * 0.05) * 1.2))
        halo.scale.setScalar(0.5 + clusterLit * 0.12)
        const hm = halo.material as THREE.MeshBasicMaterial
        hm.opacity = (0.12 + clusterLit * 0.5) * focusDim * S.presence
      }
    }
    if (glowRef.current) {
      const c = S.focus >= 0 ? S.focus : 0
      const h = net.hubs[c]
      glowRef.current.position.set(pos[h * 3] + 0.4, pos[h * 3 + 1] + 0.6, pos[h * 3 + 2] + 0.8)
      glowRef.current.intensity = (0.4 + S.activation * 1.4) * S.focusMix * 2 + (s.mode === 'activated' ? 1.2 : 0.3)
    }

    // ── lines: positions + activation attribute ──
    const lines = linesRef.current
    if (lines && heavy) {
      const pa = lineGeo.getAttribute('position') as THREE.BufferAttribute
      const la = lineGeo.getAttribute('aLit') as THREE.BufferAttribute
      const arr = pa.array as Float32Array
      const larr = la.array as Float32Array
      for (let e = 0; e < net.edgeCount; e++) {
        const a = net.edges[e * 2]
        const b = net.edges[e * 2 + 1]
        arr[e * 6] = pos[a * 3]
        arr[e * 6 + 1] = pos[a * 3 + 1]
        arr[e * 6 + 2] = pos[a * 3 + 2]
        arr[e * 6 + 3] = pos[b * 3]
        arr[e * 6 + 4] = pos[b * 3 + 1]
        arr[e * 6 + 5] = pos[b * 3 + 2]
        const l = Math.min(litSm[a], litSm[b])
        larr[e * 2] = l
        larr[e * 2 + 1] = l
      }
      pa.needsUpdate = true
      la.needsUpdate = true
    }
    lineMat.uniforms.uTime.value = t
    lineMat.uniforms.uDensity.value = S.density
    lineMat.uniforms.uPresence.value = S.presence
    lineMat.uniforms.uFocus.value = S.focus
    lineMat.uniforms.uFocusMix.value = S.focusMix
    lineMat.uniforms.uRelink.value = B.relinkEvery

    // ── dust ──
    dustMat.uniforms.uTime.value = t
    dustMat.uniforms.uOpacity.value = (palette.dark ? 0.5 : 0.34) * S.dust * S.presence
    dustMat.uniforms.uPixel.value = Math.min(2, (size.height / 900) * aspectFix + 0.6)
  })

  return (
    <>
      <instancedMesh ref={nodesRef} args={[undefined, undefined, net.count]} material={nodeMat} frustumCulled={false}>
        <sphereGeometry args={[1, quality === 'low' ? 10 : 16, quality === 'low' ? 8 : 12]} />
      </instancedMesh>
      <lineSegments ref={linesRef} geometry={lineGeo} material={lineMat} frustumCulled={false} />
      {dustCount > 0 && <points ref={dustRef} geometry={dustGeo} material={dustMat} frustumCulled={false} />}
      {[0, 1, 2].map((c) => (
        <group key={c}>
          <mesh ref={(el) => (hubRefs.current[c] = el)} material={coreMat}>
            <icosahedronGeometry args={[1, quality === 'low' ? 1 : 3]} />
          </mesh>
          <mesh ref={(el) => (haloRefs.current[c] = el)} material={haloMat}>
            <torusGeometry args={[1, 0.006, 6, 72]} />
          </mesh>
        </group>
      ))}
      <pointLight ref={glowRef} color={palette.accent} intensity={0.5} distance={4.5} decay={2} />
    </>
  )
}

function Lights({ palette }: { palette: Palette }) {
  return (
    <>
      <hemisphereLight args={[palette.key, palette.dark ? '#1a1a1e' : '#c9bfae', palette.dark ? 0.45 : 0.75]} />
      {/* key: warm, high-left — the reading lamp */}
      <directionalLight position={[-4, 6, 5]} intensity={palette.dark ? 1.7 : 1.9} color={palette.key} />
      {/* fill: cool, low-right, quiet */}
      <directionalLight position={[5, -2, 3]} intensity={0.35} color={palette.fill} />
      {/* rim from behind the far region so cores read against the fog */}
      <directionalLight position={[0, 2, -8]} intensity={0.8} color={palette.key} />
    </>
  )
}

function Studio({ quality }: { quality: Quality }) {
  if (quality === 'low') return null
  return (
    <Environment resolution={quality === 'high' ? 128 : 64} frames={1}>
      <Lightformer intensity={1.6} position={[0, 5, -6]} scale={[10, 4, 1]} color="#ffffff" />
      <Lightformer intensity={1} position={[-6, 1, 2]} scale={[3, 6, 1]} rotation-y={Math.PI / 3} color="#fff1e2" />
      <Lightformer intensity={0.5} position={[6, -1, 1]} scale={[3, 5, 1]} rotation-y={-Math.PI / 3} color="#c9d5ea" />
    </Environment>
  )
}

function FogSync({ palette }: { palette: Palette }) {
  const { scene } = useThree()
  useEffect(() => {
    scene.fog = new THREE.Fog(palette.canvas.clone(), 7, 21)
    return () => {
      scene.fog = null
    }
  }, [scene, palette])
  return null
}

function detectQuality(): Quality {
  if (typeof window === 'undefined') return 'medium'
  const small = window.matchMedia('(max-width: 768px)').matches
  const cores = navigator.hardwareConcurrency ?? 4
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4
  const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData
  if (small || saveData) return 'low'
  if (cores <= 4 || mem <= 4) return 'medium'
  return 'high'
}

export function webglAvailable(): boolean {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

/** Fixed, full-viewport canvas rendered once by the Layout shell. */
export default function NexusScene() {
  const [palette, setPalette] = useState<Palette>(() => readPalette())
  const [quality] = useState<Quality>(() => detectQuality())
  const [visible, setVisible] = useState(true)
  const maxDpr = quality === 'high' ? 1.75 : quality === 'medium' ? 1.4 : 1
  const [dpr, setDpr] = useState(() => Math.min(maxDpr, window.devicePixelRatio || 1))

  useEffect(() => onThemeChange(() => setPalette(readPalette())), [])
  useEffect(() => {
    const on = () => setVisible(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', on)
    return () => document.removeEventListener('visibilitychange', on)
  }, [])

  return (
    <Canvas
      camera={{ position: CAMERAS.hero.pos, fov: CAMERAS.hero.fov, near: 0.1, far: 40 }}
      dpr={dpr}
      gl={{ antialias: quality !== 'low', alpha: true, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
      frameloop={visible ? 'always' : 'never'}
      style={{ width: '100%', height: '100%' }}
      eventSource={undefined}
    >
      {/* step the resolution down if the frame rate drops, never up past the tier cap */}
      <PerformanceMonitor onDecline={() => setDpr((d) => Math.max(0.75, d - 0.25))} onIncline={() => setDpr((d) => Math.min(maxDpr, d + 0.25))} flipflops={3} />
      <FogSync palette={palette} />
      <Lights palette={palette} />
      <Studio quality={quality} />
      <NetworkObject palette={palette} quality={quality} />
    </Canvas>
  )
}
