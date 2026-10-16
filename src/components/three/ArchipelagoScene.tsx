import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { Html, OrbitControls, Sky } from '@react-three/drei'
import * as THREE from 'three'
import { buildIslands, hash01, type Bridge, type Island } from './islands'
import { getWorld, setWorld, subscribeWorld, useWorldSlice, type WorldState } from './world'
import { exhibitFor, hasExhibit } from '@/lib/exhibits'
import { onThemeChange, readToken, tokenHex } from '@/lib/theme'
import type { CategoryInfo } from '@/types/quiz'

/**
 * THE KNOWLEDGE ARCHIPELAGO
 *
 * A miniature world: one floating island per category (from /api/categories),
 * with a faceted rock, layered plateaus, a subject-themed prop, deep-teal
 * bridges between related fields and a terracotta marker on islands whose
 * latest real attempt had wrong answers. Hover/focus lifts and lights an island
 * and shows its name; click/tap opens the field guide (plain DOM, in Layout).
 *
 * Rendering is on demand: the loop only runs while something moves (hero bob,
 * camera transitions, hover). Quiet pages render a frame and stop.
 */

type Quality = 'high' | 'low'

interface Palette {
  canvas: THREE.Color
  ink: THREE.Color
  accent: THREE.Color
  warm: THREE.Color
  rock: THREE.Color
  land: [THREE.Color, THREE.Color, THREE.Color]
  bridge: THREE.Color
  cloud: THREE.Color
  key: string
  sky: string
  ground: string
  dark: boolean
}

function readPalette(): Palette {
  const canvas = new THREE.Color(tokenHex('--nx-canvas-rgb'))
  const dark = canvas.getHSL({ h: 0, s: 0, l: 0 }).l < 0.5
  const c = (name: string, fb: string) => new THREE.Color(readToken(name) || fb)
  return {
    canvas,
    ink: new THREE.Color(tokenHex('--nx-text-rgb')),
    accent: new THREE.Color(tokenHex('--nx-accent-rgb')),
    warm: new THREE.Color(tokenHex('--nx-warm-rgb')),
    rock: c('--nx-3d-rock', '#cfc9bf'),
    land: [c('--nx-3d-land-1', '#e9e4da'), c('--nx-3d-land-2', '#f3efe6'), c('--nx-3d-land-3', '#fbf8f1')],
    bridge: c('--nx-3d-bridge', '#1e6b6a'),
    cloud: c('--nx-3d-cloud', '#ffffff'),
    key: readToken('--nx-3d-key') || '#fff6e8',
    sky: readToken('--nx-3d-sky') || '#ffffff',
    ground: readToken('--nx-3d-ground') || '#d8d2c6',
    dark,
  }
}

const _v = new THREE.Vector3()
const _v2 = new THREE.Vector3()
const _off = new THREE.Vector3()

/* ── camera framing per mode (desktop · phone) ─────────────────────── */
const CAM = {
  hero: { pos: [0, 6.4, 13.2], look: [0, -0.8, 0], fov: 36, phone: { pos: [0, 7.2, 14], look: [0, -1.2, 0], fov: 46 } },
  quiet: { pos: [0, 6.8, 11], look: [0, -0.4, 0], fov: 32, phone: { pos: [0, 8, 12], look: [0, -1.2, 0], fov: 44 } },
} as const

/* ── one island ─────────────────────────────────────────────────────── */
function IslandMesh({
  island,
  palette,
  quality,
  index,
  interactive,
}: {
  island: Island
  palette: Palette
  quality: Quality
  index: number
  interactive: boolean
}) {
  const group = useRef<THREE.Group>(null)
  const [hot, setHot] = useState(false) // hovered or selected — drives the DOM label
  const [review, setReview] = useState(false)
  const [exhibitOpen, setExhibitOpen] = useState(false) // this island's exhibit is open
  const propGroup = useRef<THREE.Group>(null)
  const rockMat = useMemo(() => new THREE.MeshStandardMaterial({ color: palette.rock, roughness: 0.95, flatShading: true }), [])
  const landMats = useMemo(() => palette.land.map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.9, flatShading: true })), [])
  const propMat = useMemo(() => new THREE.MeshStandardMaterial({ color: palette.ink, roughness: 0.6, metalness: 0.05 }), [])
  const tealMat = useMemo(() => new THREE.MeshStandardMaterial({ color: palette.accent, roughness: 0.55 }), [])
  const warmMat = useMemo(() => new THREE.MeshStandardMaterial({ color: palette.warm, roughness: 0.6 }), [])
  useEffect(() => {
    rockMat.color.copy(palette.rock)
    landMats.forEach((m, i) => m.color.copy(palette.land[i]))
    propMat.color.copy(palette.ink)
    tealMat.color.copy(palette.accent)
    warmMat.color.copy(palette.warm)
  }, [palette, rockMat, landMats, propMat, tealMat, warmMat])

  const anim = useRef({ lift: 0, glow: 0, intro: 0 })
  const r = island.r
  const rockH = r * 1.25
  // plateau stack: y positions
  const stack = useMemo(() => {
    let y = 0
    return island.layers.map(([k, h], i) => {
      const yy = y + h / 2
      y += h
      const dx = (hash01(island.id, 30 + i) - 0.5) * r * 0.25
      const dz = (hash01(island.id, 40 + i) - 0.5) * r * 0.25
      return { radius: r * k, h, y: yy, dx, dz, rot: hash01(island.id, 50 + i) * Math.PI }
    })
  }, [island, r])
  const topY = stack.reduce((s, l) => s + l.h, 0)
  const topLayer = stack[stack.length - 1]

  useEffect(() => {
    const read = (s: WorldState) => {
      const h = s.hover === island.id || s.selected === island.id
      setHot((p) => (p === h ? p : h))
      const rv = !!s.review[island.id]
      setReview((p) => (p === rv ? p : rv))
      const ex = s.selected === island.id && hasExhibit(island.id)
      setExhibitOpen((p) => (p === ex ? p : ex))
    }
    read(getWorld())
    return subscribeWorld(read)
  }, [island.id])

  useFrame((_, dt) => {
    const g = group.current
    if (!g) return
    const s = getWorld()
    const A = anim.current
    const d = Math.min(0.05, dt)
    const hero = s.mode === 'hero'
    const focused = s.mode === 'focus' && s.focus === island.id
    const exhibitElsewhere = !!s.selected && hasExhibit(s.selected) && s.selected !== island.id
    const exhibitHere = !!s.selected && hasExhibit(s.selected) && s.selected === island.id
    const dimmed = (s.mode === 'focus' && s.focus !== island.id) || exhibitElsewhere
    const hotNow = s.hover === island.id || s.selected === island.id
    A.intro = Math.min(1, A.intro + d / 1.4)
    const introK = 1 - Math.pow(1 - Math.max(0, Math.min(1, (A.intro - index * 0.045) / 0.7)), 3)
    A.lift += ((hotNow || focused ? 0.14 : 0) - A.lift) * (1 - Math.exp(-7 * d))
    A.glow += ((exhibitHere ? 0.08 : hotNow ? 0.35 : focused ? 0.18 : 0) - A.glow) * (1 - Math.exp(-7 * d))
    // the island's own prop steps aside while its exhibit is on show
    if (propGroup.current) {
      const target = exhibitHere ? 0 : 1
      const cur = propGroup.current.scale.x
      const nx = cur + (target - cur) * (1 - Math.exp(-6 * d))
      propGroup.current.scale.setScalar(Math.max(0.0001, nx))
    }
    const bob = hero ? Math.sin(performance.now() / 1000 * 0.5 + island.seed * 6.28) * 0.05 : 0
    g.position.set(island.x, island.y + bob + A.lift - (1 - introK) * 2.6, island.z)
    const sc = (dimmed ? 0.94 : 1) * (0.2 + introK * 0.8)
    g.scale.setScalar(sc)
    landMats.forEach((m, i) => {
      m.emissive.copy(palette.accent)
      m.emissiveIntensity = A.glow * 0.18
      m.color.copy(palette.land[i]).lerp(palette.accent, A.glow * 0.22)
    })
    rockMat.color.copy(palette.rock).lerp(palette.accent, A.glow * 0.12)
    rockMat.emissive.copy(palette.accent)
    rockMat.emissiveIntensity = A.glow * 0.08
  })

  const open = () => {
    if (!interactive) return
    setWorld({ selected: island.id, hover: island.id, beat: 0 })
  }
  const onOver = (e: ThreeEvent<PointerEvent>) => {
    if (!interactive) return
    e.stopPropagation()
    setWorld({ hover: island.id })
    document.body.style.cursor = 'pointer'
  }
  const onOut = () => {
    if (!interactive) return
    if (getWorld().hover === island.id) setWorld({ hover: null })
    document.body.style.cursor = ''
  }
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    open()
  }

  const seg = quality === 'high' ? island.sides : Math.max(5, island.sides - 2)
  return (
    <group ref={group} onPointerOver={onOver} onPointerOut={onOut} onClick={onClick} onPointerDown={onClick}>
      <mesh position={[0, r * 0.2, 0]} onPointerDown={onClick} onClick={onClick}>
        <sphereGeometry args={[Math.max(0.7, r * 1.45), 12, 10]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {/* rock: an inverted faceted cone */}
      <mesh position={[0, -rockH / 2, 0]} rotation={[0, island.seed * Math.PI, 0]} material={rockMat} castShadow receiveShadow>
        <cylinderGeometry args={[r * 0.98, r * 0.16, rockH, seg, 1]} />
      </mesh>
      {/* plateaus — Mathematics and Python get a designed miniature; others stay data-driven cylinders */}
      {island.id === 'maths' ? (
        <MathsLand r={r} stack={stack} land={landMats} teal={tealMat} ink={propMat} seg={seg} />
      ) : island.id === 'python' ? (
        <PythonLand r={r} stack={stack} land={landMats} teal={tealMat} ink={propMat} />
      ) : (
        stack.map((l, i) => (
          <mesh key={i} position={[l.dx, l.y, l.dz]} rotation={[0, l.rot, 0]} material={landMats[Math.min(2, i)]} castShadow receiveShadow>
            <cylinderGeometry args={[l.radius, l.radius * 1.04, l.h, seg + 2, 1]} />
          </mesh>
        ))
      )}
      {island.peak && island.id !== 'maths' && island.id !== 'python' && (
        <mesh position={[-topLayer.radius * 0.45, topY + r * 0.22, topLayer.radius * 0.3]} material={landMats[2]} castShadow>
          <coneGeometry args={[r * 0.26, r * 0.46, 5]} />
        </mesh>
      )}
      <group ref={propGroup}>
        {island.id !== 'maths' && island.id !== 'python' && (
          <Prop kind={island.prop} r={r} y={topY} ink={propMat} teal={tealMat} land={landMats[0]} />
        )}
        {island.id === 'physics' && <HorizonMotes r={r} y={topY} active={hot} />}
        {island.id !== 'maths' && island.id !== 'python' && (
          <IsleGrove r={r} y={topY} seed={island.seed} dark={palette.dark} />
        )}
        {island.seed > 0.62 && island.id !== 'maths' && island.id !== 'python' && (
          <mesh position={[r * 0.4, topY * 0.4, 0]} rotation={[0.2, 0.4, 0.9]} material={landMats[0]}>
            <cylinderGeometry args={[0.012, 0.012, r * 0.9, 4]} />
          </mesh>
        )}
        {(island.id === 'biology' || island.id === 'geography') && (
          <mesh position={[r * 0.35, -r * 0.2, 0]} material={tealMat}>
            <boxGeometry args={[0.03, r * 1.1, 0.03]} />
          </mesh>
        )}
      </group>
      {hasExhibit(island.id) && !exhibitOpen && (
        <mesh position={[0, topY + 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} material={tealMat}>
          <ringGeometry args={[r * 0.72, r * 0.82, 32]} />
        </mesh>
      )}
      {exhibitOpen && <Diorama kind={exhibitFor(island.id)!.diorama} r={r} y={topY} ink={propMat} teal={tealMat} warm={warmMat} land={landMats[2]} />}
      {review && (
        <group position={[topLayer.radius * 0.55, topY, -topLayer.radius * 0.4]}>
          <mesh position={[0, 0.11, 0]} material={warmMat} castShadow>
            <coneGeometry args={[0.07, 0.22, 8]} />
          </mesh>
          <mesh position={[0, 0.26, 0]} material={warmMat}>
            <sphereGeometry args={[0.055, 12, 10]} />
          </mesh>
        </group>
      )}
      {hot && !exhibitOpen && (
        <Html position={[0, topY + r * 0.95, 0]} center zIndexRange={[20, 10]} style={{ pointerEvents: 'auto' }}>
          <button
            type="button"
            className={`island-label${hot ? ' is-hot' : ''}`}
            onPointerDown={(e) => {
              e.stopPropagation()
              open()
            }}
          >
            {island.label}
            {hot && island.questions > 0 && <span> · {island.questions}</span>}
            {review && <span className="island-label-warm">revisit</span>}
          </button>
        </Html>
      )}
    </group>
  )
}

type LandLayer = { radius: number; h: number; y: number; dx: number; dz: number; rot: number }

/** Mathematics — concentric octagonal terraces (place-value board) and a standing zero. */
function MathsLand({ r, stack, land, teal, ink, seg }: { r: number; stack: LandLayer[]; land: THREE.Material[]; teal: THREE.Material; ink: THREE.Material; seg: number }) {
  const top = stack.reduce((s, l) => s + l.h, 0)
  return (
    <group>
      {stack.map((l, i) => (
        <mesh key={i} position={[0, l.y, 0]} material={land[Math.min(2, i)]} castShadow receiveShadow>
          <cylinderGeometry args={[l.radius, l.radius * 1.06, l.h, Math.max(8, seg), 1]} />
        </mesh>
      ))}
      {/* rim counters — empty place in the middle of one arc */}
      {Array.from({ length: 10 }, (_, i) => {
        if (i === 4 || i === 5) return null
        const a = (i / 10) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.cos(a) * r * 0.72, top + 0.04, Math.sin(a) * r * 0.72]} material={ink} castShadow>
            <cylinderGeometry args={[0.045, 0.045, 0.05, 10]} />
          </mesh>
        )
      })}
      <mesh position={[0, top + r * 0.28, 0]} rotation={[Math.PI / 2, 0, 0]} material={teal} castShadow>
        <torusGeometry args={[r * 0.16, r * 0.035, 10, 32]} />
      </mesh>
    </group>
  )
}

/** Python — indented slabs like nested blocks, a teal “cursor”. */
function PythonLand({ r, stack, land, teal, ink }: { r: number; stack: LandLayer[]; land: THREE.Material[]; teal: THREE.Material; ink: THREE.Material }) {
  const indents = [0, 0.12, 0.28, 0.16]
  return (
    <group>
      {stack.map((l, i) => {
        const w = r * (1.7 - i * 0.32)
        const d = r * (1.15 - i * 0.12)
        return (
          <mesh key={i} position={[indents[i] * r - r * 0.08, l.y, 0]} material={land[Math.min(2, i)]} castShadow receiveShadow>
            <boxGeometry args={[w, l.h, d]} />
          </mesh>
        )
      })}
      {stack.map((l, i) => (
        <mesh key={`line-${i}`} position={[indents[i] * r + r * 0.05, l.y + l.h * 0.55, r * 0.42]} material={i === 2 ? teal : ink} castShadow>
          <boxGeometry args={[r * (0.7 - i * 0.12), 0.03, 0.05]} />
        </mesh>
      ))}
      <mesh position={[r * 0.42, stack[stack.length - 1].y + 0.14, 0]} material={teal} castShadow>
        <boxGeometry args={[0.08, 0.16, 0.08]} />
      </mesh>
    </group>
  )
}

function IsleGrove({ r, y, seed, dark }: { r: number; y: number; seed: number; dark: boolean }) {
  const g = useRef<THREE.Group>(null)
  const n = 1 + (seed > 0.4 ? 1 : 0) + (seed > 0.75 ? 1 : 0)
  useFrame(() => {
    const el = g.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    el.rotation.z = Math.sin(performance.now() / 1400 + seed * 8) * 0.035
  })
  const leaf = dark ? '#8fbf84' : '#3f7a38'
  const leaf2 = dark ? '#c5dcb0' : '#5a9a48'
  const bark = dark ? '#6a5a48' : '#5c4634'
  return (
    <group ref={g}>
      {Array.from({ length: n }, (_, i) => {
        const a = seed * 6.2 + i * 2.1
        const d = r * (0.18 + i * 0.16)
        return (
          <group key={i} position={[Math.cos(a) * d, y, Math.sin(a) * d]}>
            <mesh position={[0, r * 0.28, 0]} castShadow>
              <cylinderGeometry args={[r * 0.028, r * 0.045, r * 0.55, 6]} />
              <meshStandardMaterial color={bark} roughness={0.9} />
            </mesh>
            <mesh position={[0, r * 0.58, 0]} castShadow>
              <sphereGeometry args={[r * 0.26, 8, 6]} />
              <meshStandardMaterial color={leaf} roughness={0.75} />
            </mesh>
            <mesh position={[r * 0.1, r * 0.72, r * 0.04]} castShadow>
              <sphereGeometry args={[r * 0.18, 8, 6]} />
              <meshStandardMaterial color={leaf2} roughness={0.75} />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

/* subject-themed props — small, abstract, never a building */
function Prop({ kind, r, y, ink, teal, land }: { kind: Island['prop']; r: number; y: number; ink: THREE.Material; teal: THREE.Material; land: THREE.Material }) {
  const s = r
  switch (kind) {
    case 'obelisk':
      return (
        <mesh position={[0, y + s * 0.45, 0]} material={ink} castShadow>
          <cylinderGeometry args={[0.02, s * 0.09, s * 0.9, 4]} />
        </mesh>
      )
    case 'orrery':
      return (
        <group position={[0, y + s * 0.4, 0]}>
          <mesh material={ink} castShadow>
            <sphereGeometry args={[s * 0.14, 16, 12]} />
          </mesh>
          <mesh rotation={[Math.PI / 2.6, 0.4, 0]} material={teal}>
            <torusGeometry args={[s * 0.34, 0.012, 8, 48]} />
          </mesh>
          <mesh position={[0, -s * 0.4, 0]} material={ink}>
            <cylinderGeometry args={[0.02, 0.04, s * 0.5, 8]} />
          </mesh>
        </group>
      )
    case 'flask':
      return (
        <group position={[0, y, 0]}>
          <mesh position={[0, s * 0.22, 0]} material={teal} castShadow>
            <coneGeometry args={[s * 0.2, s * 0.44, 12]} />
          </mesh>
          <mesh position={[0, s * 0.5, 0]} material={ink}>
            <cylinderGeometry args={[0.03, 0.03, s * 0.16, 8]} />
          </mesh>
        </group>
      )
    case 'tree':
      return (
        <group position={[s * 0.15, y, -s * 0.1]}>
          <mesh position={[0, s * 0.22, 0]} material={ink} castShadow>
            <cylinderGeometry args={[0.025, 0.04, s * 0.44, 6]} />
          </mesh>
          <mesh position={[0, s * 0.5, 0]} material={teal} castShadow>
            <coneGeometry args={[s * 0.26, s * 0.34, 7]} />
          </mesh>
          <mesh position={[0, s * 0.72, 0]} material={teal} castShadow>
            <coneGeometry args={[s * 0.17, s * 0.28, 7]} />
          </mesh>
        </group>
      )
    case 'columns':
      return (
        <group position={[0, y, 0]}>
          {[-1, 0, 1].map((i) => (
            <mesh key={i} position={[i * s * 0.22, s * 0.2 + (i === 0 ? 0.03 : 0), 0]} material={land} castShadow>
              <cylinderGeometry args={[0.035, 0.04, s * 0.4 + (i === 0 ? 0.06 : 0), 10]} />
            </mesh>
          ))}
          <mesh position={[0, s * 0.44, 0]} material={ink}>
            <boxGeometry args={[s * 0.6, 0.03, 0.12]} />
          </mesh>
        </group>
      )
    case 'globe':
      return (
        <group position={[0, y + s * 0.38, 0]}>
          <mesh material={teal} castShadow>
            <sphereGeometry args={[s * 0.2, 14, 10]} />
          </mesh>
          <mesh rotation={[0, 0, 0.42]} material={ink}>
            <torusGeometry args={[s * 0.27, 0.01, 6, 40, Math.PI * 1.3]} />
          </mesh>
          <mesh position={[0, -s * 0.33, 0]} material={ink}>
            <cylinderGeometry args={[0.02, 0.05, s * 0.3, 8]} />
          </mesh>
        </group>
      )
    case 'steps':
      return (
        <group position={[-s * 0.2, y, 0]}>
          {[0, 1, 2].map((i) => (
            <mesh key={i} position={[i * s * 0.2, (s * 0.12 * (i + 1)) / 2, 0]} material={i === 2 ? teal : ink} castShadow>
              <boxGeometry args={[s * 0.16, s * 0.12 * (i + 1), s * 0.16]} />
            </mesh>
          ))}
        </group>
      )
    case 'arch':
      return (
        <group position={[0, y, 0]}>
          <mesh position={[0, s * 0.3, 0]} rotation={[0, 0.5, 0]} material={ink} castShadow>
            <torusGeometry args={[s * 0.26, 0.03, 8, 32, Math.PI]} />
          </mesh>
          <mesh position={[s * 0.228, s * 0.15, -s * 0.125]} material={ink}>
            <cylinderGeometry args={[0.03, 0.03, s * 0.3, 8]} />
          </mesh>
          <mesh position={[-s * 0.228, s * 0.15, s * 0.125]} material={ink}>
            <cylinderGeometry args={[0.03, 0.03, s * 0.3, 8]} />
          </mesh>
        </group>
      )
    case 'stack':
      return (
        <group position={[0, y, 0]}>
          {[0, 1, 2, 3].map((i) => (
            <mesh key={i} position={[(i % 2) * 0.03, 0.045 + i * 0.09, 0]} rotation={[0, i * 0.35, 0]} material={i === 3 ? teal : i % 2 ? land : ink} castShadow>
              <boxGeometry args={[s * 0.44, 0.08, s * 0.3]} />
            </mesh>
          ))}
        </group>
      )
    case 'blocks':
      return (
        <group position={[0, y, 0]}>
          <mesh position={[-s * 0.12, s * 0.1, 0]} material={ink} castShadow>
            <boxGeometry args={[s * 0.2, s * 0.2, s * 0.2]} />
          </mesh>
          <mesh position={[s * 0.12, s * 0.1, s * 0.05]} material={ink} castShadow>
            <boxGeometry args={[s * 0.2, s * 0.2, s * 0.2]} />
          </mesh>
          <mesh position={[0, s * 0.3, 0.02]} material={teal} castShadow>
            <boxGeometry args={[s * 0.2, s * 0.2, s * 0.2]} />
          </mesh>
        </group>
      )
    case 'horizon':
      return (
        <group position={[0, y + s * 0.28, 0]}>
          <mesh material={ink} castShadow>
            <sphereGeometry args={[s * 0.16, 20, 16]} />
          </mesh>
          <mesh rotation={[Math.PI / 2.15, 0.2, 0]} material={teal}>
            <torusGeometry args={[s * 0.32, 0.018, 8, 48]} />
          </mesh>
        </group>
      )
    default:
      return (
        <group position={[0, y, 0]}>
          <mesh position={[0, s * 0.16, 0]} material={ink} castShadow>
            <cylinderGeometry args={[s * 0.06, s * 0.14, s * 0.32, 6]} />
          </mesh>
          <mesh position={[0, s * 0.38, 0]} material={teal}>
            <octahedronGeometry args={[s * 0.09, 0]} />
          </mesh>
        </group>
      )
  }
}

/** Physics — a few motes that spiral into the horizon when hovered or selected. */
function HorizonMotes({ r, y, active }: { r: number; y: number; active: boolean }) {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(36 * 3), 3))
    return g
  }, [])
  const mat = useMemo(
    () => new THREE.PointsMaterial({ color: '#e8c9a0', size: 0.045, transparent: true, opacity: 0.85, depthWrite: false }),
    [],
  )
  useFrame(() => {
    const t = performance.now() / 1000
    const arr = geo.attributes.position.array as Float32Array
    const spin = active ? 1.15 : 0.28
    for (let i = 0; i < 36; i++) {
      const u = i / 36
      const fall = active ? (t * 0.22 + u) % 1 : 0.35 + u * 0.2
      const rad = r * (0.52 * (1 - fall * 0.85))
      const ang = u * Math.PI * 2 + t * spin
      arr[i * 3] = Math.cos(ang) * rad
      arr[i * 3 + 1] = y + 0.28 + Math.sin(ang * 1.7) * 0.03 - fall * 0.08
      arr[i * 3 + 2] = Math.sin(ang) * rad * 0.42
    }
    geo.attributes.position.needsUpdate = true
    mat.opacity = active ? 0.9 : 0.35
  })
  useEffect(() => () => {
    geo.dispose()
    mat.dispose()
  }, [geo, mat])
  return <points geometry={geo} material={mat} />
}

/* ── exhibit dioramas: three beats, one visible at a time ────────────── */
function BeatGroup({ index, children }: { index: 0 | 1 | 2; children: React.ReactNode }) {
  const g = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    const el = g.current
    if (!el) return
    const on = getWorld().beat === index
    const k = 1 - Math.exp(-6 * Math.min(0.05, dt))
    const target = on ? 1 : 0
    const cur = el.scale.x
    const nx = cur + (target - cur) * k
    el.scale.setScalar(Math.max(0.0001, nx))
    el.visible = nx > 0.01
    el.position.y = (1 - nx) * -0.15
  })
  return (
    <group ref={g} scale={0.0001}>
      {children}
    </group>
  )
}

function Diorama({ kind, r, y, ink, teal, warm, land }: { kind: 'zero' | 'python'; r: number; y: number; ink: THREE.Material; teal: THREE.Material; warm: THREE.Material; land: THREE.Material }) {
  const s = Math.max(0.6, r) // dioramas are built at island scale
  // a low plinth every beat stands on
  const plinth = (
    <mesh position={[0, y + 0.02, 0]} material={land} receiveShadow>
      <cylinderGeometry args={[s * 0.62, s * 0.66, 0.04, 24]} />
    </mesh>
  )
  if (kind === 'zero') {
    return (
      <group>
        {plinth}
        {/* BEFORE — a counting board: three columns of counters, the middle one empty */}
        <BeatGroup index={0}>
          <mesh position={[0, y + 0.07, 0]} material={ink} castShadow>
            <boxGeometry args={[s * 0.9, 0.05, s * 0.5]} />
          </mesh>
          {[-1, 1].map((col) =>
            [0, 1, 2, 3].slice(0, col < 0 ? 4 : 2).map((i) => (
              <mesh key={`${col}-${i}`} position={[col * s * 0.28, y + 0.12 + i * 0.05, 0]} material={land} castShadow>
                <cylinderGeometry args={[s * 0.09, s * 0.09, 0.035, 16]} />
              </mesh>
            )),
          )}
          {/* the empty place */}
          <mesh position={[0, y + 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]} material={warm}>
            <ringGeometry args={[s * 0.06, s * 0.085, 24]} />
          </mesh>
        </BeatGroup>
        {/* BREAKTHROUGH — zero stands up as a number, between a positive and a negative */}
        <BeatGroup index={1}>
          <mesh position={[0, y + s * 0.38, 0]} material={teal} castShadow>
            <torusGeometry args={[s * 0.26, s * 0.045, 12, 48]} />
          </mesh>
          <mesh position={[-s * 0.42, y + s * 0.12, 0]} material={ink} castShadow>
            <boxGeometry args={[s * 0.06, s * 0.2, s * 0.06]} />
          </mesh>
          <mesh position={[-s * 0.42, y + s * 0.12, 0]} material={ink} castShadow>
            <boxGeometry args={[s * 0.2, s * 0.06, s * 0.06]} />
          </mesh>
          <mesh position={[s * 0.42, y + s * 0.12, 0]} material={ink} castShadow>
            <boxGeometry args={[s * 0.2, s * 0.06, s * 0.06]} />
          </mesh>
        </BeatGroup>
        {/* AFTER — place value: columns rising by powers of ten, zero at the base of each */}
        <BeatGroup index={2}>
          {[0, 1, 2, 3].map((i) => (
            <group key={i} position={[(i - 1.5) * s * 0.26, y, 0]}>
              <mesh position={[0, 0.06 + i * s * 0.11, 0]} material={i === 3 ? teal : ink} castShadow>
                <boxGeometry args={[s * 0.12, 0.08 + i * s * 0.22, s * 0.12]} />
              </mesh>
              <mesh position={[0, 0.03, s * 0.12]} rotation={[-Math.PI / 2, 0, 0]} material={teal}>
                <ringGeometry args={[s * 0.03, s * 0.045, 20]} />
              </mesh>
            </group>
          ))}
        </BeatGroup>
      </group>
    )
  }
  // python
  return (
    <group>
      {plinth}
      {/* BEFORE — dense, uniform lines: C programs and shell scripts, a wall with no door */}
      <BeatGroup index={0}>
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <mesh key={i} position={[0, y + 0.06 + i * 0.075, 0]} material={ink} castShadow>
            <boxGeometry args={[s * 0.8, 0.03, s * 0.16]} />
          </mesh>
        ))}
        <mesh position={[0, y + 0.3, -s * 0.3]} material={land} castShadow>
          <boxGeometry args={[s * 0.9, s * 0.56, 0.05]} />
        </mesh>
      </BeatGroup>
      {/* BREAKTHROUGH — indentation as structure: blocks stepping in, readable at a glance */}
      <BeatGroup index={1}>
        {[0, 1, 2, 1, 0].map((indent, i) => (
          <mesh key={i} position={[-s * 0.3 + indent * s * 0.16 + (0.55 - indent * 0.12) * s * 0.5, y + 0.34 - i * 0.075, 0]} material={i === 2 ? teal : ink} castShadow>
            <boxGeometry args={[(0.55 - indent * 0.12) * s, 0.035, s * 0.14]} />
          </mesh>
        ))}
      </BeatGroup>
      {/* AFTER — one post, many copies: small blocks fanning outward from the centre */}
      <BeatGroup index={2}>
        <mesh position={[0, y + 0.1, 0]} material={teal} castShadow>
          <boxGeometry args={[s * 0.16, 0.16, s * 0.16]} />
        </mesh>
        {Array.from({ length: 14 }, (_, i) => {
          const a = (i / 14) * Math.PI * 2
          const d = s * (0.3 + hash01('py', i) * 0.28)
          return (
            <mesh key={i} position={[Math.cos(a) * d, y + 0.04, Math.sin(a) * d]} rotation={[0, -a, 0]} material={ink} castShadow>
              <boxGeometry args={[s * 0.07, 0.05 + hash01('py', i + 20) * 0.05, s * 0.07]} />
            </mesh>
          )
        })}
      </BeatGroup>
    </group>
  )
}

/* ── bridges: raised teal arcs between related islands ───────────────── */
function Bridges({ islands, bridges, palette, quality }: { islands: Island[]; bridges: Bridge[]; palette: Palette; quality: Quality }) {
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: palette.bridge, roughness: 0.5, metalness: 0.1 }), [])
  useEffect(() => {
    mat.color.copy(palette.bridge)
  }, [palette, mat])
  const geos = useMemo(
    () =>
      bridges.map((b) => {
        const A = islands[b.a]
        const B = islands[b.b]
        const topA = A.layers.reduce((s, l) => s + l[1], 0)
        const topB = B.layers.reduce((s, l) => s + l[1], 0)
        const dir = _v.set(B.x - A.x, 0, B.z - A.z).normalize()
        const a = new THREE.Vector3(A.x + dir.x * A.r * 0.75, A.y + topA + 0.02, A.z + dir.z * A.r * 0.75)
        const bb = new THREE.Vector3(B.x - dir.x * B.r * 0.75, B.y + topB + 0.02, B.z - dir.z * B.r * 0.75)
        const mid = a.clone().lerp(bb, 0.5)
        mid.y += 0.25 + a.distanceTo(bb) * 0.09
        return new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(a, mid, bb), quality === 'high' ? 28 : 16, b.kind === 1 ? 0.04 : 0.03, 6, false)
      }),
    [islands, bridges, quality],
  )
  useEffect(() => () => geos.forEach((g) => g.dispose()), [geos])
  return (
    <>
      {geos.map((g, i) => (
        <mesh key={i} geometry={g} material={mat} castShadow />
      ))}
    </>
  )
}

/* ── soft clouds drifting below the islands (high quality only) ─────── */
function Clouds({ palette }: { palette: Palette }) {
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: palette.dark ? '#9aadc0' : '#f4f7fb', roughness: 1, transparent: true, opacity: palette.dark ? 0.28 : 0.7, fog: false }), [])
  useEffect(() => {
    mat.color.set(palette.dark ? '#9aadc0' : '#f4f7fb')
    mat.opacity = palette.dark ? 0.28 : 0.7
  }, [palette, mat])
  const group = useRef<THREE.Group>(null)
  const puffs = useMemo(
    () =>
      Array.from({ length: 11 }, (_, i) => ({
        x: (hash01('cloud', i) - 0.5) * 22,
        y: 6.2 + hash01('cloud', i + 10) * 3.2,
        z: (hash01('cloud', i + 20) - 0.5) * 16,
        s: 1.2 + hash01('cloud', i + 30) * 1.6,
        sp: 0.025 + hash01('cloud', i + 40) * 0.03,
      })),
    [],
  )
  useFrame(() => {
    const g = group.current
    if (!g || getWorld().mode !== 'hero') return
    const t = performance.now() / 1000
    g.children.forEach((c, i) => {
      c.position.x = puffs[i].x + Math.sin(t * puffs[i].sp + i) * 0.6
    })
  })
  return (
    <group ref={group}>
      {puffs.map((p, i) => (
        <mesh key={i} position={[p.x, p.y, p.z]} scale={[p.s * 1.8, p.s * 0.5, p.s]} material={mat}>
          <sphereGeometry args={[1, 10, 7]} />
        </mesh>
      ))}
    </group>
  )
}

/* ── camera + world offset + on-demand loop ──────────────────────────── */
function Director({ islands, worldRef }: { islands: Island[]; worldRef: React.RefObject<THREE.Group> }) {
  const { size, invalidate } = useThree()
  const S = useRef({ pos: new THREE.Vector3(...CAM.hero.pos), look: new THREE.Vector3(...CAM.hero.look), fov: 34, off: new THREE.Vector3(), lastTick: -1, settle: 0 })
  useFrame(({ camera }, rawDt) => {
    const dt = Math.min(0.05, rawDt)
    const s = getWorld()
    if (s.explore) return
    const st = S.current
    const narrow = size.width < 768
    const base = s.mode === 'hero' ? CAM.hero : CAM.quiet
    const preset = narrow ? base.phone : base
    _v.set(preset.pos[0], preset.pos[1], preset.pos[2])
    _v2.set(preset.look[0], preset.look[1], preset.look[2])
    let fov: number = preset.fov
    // framed canvas (Home stage) is already the map's box — centre the world. Full-bleed pages keep the old offset.
    const off = s.framed ? _off.set(0, 0, 0) : narrow ? _off.set(0, -1.6, 0) : _off.set(1.9, 0, 0)
    if (s.mode === 'focus' && s.focus) {
      const isl = islands.find((i) => i.id === s.focus)
      if (isl) {
        _v2.set(isl.x, isl.y + 0.2, isl.z)
        _v.set(isl.x + (narrow ? 0.4 : 3.1), isl.y + 2.4, isl.z + (narrow ? 5.2 : 3.6))
        fov = narrow ? 44 : 34
        off.set(narrow ? 0 : 2.6, narrow ? -1.2 : 0, 0)
      }
    }
    const exhibit = s.selected && hasExhibit(s.selected) ? islands.find((i) => i.id === s.selected) : null
    if (exhibit) {
      // step into the island: low, close, and a different side for each beat (guided reveal)
      const top = exhibit.y + exhibit.layers.reduce((a, l) => a + l[1], 0)
      const rr = Math.max(0.6, exhibit.r)
      const ang = [-0.55, 0.15, 0.8][s.beat] ?? 0
      const dist = rr * 2.9 + 0.9
      _v2.set(exhibit.x, top + rr * 0.22, exhibit.z)
      _v.set(exhibit.x + Math.sin(ang) * dist, top + rr * 1.05 + 0.25, exhibit.z + Math.cos(ang) * dist)
      fov = narrow ? 42 : 30
      off.set(s.framed ? 0 : narrow ? 0 : -2.3, s.framed ? 0 : narrow ? 1.15 : 0, 0)
    } else if (s.mode === 'hero') {
      const pick = s.selected || s.hover
      const target = pick ? islands.find((i) => i.id === pick) : null
      if (s.framed) {
        const yaw = performance.now() / 1000 * 0.045
        _v.set(Math.sin(yaw) * 0.42, narrow ? 1.55 : 1.82, Math.cos(yaw) * 0.42)
        if (target) {
          _v2.set(target.x, target.y + 0.25, target.z)
          const dx = target.x - _v.x
          const dz = target.z - _v.z
          const len = Math.hypot(dx, dz) || 1
          _v.set(target.x - (dx / len) * (narrow ? 2.6 : 3.1), target.y + (narrow ? 1.4 : 1.7), target.z - (dz / len) * (narrow ? 2.6 : 3.1))
        } else {
          _v2.set(Math.sin(yaw) * 3.4, 0.15, Math.cos(yaw) * 3.4)
        }
        fov = narrow ? 48 : 42
      }
      const pin = s.pointerIn && !target ? 1 : 0
      _v.x += s.px * 0.12 * pin
      _v.y += s.py * 0.08 * pin
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && !s.explore) {
        const t = performance.now() / 1000
        _v.x += Math.sin(t * 0.12) * 0.18
        _v.y += Math.sin(t * 0.09) * 0.1
      }
    }
    const l = 1 - Math.exp(-(exhibit ? 1.15 : 2.2) * dt)
    st.pos.lerp(_v, l)
    st.look.lerp(_v2, l)
    st.off.lerp(off, l)
    st.fov += (fov - st.fov) * l
    camera.position.copy(st.pos)
    camera.lookAt(st.look)
    const pc = camera as THREE.PerspectiveCamera
    if (Math.abs(pc.fov - st.fov) > 0.01) {
      pc.fov = st.fov
      pc.updateProjectionMatrix()
    }
    if (worldRef.current) worldRef.current.position.copy(st.off)
    // on-demand: keep rendering while anything is still moving, then stop
    const moving = st.pos.distanceToSquared(_v) > 1e-5 || st.look.distanceToSquared(_v2) > 1e-5 || st.off.distanceToSquared(off) > 1e-5 || Math.abs(fov - st.fov) > 0.02
    if (s.mode === 'hero' || moving || st.settle > 0) {
      st.settle = moving ? 1.6 : Math.max(0, st.settle - dt)
      invalidate()
    }
  })
  // any store change (hover, selection, categories, theme) asks for frames
  useEffect(
    () =>
      subscribeWorld(() => {
        S.current.settle = 1.6
        invalidate()
      }),
    [invalidate],
  )
  return null
}

function Lights({ palette, quality }: { palette: Palette; quality: Quality }) {
  return (
    <>
      <hemisphereLight args={[palette.sky, palette.ground, palette.dark ? 1.15 : 1.85]} />
      <directionalLight
        position={[-6, 9, 5]}
        intensity={palette.dark ? 1.5 : 1.8}
        color={palette.key}
        castShadow={quality === 'high'}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-9}
        shadow-camera-right={9}
        shadow-camera-top={9}
        shadow-camera-bottom={-9}
        shadow-bias={-0.0006}
        shadow-radius={5}
      />
      <directionalLight position={[6, 3, -6]} intensity={palette.dark ? 0.7 : 0.5} color={palette.dark ? '#f0dcc4' : '#fff6e8'} />
    </>
  )
}

function Atmosphere({ palette }: { palette: Palette }) {
  const sun = palette.dark ? ([8, 6, -18] as const) : ([60, 28, 40] as const)
  return (
    <Sky
      distance={400000}
      sunPosition={sun}
      turbidity={palette.dark ? 10 : 5.5}
      rayleigh={palette.dark ? 0.35 : 2.2}
      mieCoefficient={0.004}
      mieDirectionalG={0.8}
    />
  )
}

function Forest({ palette, quality }: { palette: Palette; quality: Quality }) {
  const count = quality === 'high' ? 220 : 90
  const mesh = useRef<THREE.InstancedMesh>(null)
  const group = useRef<THREE.Group>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const mat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: palette.dark ? '#3d6a48' : '#4e7a3c', roughness: 0.92, flatShading: true }),
    [palette],
  )
  useEffect(() => {
    const m = mesh.current
    if (!m) return
    for (let i = 0; i < count; i++) {
      const a = hash01('canopy', i) * Math.PI * 2
      const rad = 8 + hash01('canopy', i + 3) * 22
      dummy.position.set(Math.cos(a) * rad, -8.2 + hash01('canopy', i + 7) * 0.8, Math.sin(a) * rad)
      const s = 0.45 + hash01('canopy', i + 11) * 0.95
      dummy.scale.set(s * 1.15, s * 0.85, s * 1.15)
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
    }
    m.instanceMatrix.needsUpdate = true
  }, [count, dummy])
  useFrame(() => {
    const g = group.current
    if (!g || getWorld().mode !== 'hero') return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return
    const t = performance.now() / 1000
    g.position.y = Math.sin(t * 0.18) * 0.06
  })
  return (
    <group ref={group}>
      <instancedMesh ref={mesh} args={[undefined, undefined, count]} material={mat}>
        <sphereGeometry args={[0.62, 6, 5]} />
      </instancedMesh>
    </group>
  )
}

function Hills({ palette }: { palette: Palette }) {
  const col = palette.dark ? '#3a5844' : '#628a50'
  return (
    <group>
      {[
        [-22, -11, -36, 7, 2.1],
        [20, -11.4, -34, 6, 1.8],
        [0, -12, -42, 9, 2.4],
        [12, -11.6, 38, 5.5, 1.6],
        [-14, -11.8, 36, 6.2, 1.7],
      ].map((h, i) => (
        <mesh key={i} position={[h[0], h[1], h[2]]} scale={[h[3], h[4], h[3] * 0.65]}>
          <sphereGeometry args={[1, 10, 7]} />
          <meshStandardMaterial color={col} roughness={1} flatShading />
        </mesh>
      ))}
    </group>
  )
}

function DriftLeaves({ palette }: { palette: Palette }) {
  const n = 18
  const mesh = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const mat = useMemo(
    () => new THREE.MeshBasicMaterial({ color: palette.dark ? '#8fbf7a' : '#6a9a4a', transparent: true, opacity: 0.55, depthWrite: false }),
    [palette],
  )
  useFrame(() => {
    const m = mesh.current
    if (!m || getWorld().mode !== 'hero') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = performance.now() / 1000
    for (let i = 0; i < n; i++) {
      const u = (t * 0.04 + hash01('leaf', i)) % 1
      dummy.position.set((hash01('leaf', i + 2) - 0.5) * 12, 2.2 - u * 5.5, (hash01('leaf', i + 5) - 0.5) * 10)
      dummy.rotation.set(u * 2, u * 3, 0)
      dummy.scale.setScalar(0.08 + hash01('leaf', i + 8) * 0.08)
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
    }
    m.instanceMatrix.needsUpdate = true
  })
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, n]} material={mat}>
      <planeGeometry args={[1, 0.45]} />
    </instancedMesh>
  )
}

function ExploreRig() {
  const [on, setOn] = useState(false)
  const [held, setHeld] = useState(false)
  useWorldSlice((s) => s.explore, setOn)
  const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!on) return null
  return (
    <OrbitControls
      enablePan={false}
      enableDamping
      dampingFactor={0.08}
      autoRotate={!held && !reduce}
      autoRotateSpeed={0.32}
      minDistance={9}
      maxDistance={18}
      minPolarAngle={0.4}
      maxPolarAngle={Math.PI / 2.35}
      onStart={() => setHeld(true)}
      onEnd={() => setHeld(false)}
    />
  )
}

function FogSync({ palette }: { palette: Palette }) {
  const scene = useThree((s) => s.scene)
  useEffect(() => {
    scene.background = new THREE.Color(palette.sky)
    scene.fog = new THREE.Fog(new THREE.Color(palette.sky), palette.dark ? 22 : 26, palette.dark ? 90 : 110)
    return () => {
      scene.fog = null
    }
  }, [scene, palette])
  return null
}

function detectQuality(): Quality {
  if (typeof window === 'undefined') return 'low'
  const small = window.matchMedia('(max-width: 768px)').matches
  const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData
  return small || saveData ? 'low' : 'high'
}

export default function ArchipelagoScene() {
  const [palette, setPalette] = useState<Palette>(() => readPalette())
  const [quality] = useState<Quality>(() => detectQuality())
  const [categories, setCategories] = useState<CategoryInfo[]>(() => getWorld().categories)
  const [interactive, setInteractive] = useState(false)
  const [visible, setVisible] = useState(true)
  const [onScreen, setOnScreen] = useState(true)
  useEffect(() => onThemeChange(() => setPalette(readPalette())), [])
  useEffect(() => {
    const el = document.getElementById('island-stage')
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting), { threshold: 0.12 })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  useWorldSlice((s) => s.categories, setCategories)
  useWorldSlice((s) => s.mode === 'hero' || s.mode === 'focus', setInteractive)
  useWorldSlice((s) => s.mode !== 'off', setVisible)
  const { islands, bridges } = useMemo(() => buildIslands(categories), [categories])
  const worldRef = useRef<THREE.Group>(null)
  const dpr = Math.min(quality === 'high' ? 2 : 1.5, typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1)
  return (
    <Canvas
      dpr={dpr}
      shadows={quality === 'high'}
      frameloop={visible && onScreen ? 'always' : 'never'}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
      camera={{ position: CAM.hero.pos as unknown as [number, number, number], fov: 36, near: 0.2, far: 240 }}
      onPointerMissed={() => {
        setWorld({ hover: null })
        if (!getWorld().selected) setWorld({ explore: true, hover: null })
      }}
      style={{ pointerEvents: interactive ? 'auto' : 'none' }}
    >
      <FogSync palette={palette} />
      <Lights palette={palette} quality={quality} />
      <Director islands={islands} worldRef={worldRef} />
      <Atmosphere palette={palette} />
      <Hills palette={palette} />
      <Forest palette={palette} quality={quality} />
      {quality === 'high' && <DriftLeaves palette={palette} />}
      <group ref={worldRef}>
        {islands.map((isl, i) => (
          <IslandMesh key={isl.id} island={isl} palette={palette} quality={quality} index={i} interactive={interactive} />
        ))}
        <Bridges islands={islands} bridges={bridges} palette={palette} quality={quality} />
        {quality === 'high' && <Clouds palette={palette} />}
      </group>
      <ExploreRig />
    </Canvas>
  )
}
