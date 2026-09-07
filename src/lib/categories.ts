// ─────────────────────────────────────────────────────────────────────────────
//  Category registry — the ONLY place the frontend knows anything about
//  category ids. Ids come from the question bank (quiz.app/questions.json) via
//  /api/categories; this file just maps a known id to a human label, an icon
//  and a "family" (which of the two knowledge clusters of the network it lives
//  in). Unknown ids still work — they get a humanised label and a default icon.
// ─────────────────────────────────────────────────────────────────────────────
import type { ComponentType, SVGProps } from 'react'
import * as I from '@/components/ui/Icons'

export type Family = 0 | 1 // 0 · Sciences & numbers   1 · Humanities & general
export const FAMILY_LABELS: [string, string, string] = ['Sciences', 'Humanities', 'Mixed']

interface Meta {
  label: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  family: Family
}

/** Display order is the bank's order; this only defines label / icon / family. */
const REGISTRY: Record<string, Meta> = {
  maths: { label: 'Mathematics', icon: I.Sigma, family: 0 },
  math: { label: 'Mathematics', icon: I.Sigma, family: 0 },
  mathematics: { label: 'Mathematics', icon: I.Sigma, family: 0 },
  science: { label: 'Science', icon: I.Flask, family: 0 },
  technology: { label: 'Technology', icon: I.Chip, family: 0 },
  python: { label: 'Python Programming', icon: I.Code, family: 0 },
  python_programming: { label: 'Python Programming', icon: I.Code, family: 0 },
  computer_science: { label: 'Computer Science', icon: I.Binary, family: 0 },
  physics: { label: 'Physics', icon: I.Atom, family: 0 },
  chemistry: { label: 'Chemistry', icon: I.Molecule, family: 0 },
  biology: { label: 'Biology', icon: I.Leaf, family: 0 },
  astronomy_space: { label: 'Astronomy & Space', icon: I.Orbit, family: 0 },
  astronomy: { label: 'Astronomy & Space', icon: I.Orbit, family: 0 },
  geography: { label: 'Geography', icon: I.Globe, family: 1 },
  history: { label: 'History', icon: I.Column, family: 1 },
  economics_business: { label: 'Economics & Business', icon: I.Trend, family: 1 },
  economics: { label: 'Economics & Business', icon: I.Trend, family: 1 },
  logic_reasoning: { label: 'Logic & Reasoning', icon: I.Puzzle, family: 1 },
  logic: { label: 'Logic & Reasoning', icon: I.Puzzle, family: 1 },
  english_language: { label: 'English & Language', icon: I.Quote, family: 1 },
  english: { label: 'English & Language', icon: I.Quote, family: 1 },
  general_knowledge: { label: 'General Knowledge', icon: I.Sparkle, family: 1 },
  general: { label: 'General Knowledge', icon: I.Sparkle, family: 1 },
}

/** "economics_business" → "Economics Business" for ids the registry doesn't know. */
function humanise(id: string): string {
  return id
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (m) => m.toUpperCase())
}

export function categoryLabel(id: string): string {
  if (id === 'all' || id === 'mixed') return 'All Topics'
  return REGISTRY[id]?.label ?? humanise(id)
}

export function categoryIcon(id: string): ComponentType<SVGProps<SVGSVGElement>> {
  return REGISTRY[id]?.icon ?? I.Layers
}

/**
 * Which network cluster a category lights: 0 · Sciences, 1 · Humanities, 2 · Mixed.
 * Unknown ids alternate deterministically so every region still has a home.
 */
export function categoryCluster(id: string): 0 | 1 | 2 {
  if (id === 'all' || id === 'mixed') return 2
  const known = REGISTRY[id]
  if (known) return known.family
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return (h % 2) as 0 | 1
}

/** Old engine spelling: history entries were stored as both 'math' and 'maths'. */
export function normaliseCategoryId(id: string): string {
  return id === 'math' ? 'maths' : id
}
