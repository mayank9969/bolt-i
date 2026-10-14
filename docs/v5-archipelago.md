# VEYRA v5 — The Knowledge Archipelago

Replaces v4 "Memory Loom" (rejected: threads/nodes per question). Frontend only; the Python
API, scoring, question selection, history and security are untouched.

## The idea
One floating island per **category the frontend receives** from `GET /api/categories`
(no hard-coded list or count). Islands are laid out on a sunflower spiral, sized by each
category's share of questions, grouped by family (`categoryCluster`). Each island has a
faceted rock, 2–3 layered plateaus and one small abstract, subject-themed prop
(obelisk, orrery, flask, tree, columns, globe, steps, arch, stack, blocks, beacon) — never a
building, never a node graph. Deep-teal **bridges** join same-family neighbours plus one
cross-family link. A **terracotta marker** stands on an island only when real history says
the latest attempt there had wrong answers (`reviewTopics`). Nothing is invented.

## Interaction
- Hover / keyboard focus → island lifts 0.14 u, teal glow, name label.
- Click / tap → **Field guide** panel (`FieldGuide.tsx`, plain DOM, role=dialog, Esc closes,
  focus managed). Shows: name, per-tier question counts (API), real review line, a short
  summary, one verified turning point + why it matters + source link (`src/lib/fieldGuide.ts`,
  Wikipedia). Categories without an entry get a category-only panel. "Start a … quiz" →
  `/setup` with `{ state: { category } }` (existing flow).
- The 3D map is never required: the **island index** on Home (buttons) and the static SVG
  fallback reach every field guide; all routes unchanged.

## States per page (`useWorld`)
Home `hero` (full, interactive, scroll orbit + dolly, pointer parallax) · Setup / Result /
History `focus` on the chosen island (or `quiet` for all/mixed) · Quiz `off` · About `quiet`.

## Performance / fallbacks
Lazy-loaded scene; `frameloop="demand"` (renders only while something moves); low quality on
≤768 px / save-data (fewer facets, no shadows/clouds, dpr ≤1.5); static SVG (same layout
function) when WebGL is missing, `prefers-reduced-motion`, or `?3d=off`.

## Colour
Paper is warm white (`#F8F6F1` canvas, `#FDFCF9` card, `#F0ECE5` rail), umber-tinted shadows,
luminous sky gradient (warm light top, teal haze low, faint terracotta). Ink is deep
blue-charcoal with soft-ivory text, slate islands (not inverted ivory). All island/bridge/
light colours are `--nx-3d-*` tokens in `tokens.css`, both themes. Text contrast ≥ 4.5:1
on every surface in both themes (Paper: text 14.8, muted 7.3, teal 5.8, terracotta 4.9).

## Note on sources
The field-guide facts are well-established (Euclid's Elements, Royal Society motto, WWW 1989,
Python 1991, Turing 1936, Principia 1687, Mendeleev 1869, Darwin 1859, Hubble 1929,
Eratosthenes, Herodotus, Wealth of Nations 1776, Boole 1854, Johnson 1755, Encyclopédie).
The Wikipedia links were written from memory; they could not be re-opened from the build
sandbox and should be spot-checked once.
