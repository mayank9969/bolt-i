/**
 * Island layout — pure TypeScript, no three.js.
 *
 * One island per category the API returns (any number). Positions, sizes and
 * silhouettes are derived deterministically from the category id and its
 * question count, so every visitor sees the same archipelago and it never
 * depends on a hard-coded list. Bridges link neighbouring islands of the same
 * family (the registry's Sciences / Humanities split) plus one bridge between
 * the families — relationships between fields, not between questions.
 */
import type { CategoryInfo } from '@/types/quiz'
import { categoryCluster, categoryLabel, normaliseCategoryId } from '@/lib/categories'

export type Prop =
  | 'obelisk' // mathematics — a tall thin monolith
  | 'orrery' // astronomy / physics — ring around a sphere
  | 'flask' // chemistry / science — cone on a slab
  | 'tree' // biology — trunk + two canopy tiers
  | 'columns' // history — three short columns
  | 'globe' // geography — sphere on a tilted ring
  | 'steps' // economics — three rising blocks
  | 'arch' // logic — a gateway
  | 'stack' // language — stacked slabs (books)
  | 'blocks' // programming / computer science — cube stack
  | 'beacon' // general knowledge / default — a cairn with a lantern
  | 'horizon' // physics — stylised event horizon (not a simulation)

export interface Island {
  id: string
  label: string
  family: 0 | 1
  questions: number
  difficulties: Record<string, number>
  /** world position (y is the resting height; the scene adds bob/hover) */
  x: number
  y: number
  z: number
  /** overall footprint radius */
  r: number
  /** silhouette seed 0..1 and faceting (sides of the rock) */
  seed: number
  sides: number
  /** plateau layers: [radius factor, height] from bottom to top */
  layers: [number, number][]
  /** secondary peak? */
  peak: boolean
  prop: Prop
}

export interface Bridge {
  a: number
  b: number
  /** 0 within a family · 1 between families */
  kind: 0 | 1
}

const PROPS: Record<string, Prop> = {
  maths: 'obelisk',
  math: 'obelisk',
  mathematics: 'obelisk',
  physics: 'horizon',
  astronomy_space: 'orrery',
  astronomy: 'orrery',
  chemistry: 'flask',
  science: 'flask',
  biology: 'tree',
  history: 'columns',
  geography: 'globe',
  economics_business: 'steps',
  economics: 'steps',
  logic_reasoning: 'arch',
  logic: 'arch',
  english_language: 'stack',
  english: 'stack',
  python: 'blocks',
  python_programming: 'blocks',
  computer_science: 'blocks',
  technology: 'blocks',
  general_knowledge: 'beacon',
  general: 'beacon',
}

export function hash01(s: string, salt = 0): number {
  let h = 2166136261 ^ salt
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return ((h >>> 0) % 100000) / 100000
}

export function buildIslands(categories: CategoryInfo[]): { islands: Island[]; bridges: Bridge[] } {
  const total = categories.reduce((s, c) => s + Object.values(c.difficulties).reduce((a, b) => a + b, 0), 0) || 1
  const n = categories.length
  // sort so the two families sit on opposite halves of the spiral — the bridge between them reads as a crossing
  const ordered = [...categories].sort((a, b) => categoryCluster(a.id) - categoryCluster(b.id) || a.id.localeCompare(b.id))
  const islands: Island[] = ordered.map((c, i) => {
    const id = normaliseCategoryId(c.id)
    const questions = Object.values(c.difficulties).reduce((a, b) => a + b, 0)
    const seed = hash01(id)
    // spacious ellipse around the visitor — not a flat spiral or a card row
    const ang = n === 1 ? 0 : (i / n) * Math.PI * 2 + seed * 0.12
    const radX = n === 1 ? 0 : 4.35
    const radZ = n === 1 ? 0 : 3.45
    const share = questions / total
    const r = 0.48 + Math.min(0.38, Math.sqrt(share * Math.max(1, n)) * 0.42)
    const exhibitIsle = id === 'maths' || id === 'python'
    const layerCount = 2 + (seed > 0.45 ? 1 : 0)
    const layers: [number, number][] = []
    for (let k = 0; k < layerCount; k++) layers.push([1 - k * (0.26 + hash01(id, k + 7) * 0.12), 0.1 + hash01(id, k + 20) * 0.06])
    return {
      id,
      label: categoryLabel(c.id),
      family: categoryCluster(id) === 1 ? 1 : 0,
      questions,
      difficulties: c.difficulties,
      x: Math.cos(ang) * radX,
      y: (hash01(id, 3) - 0.5) * 1.35,
      z: Math.sin(ang) * radZ,
      r: exhibitIsle ? r * 1.18 : r,
      seed,
      sides: exhibitIsle && id === 'maths' ? 8 : exhibitIsle && id === 'python' ? 5 : 6 + Math.floor(hash01(id, 5) * 4),
      layers: exhibitIsle && id === 'maths'
        ? ([[1, 0.11], [0.78, 0.1], [0.52, 0.09], [0.28, 0.08]] as [number, number][])
        : exhibitIsle && id === 'python'
          ? ([[1, 0.1], [0.82, 0.09], [0.58, 0.09], [0.36, 0.1]] as [number, number][])
          : layers,
      peak: exhibitIsle ? false : hash01(id, 9) > 0.55,
      prop: PROPS[id] ?? 'beacon',
    }
  })

  // bridges: within each family link each island to its nearest unlinked family neighbour (a chain),
  // then one bridge between the closest pair across families.
  const bridges: Bridge[] = []
  const dist = (a: Island, b: Island) => Math.hypot(a.x - b.x, a.z - b.z)
  for (const fam of [0, 1] as const) {
    const idx = islands.map((isl, i) => (isl.family === fam ? i : -1)).filter((i) => i >= 0)
    const linked = new Set<number>()
    for (const i of idx) {
      let best = -1
      let bd = Infinity
      for (const j of idx) {
        if (j === i || linked.has(j) && linked.has(i)) continue
        if (bridges.some((b) => (b.a === i && b.b === j) || (b.a === j && b.b === i))) continue
        const d = dist(islands[i], islands[j])
        if (d < bd) {
          bd = d
          best = j
        }
      }
      if (best >= 0 && bd < 4.2) {
        bridges.push({ a: i, b: best, kind: 0 })
        linked.add(i)
        linked.add(best)
      }
    }
  }
  let cross: Bridge | null = null
  let cd = Infinity
  islands.forEach((a, i) =>
    islands.forEach((b, j) => {
      if (i < j && a.family !== b.family) {
        const d = dist(a, b)
        if (d < cd) {
          cd = d
          cross = { a: i, b: j, kind: 1 }
        }
      }
    }),
  )
  if (cross) bridges.push(cross)
  return { islands, bridges }
}
