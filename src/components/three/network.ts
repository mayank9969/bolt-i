/**
 * THE LIVING KNOWLEDGE NETWORK — data model.
 *
 * Knowledge is modelled as regions ("clusters") of nodes in a deep volume:
 *   cluster 0 · Maths     cluster 1 · Python     cluster 2 · Mixed / bridge
 * Each cluster has a hierarchy: one hub → a few secondaries → many leaves.
 * Edges: hub–secondary "trunks", leaf links, and a handful of long bridges
 * between clusters. A pool of optional links switches on/off slowly so the
 * network rearranges instead of spinning.
 *
 * Pure TypeScript — no three.js — so it can be unit-tested in Node.
 */

export const CLUSTER_COUNT = 3

export interface Network {
  count: number
  /** home position xyz per node (the drift oscillates around it) */
  home: Float32Array
  /** 0 hub · 1 secondary · 2 leaf */
  tier: Uint8Array
  cluster: Uint8Array
  radius: Float32Array
  phase: Float32Array
  /** all edges as index pairs */
  edges: Uint16Array
  /** 0 trunk (hub–secondary) · 1 link · 2 bridge · 3 optional link */
  edgeKind: Uint8Array
  edgeCount: number
  hubs: number[]
  centers: [number, number, number][]
  /** BFS order from the hubs — the order in which knowledge "activates" */
  activationOrder: Uint16Array
  /** rank 0..1 of each node in the activation order */
  activationRank: Float32Array
  /** rank 0..1 of each node within its own cluster's activation order */
  clusterRank: Float32Array
  /** edge indices touching each node (includes optional links) */
  adjacency: number[][]
  /** shortest path length (world units) from each node to its own core — signals travel along this */
  pathLen: Float32Array
  /** BFS parent toward the core (-1 for cores) — the "knowledge path" back to the region centre */
  parent: Int16Array
  /** activation order restricted to each cluster (cores first) */
  clusterOrder: number[][]
}

export interface NetworkOptions {
  seed?: number
  secondaries?: number
  leaves?: number
  optionalRatio?: number
}

/** Mulberry32 — small deterministic PRNG so every visitor sees the same network. */
export function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function gauss(r: () => number) {
  // Box–Muller
  const u = 1 - r()
  const v = r()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

/** Cluster centres in world units — a diagonal through depth, right-weighted. */
export const CENTERS: [number, number, number][] = [
  [0.0, 0.0, 0.0],
  [2.9, -1.1, -3.6],
  [-1.6, 1.7, -6.8],
]

/** Per-cluster ellipsoid radii — flattened and tilted so nothing reads as a ball. */
const SPREAD: [number, number, number][] = [
  [1.55, 1.05, 1.35],
  [1.35, 1.25, 1.1],
  [1.7, 0.9, 1.4],
]

export function buildNetwork(opts: NetworkOptions = {}): Network {
  const { seed = 7, secondaries = 5, leaves = 38, optionalRatio = 0.3 } = opts
  const r = rng(seed)
  const perCluster = 1 + secondaries + leaves
  const count = CLUSTER_COUNT * perCluster

  const home = new Float32Array(count * 3)
  const tier = new Uint8Array(count)
  const cluster = new Uint8Array(count)
  const radius = new Float32Array(count)
  const phase = new Float32Array(count)
  const hubs: number[] = []

  let i = 0
  for (let c = 0; c < CLUSTER_COUNT; c++) {
    const [cx, cy, cz] = CENTERS[c]
    const [sx, sy, sz] = SPREAD[c]
    const tilt = (c - 1) * 0.35 // shear so the disc is tilted per cluster

    // hub
    hubs.push(i)
    home.set([cx, cy, cz], i * 3)
    tier[i] = 0
    cluster[i] = c
    radius[i] = 0.3
    phase[i] = r() * Math.PI * 2
    i++

    // secondaries — on a loose ring, mid distance
    for (let s = 0; s < secondaries; s++) {
      const a = (s / secondaries) * Math.PI * 2 + r() * 0.6
      const d = 0.55 + r() * 0.3
      const x = Math.cos(a) * d * sx
      const y = Math.sin(a) * d * sy * 0.8 + x * tilt
      const z = (r() - 0.5) * sz * 0.9
      home.set([cx + x, cy + y, cz + z], i * 3)
      tier[i] = 1
      cluster[i] = c
      radius[i] = 0.12 + r() * 0.04
      phase[i] = r() * Math.PI * 2
      i++
    }

    // leaves — gaussian cloud, rejected if too close to the hub
    for (let l = 0; l < leaves; l++) {
      let x = 0
      let y = 0
      let z = 0
      for (let tries = 0; tries < 8; tries++) {
        x = gauss(r) * 0.55 * sx
        y = gauss(r) * 0.55 * sy + x * tilt
        z = gauss(r) * 0.55 * sz
        const d = Math.hypot(x, y, z)
        if (d > 0.45 && d < 2.6) break
      }
      home.set([cx + x, cy + y, cz + z], i * 3)
      tier[i] = 2
      cluster[i] = c
      radius[i] = 0.035 + r() * 0.04
      phase[i] = r() * Math.PI * 2
      i++
    }
  }

  // ── edges ──
  const edges: number[] = []
  const kinds: number[] = []
  const seen = new Set<number>()
  const key = (a: number, b: number) => (a < b ? a * 65536 + b : b * 65536 + a)
  const add = (a: number, b: number, kind: number) => {
    if (a === b) return false
    const k = key(a, b)
    if (seen.has(k)) return false
    seen.add(k)
    edges.push(a, b)
    kinds.push(kind)
    return true
  }
  const dist2 = (a: number, b: number) => {
    const dx = home[a * 3] - home[b * 3]
    const dy = home[a * 3 + 1] - home[b * 3 + 1]
    const dz = home[a * 3 + 2] - home[b * 3 + 2]
    return dx * dx + dy * dy + dz * dz
  }
  const nearest = (idx: number, pool: number[], k: number) =>
    pool
      .filter((j) => j !== idx)
      .map((j) => ({ j, d: dist2(idx, j) }))
      .sort((p, q) => p.d - q.d)
      .slice(0, k)
      .map((p) => p.j)

  for (let c = 0; c < CLUSTER_COUNT; c++) {
    const members: number[] = []
    for (let n = 0; n < count; n++) if (cluster[n] === c) members.push(n)
    const hub = hubs[c]
    const secs = members.filter((n) => tier[n] === 1)
    const lvs = members.filter((n) => tier[n] === 2)

    // trunks
    secs.forEach((s) => add(hub, s, 0))
    // secondaries form a loose ring
    secs.forEach((s, k) => add(s, secs[(k + 1) % secs.length], 1))
    // leaves: nearest secondary OR nearest leaf, plus one nearest neighbour
    lvs.forEach((l) => {
      const [ns] = nearest(l, secs, 1)
      const nl = nearest(l, lvs, 2)
      if (r() < 0.55) add(l, ns, 1)
      else add(l, nl[0], 1)
      if (nl[1] !== undefined && r() < 0.7) add(l, nl[1], 1)
    })
  }
  // bridges between clusters: nearest secondary pairs
  for (let a = 0; a < CLUSTER_COUNT; a++) {
    for (let b = a + 1; b < CLUSTER_COUNT; b++) {
      const sa: number[] = []
      const sb: number[] = []
      for (let n = 0; n < count; n++) {
        if (tier[n] !== 1) continue
        if (cluster[n] === a) sa.push(n)
        if (cluster[n] === b) sb.push(n)
      }
      const pairs: { i: number; j: number; d: number }[] = []
      sa.forEach((i1) => sb.forEach((j1) => pairs.push({ i: i1, j: j1, d: dist2(i1, j1) })))
      pairs.sort((p, q) => p.d - q.d)
      pairs.slice(0, 2).forEach((p) => add(p.i, p.j, 2))
    }
  }
  // optional links: extra nearest-neighbour candidates that fade in/out over time
  const optionalTarget = Math.round(edges.length / 2 * optionalRatio)
  let guard = 0
  while (kinds.filter((k) => k === 3).length < optionalTarget && guard++ < 4000) {
    const n = Math.floor(r() * count)
    if (tier[n] !== 2) continue
    const pool: number[] = []
    for (let m = 0; m < count; m++) if (cluster[m] === cluster[n] && tier[m] === 2) pool.push(m)
    const cands = nearest(n, pool, 5)
    const m = cands[2 + Math.floor(r() * 3)]
    if (m !== undefined) add(n, m, 3)
  }

  // ── activation order: BFS from all hubs simultaneously ──
  const adj: number[][] = Array.from({ length: count }, () => [])
  for (let e = 0; e < kinds.length; e++) {
    if (kinds[e] === 3) continue
    const a = edges[e * 2]
    const b = edges[e * 2 + 1]
    adj[a].push(b)
    adj[b].push(a)
  }
  const order: number[] = []
  const visited = new Uint8Array(count)
  const queue: number[] = [...hubs]
  hubs.forEach((h) => (visited[h] = 1))
  while (queue.length) {
    const n = queue.shift() as number
    order.push(n)
    // secondaries before leaves so mastery grows outward
    const next = adj[n].filter((m) => !visited[m]).sort((p, q) => tier[p] - tier[q])
    next.forEach((m) => {
      visited[m] = 1
      queue.push(m)
    })
  }
  for (let n = 0; n < count; n++) if (!visited[n]) order.push(n)
  const activationOrder = Uint16Array.from(order)
  const activationRank = new Float32Array(count)
  order.forEach((n, k) => (activationRank[n] = k / Math.max(1, count - 1)))
  const clusterRank = new Float32Array(count)
  {
    const seenPer = new Array(CLUSTER_COUNT).fill(0)
    const totalPer = new Array(CLUSTER_COUNT).fill(0)
    for (let n = 0; n < count; n++) totalPer[cluster[n]]++
    order.forEach((n) => {
      const c = cluster[n]
      clusterRank[n] = seenPer[c] / Math.max(1, totalPer[c] - 1)
      seenPer[c]++
    })
  }
  const adjacency: number[][] = Array.from({ length: count }, () => [])
  for (let e = 0; e < kinds.length; e++) {
    adjacency[edges[e * 2]].push(e)
    adjacency[edges[e * 2 + 1]].push(e)
  }

  // ── path length to own core (Dijkstra on the structural graph) + BFS parent ──
  const pathLen = new Float32Array(count).fill(Infinity)
  const parent = new Int16Array(count).fill(-1)
  hubs.forEach((h) => (pathLen[h] = 0))
  {
    const done = new Uint8Array(count)
    for (let iter = 0; iter < count; iter++) {
      let best = -1
      for (let n = 0; n < count; n++) if (!done[n] && (best < 0 || pathLen[n] < pathLen[best])) best = n
      if (best < 0 || pathLen[best] === Infinity) break
      done[best] = 1
      for (const m of adj[best]) {
        const d = pathLen[best] + Math.sqrt(dist2(best, m))
        if (d < pathLen[m]) {
          pathLen[m] = d
          parent[m] = best
        }
      }
    }
    for (let n = 0; n < count; n++) if (pathLen[n] === Infinity) pathLen[n] = 4
  }
  const clusterOrder: number[][] = Array.from({ length: CLUSTER_COUNT }, () => [])
  order.forEach((n) => clusterOrder[cluster[n]].push(n))

  return {
    count,
    home,
    tier,
    cluster,
    radius,
    phase,
    edges: Uint16Array.from(edges),
    edgeKind: Uint8Array.from(kinds),
    edgeCount: kinds.length,
    hubs,
    centers: CENTERS,
    activationOrder,
    activationRank,
    clusterRank,
    adjacency,
    pathLen,
    parent,
    clusterOrder,
  }
}

/* ────────────────────────────────────────────────────────────────────
   Behaviour presets — how the same network lives on each page.
   ──────────────────────────────────────────────────────────────────── */
export type NetworkMode = 'alive' | 'responsive' | 'quiet' | 'activated' | 'accumulated' | 'atmospheric'

export interface Behaviour {
  /** drift amplitude multiplier */
  liveliness: number
  /** signal pulses per second (approx) */
  pulseRate: number
  /** particle field opacity 0..1 */
  dust: number
  /** overall scene opacity multiplier */
  presence: number
  /** cursor repulsion + parallax strength */
  cursor: number
  /** seconds between optional-link relinks (0 = never) */
  relinkEvery: number
  /** slow camera arc: [amplitude in radians, angular speed] */
  orbit: [number, number]
  /** frame budget: 60 = free-running, 30 = half-rate demand loop */
  fps: 60 | 30
}

export const BEHAVIOUR: Record<NetworkMode, Behaviour> = {
  alive: { liveliness: 1, pulseRate: 0.9, dust: 1, presence: 1, cursor: 1, relinkEvery: 5, orbit: [0.09, 0.05], fps: 60 },
  responsive: { liveliness: 0.6, pulseRate: 0.35, dust: 0.35, presence: 0.95, cursor: 0.5, relinkEvery: 8, orbit: [0.04, 0.04], fps: 60 },
  quiet: { liveliness: 0.2, pulseRate: 0, dust: 0, presence: 0.4, cursor: 0, relinkEvery: 0, orbit: [0.015, 0.03], fps: 30 },
  activated: { liveliness: 0.65, pulseRate: 0.5, dust: 0.4, presence: 1, cursor: 0.35, relinkEvery: 0, orbit: [0.05, 0.045], fps: 60 },
  accumulated: { liveliness: 0.4, pulseRate: 0.4, dust: 0.25, presence: 0.9, cursor: 0.35, relinkEvery: 10, orbit: [0.03, 0.035], fps: 60 },
  atmospheric: { liveliness: 0.3, pulseRate: 0.12, dust: 0.5, presence: 0.7, cursor: 0.2, relinkEvery: 0, orbit: [0.07, 0.025], fps: 30 },
}

/** Critically-damped smoothing helper: returns the new value. */
export function damp(current: number, target: number, lambda: number, dt: number) {
  return current + (target - current) * (1 - Math.exp(-lambda * dt))
}
