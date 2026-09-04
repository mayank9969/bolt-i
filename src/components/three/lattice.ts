import * as THREE from 'three'

/**
 * The NEXUS lattice — geometry + state, independent of React.
 *
 * A single sculptural object: nodes on a golden-angle sphere, joined to
 * their nearest neighbours by struts, with one core node. It's the same
 * object on every page; only its *state* changes.
 *
 *   establish  → Home: whole lattice, slow breathing rotation
 *   configure  → Setup: a subset "arms" (topic) and density (difficulty)
 *   quiet      → Quiz: recedes; only the core and a few struts
 *   resolve    → Result: nodes light in proportion to the score
 *   archive    → History: one lit node per past attempt
 */

export type LatticeMode = 'establish' | 'configure' | 'quiet' | 'resolve' | 'archive'

export interface LatticeParams {
  mode: LatticeMode
  /** 0..1 — how much of the lattice is "lit" (score %, or progress) */
  progress: number
  /** 0..1 — connection density (difficulty: easy 0.35 · medium 0.6 · hard 1) */
  density: number
  /** which sector of the lattice is emphasised (topic). -1 = all */
  sector: number
  /** number of discrete lit nodes (history attempts). -1 = use progress */
  litCount: number
}

export const DEFAULT_PARAMS: LatticeParams = {
  mode: 'establish',
  progress: 0.45,
  density: 0.6,
  sector: -1,
  litCount: -1,
}

export interface LatticeGeometry {
  nodes: THREE.Vector3[]
  /** index pairs */
  edges: [number, number][]
  /** per-node sector 0..2 (three "disciplines" of the knowledge sphere) */
  sectors: number[]
  /** per-node ring (distance rank from core, 0 = core) */
  ranks: number[]
}

function mulberry32(a: number) {
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Golden-angle (Fibonacci) sphere: evenly spread nodes with no visible
 * poles or seams. Radius is jittered so it reads as grown, not generated.
 */
export function buildLattice(count = 56, radius = 1.6, seed = 11): LatticeGeometry {
  const rnd = mulberry32(seed)
  const nodes: THREE.Vector3[] = []
  const golden = Math.PI * (3 - Math.sqrt(5))

  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2
    const r = Math.sqrt(1 - y * y)
    const theta = golden * i
    const jitter = 0.86 + rnd() * 0.28
    nodes.push(new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r).multiplyScalar(radius * jitter))
  }
  // a handful of inner nodes so the sphere has an interior
  for (let i = 0; i < Math.floor(count * 0.28); i++) {
    const v = new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize().multiplyScalar(radius * (0.35 + rnd() * 0.4))
    nodes.push(v)
  }
  // the core
  nodes.push(new THREE.Vector3(0, 0, 0))
  const coreIndex = nodes.length - 1

  // k-nearest edges (k = 3) — sparse enough to stay legible
  const edges: [number, number][] = []
  const seen = new Set<string>()
  const k = 3
  nodes.forEach((p, i) => {
    const near = nodes
      .map((q, j) => ({ j, d: p.distanceToSquared(q) }))
      .filter((x) => x.j !== i)
      .sort((a, b) => a.d - b.d)
      .slice(0, k)
    near.forEach(({ j }) => {
      const key = i < j ? `${i}-${j}` : `${j}-${i}`
      if (!seen.has(key)) {
        seen.add(key)
        edges.push([i, j])
      }
    })
  })
  // core connects to the nearest 6 inner nodes
  nodes
    .map((q, j) => ({ j, d: q.lengthSq() }))
    .filter((x) => x.j !== coreIndex)
    .sort((a, b) => a.d - b.d)
    .slice(0, 6)
    .forEach(({ j }) => edges.push([coreIndex, j]))

  const sectors = nodes.map((p) => {
    const a = Math.atan2(p.z, p.x) + Math.PI // 0..2π
    return Math.min(2, Math.floor((a / (Math.PI * 2)) * 3))
  })
  const ranks = nodes.map((p) => (p.lengthSq() < 1e-6 ? 0 : p.length() < radius * 0.8 ? 1 : 2))

  return { nodes, edges, sectors, ranks }
}

/** Deterministic per-node "lit order" so the same score lights the same nodes. */
export function litOrder(geo: LatticeGeometry, seed = 5): number[] {
  const rnd = mulberry32(seed)
  const idx = geo.nodes.map((_, i) => i)
  // core first, then inner ring, then outer — shuffled within rank
  return idx
    .map((i) => ({ i, key: geo.ranks[i] * 10 + rnd() }))
    .sort((a, b) => a.key - b.key)
    .map((x) => x.i)
}

/** Smoothly interpolated runtime state (what the renderer actually reads). */
export class LatticeState {
  progress = 0.45
  density = 0.6
  sector = -1
  sectorMix = 0 // 0 = all sectors equal, 1 = focused
  quiet = 0 // 0 = full presence, 1 = receded
  target: LatticeParams = { ...DEFAULT_PARAMS }

  set(p: Partial<LatticeParams>) {
    this.target = { ...this.target, ...p }
  }

  /** exponential approach; dt in seconds */
  step(dt: number) {
    const k = 1 - Math.exp(-dt * 2.6)
    this.progress += (this.target.progress - this.progress) * k
    this.density += (this.target.density - this.density) * k
    const wantMix = this.target.sector >= 0 ? 1 : 0
    if (this.target.sector >= 0) this.sector = this.target.sector
    this.sectorMix += (wantMix - this.sectorMix) * k
    const wantQuiet = this.target.mode === 'quiet' ? 1 : 0
    this.quiet += (wantQuiet - this.quiet) * k
  }
}
