import { useEffect } from 'react'
import type { CategoryInfo } from '@/types/quiz'
import type { ReviewTopic } from '@/lib/review'

/**
 * THE KNOWLEDGE ARCHIPELAGO — shared state between pages, the 3D world and
 * the field-guide panel. One island per category the API returns; nothing
 * here is invented. Pages describe how the world should behave; the single
 * stage in Layout reads the state imperatively every frame.
 */

export type WorldMode =
  | 'hero' // Home: full presence, interactive, scroll-guided reveal
  | 'focus' // Setup / Result: one island framed, others recede
  | 'quiet' // History / About / Quiz: far, calm, non-interactive
  | 'off' // nothing drawn

export interface WorldState {
  categories: CategoryInfo[]
  /** categories whose latest real attempt had wrong answers (terracotta markers) */
  review: Record<string, ReviewTopic>
  mode: WorldMode
  /** category id to frame in 'focus' mode */
  focus: string | null
  /** island under the pointer / keyboard focus */
  hover: string | null
  /** island whose field guide is open */
  selected: string | null
  /** 0..1 page scroll inside the hero */
  scroll: number
  px: number
  py: number
  pointerIn: boolean
  /** set by the scene: where the hovered island sits on screen (CSS px) */
  hoverXY: { x: number; y: number } | null
  /** bumped by the stage whenever something that needs a redraw changed (on-demand rendering) */
  tick: number
}

const state: WorldState = {
  categories: [],
  review: {},
  mode: 'quiet',
  focus: null,
  hover: null,
  selected: null,
  scroll: 0,
  px: 0,
  py: 0,
  pointerIn: false,
  hoverXY: null,
  tick: 0,
}

const listeners = new Set<(s: WorldState) => void>()

export function getWorld() {
  return state
}
export function setWorld(patch: Partial<WorldState>) {
  Object.assign(state, patch)
  state.tick++
  listeners.forEach((l) => l(state))
}
export function subscribeWorld(l: (s: WorldState) => void) {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}

/** Pages: describe the world for this route. Hover/selection are cleared on route change. */
export function useWorld(params: { mode: WorldMode; focus?: string | null }, deps: unknown[] = []) {
  useEffect(() => {
    setWorld({ mode: params.mode, focus: params.focus ?? null, hover: null, selected: null, hoverXY: null })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

/** True when the visitor opted out of 3D (`?3d=off` / localStorage `nx-3d=off`). */
export function threeDisabled(): boolean {
  try {
    const q = new URLSearchParams(window.location.search).get('3d')
    if (q === 'off') localStorage.setItem('nx-3d', 'off')
    if (q === 'on') localStorage.removeItem('nx-3d')
    return localStorage.getItem('nx-3d') === 'off'
  } catch {
    return false
  }
}

/** Subscribe to a derived slice; re-renders only when the slice changes (shallow). */
export function useWorldSlice<T>(select: (s: WorldState) => T, set: (v: T) => void) {
  useEffect(() => {
    let last = select(state)
    set(last)
    return subscribeWorld((s) => {
      const next = select(s)
      if (next !== last) {
        last = next
        set(next)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
