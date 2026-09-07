# NEXUSQuiz — 3D identity: the Living Knowledge Network

One WebGL scene, mounted once in `Layout`, fixed behind every page. Pages
never render 3D themselves; they *describe* how the network should behave
(`useNetwork({...})`) and the scene reads that description every frame.

## The concept

Knowledge is a network with three regions at different depths —
**Maths**, **Python** and the **Mixed** bridge between them. Each region has
a dark core, a ring of topic nodes and a cloud of question nodes; hairline
links join them. Long bridges connect the regions.

Only two things ever change colour:

| Signal | Meaning |
|---|---|
| **Green** | knowledge that is active or meaningful — activated nodes, a travelling signal, the hovered neighbourhood, the answered path on Result |
| Bone / graphite | everything neutral — nodes, links, cores |

Nothing else is coloured. There is no glow, bloom, gradient or particle
burst; the network stays understated so typography sits in front of it.

### Signals travel along the graph

A "pulse" is not an expanding sphere. Each edge stores its shortest-path
distance to its region's core (`network.ts → pathLen`, Dijkstra on the
structural graph), and the shader lights the band where
`pathLen ≈ age × speed`. The signal therefore follows the actual links
outward, branches where the graph branches and crosses the bridges into
other regions — the network visibly *thinks* instead of rippling.

### Camera

- One slow orbital arc around the look target (amplitude ≤ 0.09 rad,
  period ≈ 2 min on Home). Never a spin, never a snap.
- Cursor parallax moves the camera, not the objects, so depth stays true.
- Home scroll dollies the camera into the network along its depth axis
  (first ~1.4 viewports), while overall presence fades so section copy
  stays legible.
- Result starts near the core and pulls back to reveal.

## Per-page behaviour (`network.ts → BEHAVIOUR`)

| Page | Mode | Presence | Motion | Cursor | Signals | Frame budget | What it means |
|---|---|---|---|---|---|---|---|
| Home | `alive` | 1.0 | orbit 0.09 rad, drift 1.0 | parallax + node repulsion + hover neighbourhood | ~0.9/s | 60 fps | the network at full expression, framing the hero |
| Setup | `responsive` | 0.95 | 0.04 rad, 0.6 | parallax 0.5 | on every selection, into the chosen region | 60 fps | region focus follows category; density follows difficulty; activation follows question count |
| Quiz | `quiet` | 0.34 | 0.015 rad, 0.2 | **none** | none | **30 fps demand loop** | recedes into the paper; activation grows with answered count |
| Result | `activated` | 1.0 | 0.05 rad, 0.65 | parallax 0.35 | two signals through the quiz's region | 60 fps | **knowledge path**: the region lights node by node in question order — correct = green node, wrong = gap |
| History | `accumulated` | 0.9 | 0.03 rad, 0.4 | parallax 0.35 | ~0.4/s | 60 fps | per-region established weight from real history (attempts × accuracy); filter focuses a region |
| About | `atmospheric` | 0.7 | 0.07 rad, very slow | parallax 0.2 | ~0.12/s | 30 fps demand loop | museum: slow arc, few signals, no relinking |

Hover (Home only): the nearest topic/question node lifts, its neighbours
lift less, and its links turn green. The label that follows it is plain
DOM (`NexusStage → HoverLabel`), not WebGL.

## Performance budget

- **One** instanced sphere mesh for every node (1 geometry, 1 material);
  **one** `LineSegments` for every link (1 shader); 3 cores share one
  material; dust is a single `Points`. No per-node objects.
- Dust: 150 (high) / 90 (medium) / 0 (low) points — halved again when
  the performance monitor sees a second decline.
- Per-page frame budget from the preset: Home/Setup/Result/History run
  free; **Quiz and About run a 30 fps demand loop** (`frameloop="demand"`
  + a 33 ms ticker), which is the lowest budget on the product.
- `PerformanceMonitor` steps DPR down 0.25 at a time (floor 0.75, cap by
  tier: 1.75 / 1.4 / 1.0) and never above the tier cap.
- Hidden tab → `frameloop="never"`; nothing renders.
- Quality tier: phone or `saveData` → low (fewer leaves, no dust, no
  environment map, flat cores); ≤ 4 cores or ≤ 4 GB → medium.
- No React re-renders inside the loop; the store is read imperatively.

## Accessibility & fallback

- `prefers-reduced-motion: reduce` → the same network is drawn **once as
  SVG** (`StaticNetwork`), still following the page's presence and
  activation, but never moving. The media query is watched live.
- No WebGL → same SVG fallback.
- Opt-out without a setting UI: open any page with `?3d=off` (persists in
  `localStorage`, `?3d=on` clears it). Nothing else on the product changes.
- No flashing: signals are ≤ 1 s bands travelling at 1.7 units/s; the
  camera arc peaks at 0.09 rad over ~1 min; there is no strobing or
  sudden cut apart from route changes.
- Nothing is communicated only in 3D or colour. The Result path mirrors
  the review list and the score card; History weights mirror the
  "Established knowledge" bars; Setup focus mirrors the selected radio.

## Files

- `src/components/three/network.ts` — pure-TS graph (deterministic seed),
  path lengths, parents, per-region orders, behaviour presets.
- `src/components/three/store.ts` — tiny pub/sub store; `useNetwork`,
  `pulseNetwork`, `threeDisabled`.
- `src/components/three/NexusScene.tsx` — the WebGL scene (shaders,
  camera, instancing, hover, knowledge path, frame governor).
- `src/components/three/NexusStage.tsx` — mount, WebGL/reduced-motion
  detection, SVG fallback, hover label.
- `src/pages/Result.tsx` — passes the real per-question `is_correct` mask
  and region so the network can light the path.
