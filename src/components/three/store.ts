import { useEffect } from 'react'
import type { NetworkMode } from './network'

/**
 * Tiny pub/sub store for the one persistent Living Knowledge Network.
 * Pages call `useNetwork({...})`; the single Canvas in Layout listens and
 * reads the current value imperatively every frame — no React re-renders
 * inside the render loop.
 */

export type CameraPreset = 'hero' | 'side' | 'far' | 'reveal' | 'archive' | 'museum'

export interface HoverInfo {
  node: number
  cluster: number
  tier: number
  /** screen-space position in CSS px */
  x: number
  y: number
}

export interface SceneState {
  mode: NetworkMode
  camera: CameraPreset
  /** -1 = whole network, 0..2 = pull camera and light toward that region */
  focusCluster: number
  /** 0..1 — how many optional links / leaves are shown (difficulty) */
  density: number
  /** 0..1 — fraction of the network activated (score / progress) */
  activation: number
  /** per-cluster established weight 0..1 (History) — null = derive from activation */
  clusterWeights: [number, number, number] | null
  /** bump this to fire a burst of signal pulses (question change, correct answer, reveal) */
  pulse: number
  /** hover interaction enabled (Home only) */
  hoverable: boolean
  /** labels for the three regions, from real catalogue data */
  clusterLabels: [string, string, string]
  /** 0..1 page scroll (first ~1.4 viewports) — set by the stage */
  scroll: number
  /** -1..1 normalised cursor, set by the stage */
  px: number
  py: number
  /** true while a fine pointer is over the window */
  pointerIn: boolean
  /** set by the scene: what the cursor is over */
  hover: HoverInfo | null
}

const state: SceneState = {
  mode: 'alive',
  camera: 'hero',
  focusCluster: -1,
  density: 0.6,
  activation: 0.18,
  clusterWeights: null,
  pulse: 0,
  hoverable: false,
  clusterLabels: ['Maths', 'Python', 'Mixed'],
  scroll: 0,
  px: 0,
  py: 0,
  pointerIn: false,
  hover: null,
}

const listeners = new Set<(s: SceneState) => void>()

export function getScene() {
  return state
}
export function setScene(patch: Partial<SceneState>) {
  Object.assign(state, patch)
  listeners.forEach((l) => l(state))
}
export function subscribeScene(l: (s: SceneState) => void) {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}

let pulseCounter = 0
/** Fire a burst of signal pulses through the network. */
export function pulseNetwork(strength = 1) {
  pulseCounter += 1
  setScene({ pulse: pulseCounter * 1000 + Math.min(999, Math.round(strength * 100)) })
}

type PageParams = Partial<Omit<SceneState, 'scroll' | 'px' | 'py' | 'pointerIn' | 'hover' | 'pulse'>>

/** Declarative hook for pages: describe how the network should behave here. */
export function useNetwork(params: PageParams, deps: unknown[] = []) {
  useEffect(() => {
    setScene({ hoverable: false, clusterWeights: null, focusCluster: -1, ...params })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

/** Subscribe to hover changes only (Home label). */
export function useHover(cb: (h: HoverInfo | null) => void) {
  useEffect(() => {
    let last: HoverInfo | null = state.hover
    cb(last)
    return subscribeScene((s) => {
      if (s.hover !== last) {
        last = s.hover
        cb(last)
      }
    })
  }, [cb])
}
