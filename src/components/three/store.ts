import { useEffect } from 'react'
import { DEFAULT_PARAMS, type LatticeParams } from './lattice'

/**
 * Tiny pub/sub store for the persistent scene.
 * Pages call `useLattice({...})`; the single Canvas in Layout listens.
 * No React re-renders inside the render loop — the scene reads the
 * current value imperatively each frame.
 */

export type Layout = 'hero' | 'side' | 'top' | 'corner' | 'hidden'

export interface SceneState extends LatticeParams {
  layout: Layout
  /** 0..1 page scroll (first ~1.4 viewports) — set by the Layout shell */
  scroll: number
  /** -1..1 normalised cursor, set by the Layout shell */
  px: number
  py: number
}

const state: SceneState = { ...DEFAULT_PARAMS, layout: 'hero', scroll: 0, px: 0, py: 0 }
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

/** Declarative hook for pages: describe how the lattice should behave here. */
export function useLattice(params: Partial<Omit<SceneState, 'scroll' | 'px' | 'py'>>, deps: unknown[] = []) {
  useEffect(() => {
    setScene(params)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
