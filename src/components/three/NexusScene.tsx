import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, Environment, Lightformer } from '@react-three/drei'
import * as THREE from 'three'
import { buildLattice, litOrder, LatticeState } from './lattice'
import { getScene, subscribeScene, type Layout } from './store'
import { onThemeChange, readToken, tokenHex } from '@/lib/theme'

/**
 * THE NEXUS — one sculptural knowledge lattice, rendered once, alive on
 * every page. Nodes = questions, struts = connections, the core = the
 * learner. Lit nodes = mastery.
 *
 * Verified principles behind it (see docs/DESIGN-SYSTEM.md):
 *  · one object rendered with weight and inertia beats a busy scene
 *  · materials are restrained; the drama comes from lighting + contact
 *    shadow, not emissive neon
 *  · scroll moves the camera through depth, it does not slide layers
 *  · the cursor *reveals* (tilts, lights), it does not fling things
 */

type Quality = 'high' | 'medium' | 'low'

interface Palette {
  core: string
  strut: string
  node: string
  accent: string
  accentB: string
  shadow: string
  shadowOpacity: number
  key: string
  fill: string
  canvas: string
}

function readPalette(): Palette {
  const num = (name: string, fallback: number) => {
    const v = parseFloat(readToken(name))
    return Number.isNaN(v) ? fallback : v
  }
  return {
    core: readToken('--nx-3d-core') || '#1a1917',
    strut: readToken('--nx-3d-strut') || '#8d8880',
    node: readToken('--nx-3d-node') || '#efe9dd',
    accent: tokenHex('--nx-accent-rgb'),
    accentB: tokenHex('--nx-accent-b-rgb'),
    shadow: readToken('--nx-3d-shadow') || '#000000',
    shadowOpacity: num('--nx-3d-shadow-opacity', 0.35),
    key: readToken('--nx-3d-key') || '#ffffff',
    fill: readToken('--nx-3d-fill') || '#b9c6dd',
    canvas: tokenHex('--nx-canvas-rgb'),
  }
}

/** Where the object sits in the viewport for each layout, in world units. */
const LAYOUTS: Record<Layout, { pos: [number, number, number]; scale: number; camZ: number }> = {
  hero: { pos: [1.55, -0.1, 0], scale: 1, camZ: 6.2 },
  side: { pos: [2.6, 0.2, -1.2], scale: 0.7, camZ: 6.2 },
  top: { pos: [0, 1.5, -2.2], scale: 0.55, camZ: 6.2 },
  corner: { pos: [3.1, 1.6, -2.8], scale: 0.45, camZ: 6.2 },
  hidden: { pos: [0, -6, -2], scale: 0.3, camZ: 6.2 },
}

const _v = new THREE.Vector3()
const _m = new THREE.Matrix4()
const _q = new THREE.Quaternion()
const _s = new THREE.Vector3()
const _c = new THREE.Color()

function Lattice({ palette, quality }: { palette: Palette; quality: Quality }) {
  const geo = useMemo(() => buildLattice(quality === 'low' ? 40 : 56, 1.6, 11), [quality])
  const order = useMemo(() => litOrder(geo), [geo])
  const rankOf = useMemo(() => {
    const r = new Array(geo.nodes.length).fill(0)
    order.forEach((idx, i) => (r[idx] = i / (order.length - 1)))
    return r as number[]
  }, [geo, order])

  const group = useRef<THREE.Group>(null)
  const inner = useRef<THREE.Group>(null)
  const nodesRef = useRef<THREE.InstancedMesh>(null)
  const strutsRef = useRef<THREE.InstancedMesh>(null)
  const coreRef = useRef<THREE.Mesh>(null)
  const haloRef = useRef<THREE.Mesh>(null)
  const state = useMemo(() => new LatticeState(), [])

  const { viewport } = useThree()
  const narrow = viewport.width < 7 // roughly < 768px at camZ 6.2

  // materials — matte-ceramic nodes, brushed struts, dark lacquer core
  const nodeMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: palette.node, roughness: 0.55, metalness: 0.05 }),
    [palette.node],
  )
  const strutMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: palette.strut, roughness: 0.4, metalness: 0.6 }),
    [palette.strut],
  )
  const coreMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: palette.core,
        roughness: 0.18,
        metalness: 0.2,
        clearcoat: 1,
        clearcoatRoughness: 0.12,
      }),
    [palette.core],
  )

  // per-instance colours (node lit vs unlit)
  const unlit = useMemo(() => new THREE.Color(palette.node), [palette.node])
  const lit = useMemo(() => new THREE.Color(palette.accent), [palette.accent])
  const strutBase = useMemo(() => new THREE.Color(palette.strut), [palette.strut])

  // static strut transforms
  const strutXf = useMemo(() => {
    const up = new THREE.Vector3(0, 1, 0)
    return geo.edges.map(([a, b]) => {
      const pa = geo.nodes[a]
      const pb = geo.nodes[b]
      const mid = pa.clone().add(pb).multiplyScalar(0.5)
      const dir = pb.clone().sub(pa)
      const len = dir.length()
      const q = new THREE.Quaternion().setFromUnitVectors(up, dir.normalize())
      return { mid, q, len }
    })
  }, [geo])

  const last = useRef(0)
  const tilt = useRef({ x: 0, y: 0 })
  const camTarget = useRef(new THREE.Vector3())
  const posTarget = useRef(new THREE.Vector3(...LAYOUTS.hero.pos))
  const scaleTarget = useRef(1)

  useEffect(() => {
    const apply = () => {
      const s = getScene()
      state.set({ mode: s.mode, progress: s.progress, density: s.density, sector: s.sector, litCount: s.litCount })
      const L = LAYOUTS[s.layout]
      posTarget.current.set(...L.pos)
      scaleTarget.current = L.scale
    }
    apply()
    return subscribeScene(apply)
  }, [state])

  useFrame(({ clock, camera }) => {
    const t = clock.elapsedTime
    const dt = Math.min(0.05, t - last.current)
    last.current = t
    state.step(dt)
    const sc = getScene()

    const g = group.current
    if (!g) return

    // ── placement: layout + scroll depth + mobile composition ──
    const wantPos = _v.copy(posTarget.current)
    if (narrow) {
      // mobile: centre it high, smaller, behind the copy
      wantPos.set(0, 1.35, -1.6)
    }
    // scroll: object retreats into depth and drifts up (camera "approaches" then passes)
    const sN = sc.scroll
    wantPos.z -= sN * 3.2
    wantPos.y += sN * 0.9
    g.position.lerp(wantPos, 1 - Math.exp(-dt * 3))

    const wantScale = (narrow ? scaleTarget.current * 0.62 : scaleTarget.current) * (1 - state.quiet * 0.35)
    const cs = g.scale.x + (wantScale - g.scale.x) * (1 - Math.exp(-dt * 3))
    g.scale.setScalar(cs)

    // ── rotation: slow breathing spin + cursor reveal tilt ──
    tilt.current.x += (sc.py * 0.18 - tilt.current.x) * (1 - Math.exp(-dt * 2.2))
    tilt.current.y += (sc.px * 0.28 - tilt.current.y) * (1 - Math.exp(-dt * 2.2))
    g.rotation.y = t * 0.07 + tilt.current.y + sN * 0.9
    g.rotation.x = Math.sin(t * 0.21) * 0.06 - tilt.current.x
    if (inner.current) inner.current.rotation.y = -t * 0.05

    // camera: hold, but ease a little toward the cursor for parallax
    camTarget.current.set(sc.px * 0.25, sc.py * 0.15, LAYOUTS.hero.camZ)
    camera.position.lerp(camTarget.current, 1 - Math.exp(-dt * 1.8))
    camera.lookAt(0, 0, 0)

    // ── per-node state ──
    const nodes = nodesRef.current
    if (nodes) {
      const litFrac = state.progress
      const useCount = sc.litCount >= 0
      for (let i = 0; i < geo.nodes.length; i++) {
        const p = geo.nodes[i]
        const isCore = geo.ranks[i] === 0
        const sectorW = state.sectorMix > 0 && geo.sectors[i] !== state.sector ? 1 - state.sectorMix * 0.7 : 1
        // breathing: nodes on the surface pulse very slightly out of phase
        const breathe = 1 + Math.sin(t * 0.9 + i * 0.7) * 0.03
        const litness = useCount ? (rankOf[i] * (order.length - 1) < sc.litCount ? 1 : 0) : rankOf[i] <= litFrac ? 1 : 0
        const base = isCore ? 0 : geo.ranks[i] === 1 ? 0.055 : 0.07
        const size = base * breathe * sectorW * (0.85 + litness * 0.35) * (1 - state.quiet * 0.25)
        _m.compose(p, _q.identity(), _s.setScalar(size))
        nodes.setMatrixAt(i, _m)
        _c.copy(unlit).lerp(lit, litness * (0.9 - state.quiet * 0.5))
        nodes.setColorAt(i, _c)
      }
      nodes.instanceMatrix.needsUpdate = true
      if (nodes.instanceColor) nodes.instanceColor.needsUpdate = true
    }

    // ── struts: density hides a deterministic fraction; sector focus dims others ──
    const struts = strutsRef.current
    if (struts) {
      const keep = state.density
      for (let i = 0; i < strutXf.length; i++) {
        const { mid, q, len } = strutXf[i]
        const [a, b] = geo.edges[i]
        const hash = ((i * 2654435761) >>> 0) / 4294967296
        const visible = hash < 0.28 + keep * 0.72 || geo.ranks[a] === 0 || geo.ranks[b] === 0
        const inSector = state.sectorMix > 0 ? (geo.sectors[a] === state.sector || geo.sectors[b] === state.sector ? 1 : 1 - state.sectorMix * 0.75) : 1
        const r = visible ? 0.011 * inSector * (1 - state.quiet * 0.4) : 0.0001
        _m.compose(mid, q, _s.set(r, len, r))
        struts.setMatrixAt(i, _m)
        // lit struts: both ends lit → warm
        const la = rankOf[a] <= state.progress ? 1 : 0
        const lb = rankOf[b] <= state.progress ? 1 : 0
        _c.copy(strutBase).lerp(lit, la * lb * 0.55)
        struts.setColorAt(i, _c)
      }
      struts.instanceMatrix.needsUpdate = true
      if (struts.instanceColor) struts.instanceColor.needsUpdate = true
    }

    // core: slow independent rotation; halo breathes with progress
    if (coreRef.current) {
      coreRef.current.rotation.y = -t * 0.12
      coreRef.current.rotation.x = t * 0.05
    }
    if (haloRef.current) {
      const m = haloRef.current.material as THREE.MeshBasicMaterial
      m.opacity = 0.08 + state.progress * 0.18 * (1 - state.quiet)
      haloRef.current.scale.setScalar(1.9 + Math.sin(t * 0.8) * 0.04)
    }
  })

  return (
    <group ref={group} position={LAYOUTS.hero.pos}>
      <group ref={inner}>
        {/* nodes */}
        <instancedMesh ref={nodesRef} args={[undefined, undefined, geo.nodes.length]} material={nodeMat} castShadow>
          <icosahedronGeometry args={[1, quality === 'low' ? 1 : 2]} />
        </instancedMesh>
        {/* struts */}
        <instancedMesh ref={strutsRef} args={[undefined, undefined, geo.edges.length]} material={strutMat}>
          <cylinderGeometry args={[1, 1, 1, quality === 'low' ? 5 : 7, 1]} />
        </instancedMesh>
      </group>
      {/* core — dark lacquer dodecahedron, the learner */}
      <mesh ref={coreRef} material={coreMat} castShadow>
        <dodecahedronGeometry args={[0.34, 0]} />
      </mesh>
      {/* accent halo — a thin lit ring, the only emissive element */}
      <mesh ref={haloRef} rotation={[Math.PI / 2.6, 0.3, 0]}>
        <torusGeometry args={[1, 0.004, 8, 96]} />
        <meshBasicMaterial color={palette.accent} transparent opacity={0.2} depthWrite={false} />
      </mesh>
    </group>
  )
}

function Lights({ palette }: { palette: Palette }) {
  return (
    <>
      <ambientLight intensity={0.25} />
      {/* key: warm, high-left — the "reading lamp" */}
      <directionalLight
        position={[-3.5, 5, 4]}
        intensity={2.1}
        color={palette.key}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
      />
      {/* fill: cool, low-right — the secondary accent as light, not paint */}
      <directionalLight position={[4, -1.5, 2.5]} intensity={0.55} color={palette.fill} />
      {/* rim */}
      <directionalLight position={[0, 2, -5]} intensity={0.9} color={palette.key} />
    </>
  )
}

function Studio({ quality }: { quality: Quality }) {
  if (quality === 'low') return null
  // A neutral studio environment gives the lacquer core and metal struts
  // something to reflect — soft rectangles, no HDR download.
  return (
    <Environment resolution={quality === 'high' ? 128 : 64} frames={1}>
      <Lightformer intensity={2} position={[0, 4, -6]} scale={[10, 4, 1]} color="#ffffff" />
      <Lightformer intensity={1.2} position={[-6, 1, 2]} scale={[3, 6, 1]} rotation-y={Math.PI / 3} color="#fff4e6" />
      <Lightformer intensity={0.6} position={[6, -1, 1]} scale={[3, 5, 1]} rotation-y={-Math.PI / 3} color="#c6d3ea" />
    </Environment>
  )
}

function detectQuality(): Quality {
  if (typeof window === 'undefined') return 'medium'
  const small = window.matchMedia('(max-width: 768px)').matches
  const cores = navigator.hardwareConcurrency ?? 4
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4
  if (small || cores <= 4 || mem <= 4) return small ? 'low' : 'medium'
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

  useEffect(() => onThemeChange(() => setPalette(readPalette())), [])
  // pause when tab is hidden
  useEffect(() => {
    const on = () => setVisible(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', on)
    return () => document.removeEventListener('visibilitychange', on)
  }, [])

  return (
    <Canvas
      key={palette.canvas}
      camera={{ position: [0, 0, 6.2], fov: 40, near: 0.1, far: 40 }}
      dpr={quality === 'high' ? [1, 1.75] : quality === 'medium' ? [1, 1.4] : [1, 1.1]}
      gl={{ antialias: quality !== 'low', alpha: true, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping }}
      shadows={quality !== 'low'}
      frameloop={visible ? 'always' : 'never'}
      style={{ width: '100%', height: '100%' }}
      eventSource={undefined}
    >
      <Lights palette={palette} />
      <Studio quality={quality} />
      <Lattice palette={palette} quality={quality} />
      {quality !== 'low' && (
        <ContactShadows
          position={[0, -2.35, 0]}
          opacity={palette.shadowOpacity}
          scale={12}
          blur={2.6}
          far={4.5}
          color={palette.shadow}
          frames={Infinity}
          resolution={quality === 'high' ? 512 : 256}
        />
      )}
    </Canvas>
  )
}
