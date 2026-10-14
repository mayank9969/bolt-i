# VEYRA v4 — the Memory Loom (frontend-only redesign)

Status: implemented on branch `arena/01a0677f-bolt-i` (commits from `8a024e4`). No file under `api/`, `backend/` or `quiz.app/` changed; the four API calls and their payloads are untouched.

## Idea
The persistent 3D scene (one `<Canvas>` behind every page, `src/components/three/`) is re-art-directed as a **loom**: ideas are threads, connections are woven strands, regions hang inside thin layered frames. It is the same architecture (store → scene, per-page behaviour presets) — not a rebuild.

| Element | Implementation | Data |
|---|---|---|
| Woven strands | every edge = quadratic bow in `SEG` straight pieces (6 desktop / 3 mobile), bow direction alternates per edge so strands cross over/under | graph from `buildNetwork` (unchanged) |
| Layered forms | two thin elliptical frames per region (`torusGeometry`, tube 0.007) + 14 warp threads (8 mobile) | — |
| Deep-teal strands | `--nx-3d-strut` is now teal; shader alpha unchanged | — |
| Terracotta nodes | `store.reviewCategories` → one secondary node per category, colour `--nx-warm`, +55 % radius; mirrored in the SVG fallback | **real** `GET /api/history`: category whose latest attempt had `wrong_answers > 0` (`src/lib/review.ts`). Result also marks its own category when the attempt had misses. Empty history ⇒ no terracotta. |

"Due for review" does not exist in the current API — this is the only honest signal available, and the UI calls it *worth revisiting*, never "due".

## Presence by page (unchanged presets)
Home `alive` (hero, hover, scroll-dolly) · Setup `responsive` (focus on the chosen region) · Quiz `quiet` (presence 0.34 + paper wash — question first) · Result `activated` (reveal camera, answer path) · History `accumulated` · About `atmospheric`.

## Colour tokens (`src/styles/tokens.css`, names unchanged; additions: `warm`, `warm-text`, `warm-soft`, `3d-frame`)
| Token | Paper | Ink |
|---|---|---|
| canvas | #F7F7F4 | #141A24 |
| surface / card / card-strong | #EEEEE9 / #FCFCFA / #FEFEFD | #10151E / #1C2432 / #232C3C |
| text / muted / tertiary | #1B2230 (14.8:1) / #4A5262 (7.3) / #636A77 (5.1) | #ECE8DF (14.3) / #B5B4AC (8.4) / #8F939C (5.7) |
| accent teal (+hover/active) | #1E6B6A (5.8) / #185A59 / #124847 | #6FBFBA (8.2) / #86CDC8 / #5AAFA9 |
| warm terracotta (nodes / chips / text) | #B04E33 (4.9) / text #9E4530 (5.8) | #E08A6C (6.7) |
| 3D strand / frame | #3E6E73 / #C9C8C1 | #5F9EA3 / #3A4456 |

Contrast figures are against the canvas; all text/control pairs ≥ 4.5:1 in both themes. Answer and selection states keep their check/cross icons and "Selected" text — colour never carries meaning alone.

## Performance / motion (pre-existing, kept)
Lazy-loaded three chunk; `frameloop="never"` when the canvas is off-screen, `demand` at 30 fps for quiet pages; low quality tier on ≤768 px / save-data; `prefers-reduced-motion` → static SVG network; WebGL missing or `?3d=off` → static SVG; `MotionConfig reducedMotion="user"` for UI motion.

## Not verifiable from the sandbox
Reference sites (rhumb.co, studio10b.com, threejs.org, w3.org) and the Rose Island screenshot were not reachable; the palette follows the written description only.
