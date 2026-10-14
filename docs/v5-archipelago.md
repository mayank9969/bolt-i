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

## v5.1 — Exhibits (first two: Mathematics, Python)
Islands whose API id has an entry in `src/lib/exhibits.ts` (`maths`, `python` — read from
`/api/categories`, not assumed by position) open an **exhibit** instead of the field guide:
- the camera steps into the island (close, low; a different side for each beat) and the
  island's own prop steps aside for a **diorama** (`Diorama` in `ArchipelagoScene.tsx`) that
  shows one beat at a time — before / breakthrough / after;
- the **exhibit card** (`src/components/Exhibit.tsx`) carries the whole story in text: three
  beats (stepper, ← → and 1 2 3 keys), why it matters, source links, the question counts for
  the category from the API, "Start the … quiz" (→ `/setup` with `{ state: { category } }`,
  the existing flow) and "Back to the islands" (Esc);
- when the live scene is not running (no WebGL, reduced motion, `?3d=off`) the card shows a
  flat SVG **plate** of the same beat, so the exhibit reads identically without 3D.
Stories are taken only from MacTutor ("A history of Zero", Brahmagupta) and the official
Python FAQ, read on 2026-10-14; the cards repeat the sources' own caution (no single
inventor of zero; "probably millions" of Python users, no figure given).
Adding an exhibit later = one entry in `exhibits.ts` (+ optionally a diorama kind).

## Paper colour, revisited
Sampled from Rose Island's public case-study frames (rhumb.co): page field `#DEDEDE`, lit
structure `#B1B5B4`, shaded `#A8AEAC` / `#A09694`, horizon haze `#E2E7E0`. Read as "bright
field, warm-grey shadow": canvas `#FAF9F6`, card `#FEFDFB`, rail `#F1EFEA`, shadow ink
`rgb(84 76 70)`, islands `#E3DFD8 → #F7F5F0` on `#B9B1A7` stone, sky `#EEF1EE`.
