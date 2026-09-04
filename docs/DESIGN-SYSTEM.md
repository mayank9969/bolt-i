# NEXUSQuiz — Design System (UI · colour · 3D)

This document records the research, the principles derived from it, the candidate
directions, the chosen direction and the token / motion / 3D contracts the frontend
uses. The backend (`quiz.app/*`, `api/server.py`) was not touched.

Conventions used below: **observed** = seen directly on the site or in an award
listing / first-party write-up; **inferred** = a reasonable reading that was not
directly confirmed; **unverified** = could not be confirmed and is not relied upon.

---

## 1. Light vs. dark — evidence, not taste

NEXUSQuiz is a reading-heavy product: a question, four answers, a review list.
The decision was made on that use case.

| Finding | Source | Strength |
|---|---|---|
| Dark text on a light background (**positive polarity**) produced better visual acuity and better proofreading performance than light-on-dark, for both younger and older adults with normal vision. | Piepenbrock, Mayr, Mund & Buchner, *Ergonomics* 2013 (DOI 10.1080/00140139.2013.790485) and *Human Factors* 2014 (DOI 10.1177/0018720813515509), summarised by Nielsen Norman Group, "Dark Mode vs. Light Mode: Which Is Better?" | Peer-reviewed lab studies; moderate samples. |
| The positive-polarity advantage **grows as text gets smaller** — exactly the regime of answer options, metadata and review lists. | same | same |
| Participants did **not notice** the difference themselves — preference and performance diverge. | same | same |
| Proposed mechanism: a brighter field contracts the pupil, reducing optical aberrations and increasing depth of field → sharper edges. | same (mechanism, as reported by the authors) | Plausible, physiological; treated as explanation, not as a health claim. |
| In bright ambient light there is little measurable difference; in office / night lighting light backgrounds still read better in those studies. | Dobres et al., as summarised by NN/g | Secondary. |
| Some users with low vision (e.g. cataract) read better in dark mode; NN/g still recommends **offering a dark switch**. | Legge et al., via NN/g | Accessibility rationale for keeping dark as a first-class theme. |
| Long-term effects of dark mode on eyesight, "blue-light" harm, myopia: **not supported** by strong evidence either way. | NN/g review | Not used in the decision. |

**What we do not claim:** that light mode is universally better, that dark mode
harms anyone, or anything medical. Claims about astigmatism / halation are common
online but only inference-level; they are not relied upon.

**Decision.** *Paper* (warm light) is the default: it is where the evidence says
reading small text performs best, and it matches the product's editorial character.
*Ink* (dark) is a complete sibling theme — same tokens, same brand, same accent
family — for user preference, low-vision users and low-light contexts. The system
preference is respected on first visit; the choice is remembered.

Where dark performs better *inside* the light theme, it is used deliberately:
the ink CTA panels ("Server-side scoring", "The name"), the dark lacquer core of
the 3D object, and the inverted primary button. Dark = emphasis, light = reading.

---

## 2. Reference research

### Professional references

| Reference | What is verifiable | Lesson taken |
|---|---|---|
| **Linear** | Near-black canvas (`#08090a`) with progressively lighter panels (`#0f1011`, `#191a1b`, `#1f2023`); text never pure white (`#f7f8f8` → `#8a8f98`); a single indigo accent (`#5e6ad2`) reserved for CTAs / active / focus; borders are semi-transparent white (5–8 %); recessed panels use inset shadow. | **Luminance stacking** for depth, translucent hairline borders, one rare accent. |
| **Stripe** | Light canvas with cool gray (`#f6f9fc`), dark text is navy (`#0a2540`) not black, body slate `#425466`, brand indigo `#635bff` only on links/CTAs, spectral gradient confined to the hero. | Text colour is tinted, not neutral black; colour belongs to interactive elements; decorative colour is quarantined. |
| **Raycast** | Blue-tinted near-black (`#07080a`, not pure black); page is ~98 % achromatic; brand red `#ff6363` used as *punctuation* (hero, badges) not as a general accent; `rgba(255,255,255,0.06–0.08)` borders; multi-layer shadows with inset top highlights; positive letter-spacing on body text; weight 500 body on dark. | **Punctuation accent**: a strong brand colour that appears rarely. Tinted black. Inset highlight instead of glow. |
| **Notion** | Warm neutrals instead of grays: text `#37352f`, canvas `#f7f6f3`; one accent (`#2eaadc`) for interactive elements only; content colours deliberately desaturated. | Warm/tinted neutrals feel like paper; semantic colours are muted so they never shout. |
| **Vercel (Geist)** | Pure black/white, gray scale `#0a0a0a`–`#ededed`, accent `#0070f3` used only where it carries meaning ("you could remove it and it would still look like Vercel"), border-as-shadow technique, error `#ee0000`, warning `#f5a623`. | The accent is optional; colour only when it carries meaning. |

### Experimental / immersive references

| Reference | What is verifiable | Lesson taken |
|---|---|---|
| **Obys Agency** | Studio of the Year (CSS Design Awards 2020/21/23, Awwwards 2019). Work is typography-led, grid-based, minimal, with motion and per-project palettes ("minimalism, typography, grid, interaction"). | Typography and layout carry the identity; colour is art-directed per context, not sprayed everywhere. |
| **Obys Experiment Space** | Obys' educational/experimental side projects (e.g. *Colors Combinations*, *Grids*). | Unusual pairings are chosen deliberately and taught as combinations, not as random neon. |
| **Active Theory** | Deep navy-to-black field, bioluminescent particles, iridescent ring, **monospaced uppercase type** contrasting organic particle chaos with rigid geometry. | Tension = organic depth vs. strict type. Atmosphere lives in the background layer, UI stays strict. |
| **Bruno Simon** | Interactive 3D portfolio driven as a game (WebGL/Three.js). | Interaction itself is identity; 3D is the content, not decoration. For NEXUSQuiz: 3D stays in the hero/ambient layer and never competes with a question. |
| **The FWA** | Current FWA-of-the-day winners (Sept 2026) are real-time 3D worlds and immersive storytelling. | Immersion is the current bar; but usability scores are weighted (Awwwards: usability 30 %). |
| **HubTown** (Unseen Studio, Awwwards SOTD Jun 2026) | Awwwards lists its palette as **one colour: `#020A19`** (near-black navy). Immersive 3D map, zoom transitions, storytelling. | An immersive site can be effectively **monochrome**; scale, depth and motion do the work. This also validates NEXUSQuiz's existing near-black-navy canvas. |

### 3D / immersive references (2025–2026)

| Reference | Verified | What is observable | Taken / rejected |
|---|---|---|---|
| **ORYZO AI** (oryzo.ai, Lusion) | Awwwards Site of the Month Apr 2026 + Developer Award; Utsubo "Best Three.js Websites of 2026" (observed) | **One** hero object (a cork coaster) rendered with real weight and inertia; scroll moves the *camera* through true Z-depth; physics-like easing. | **Taken:** "sell one object properly", scroll drives the camera not the object. |
| **HubTown** (hubtown.co.in, Unseen Studio) | Awwwards SOTD Jun 2026 (observed) | Single monolith over a dark reflective plane; Awwwards palette listed as one colour `#020A19`; mouse-reveal uncovers detail in geometry and lighting. | **Taken:** a single set-piece; cursor reveals detail rather than spinning things. |
| **Shopify Editions** (Renaissance Edition SOTD Feb 2026; Supply / Performance Pack SOTD Dec 2025) | Awwwards listings (observed); Utsubo write-up (observed); GSAP/Lenis stack claims (inferred, community) | Scroll-sequenced reveal in staged beats (enter / hold / exit); depth-layered panels; type that disperses into particles. | **Taken:** scroll as a timeline with beats. **Rejected:** particle type (decorative for a quiz). |
| **Everest · The Ascent** (everest.suraj.work) | Awwwards Honorable Mention Jul 2026 (observed) | Cinematic flythrough of real terrain; palette near-black `#070B12` + one warm sand `#D8B787`; **auto-tunes quality to the machine**. | **Taken:** adaptive quality tiers; a single warm accent on ink. |
| **Ridgeline** (Codrops build write-up, Jul 2026) | First-party article (observed) | One persistent WebGL context; scenes are swapped with a `setScene` pattern instead of recreating the canvas per page — avoids black flashes and evicted contexts. | **Taken:** exactly this architecture — a single canvas under the router, per-page state. |
| **The Symphony of Vines** (Unseen Studio) | Awwwards SOTD Aug 2025 (observed listing only) | Narrative scroll through one continuous world. | **Taken:** one world that evolves; not several scenes. |
| **Cartier Watches & Wonders 2026** (Immersive Garden) | Utsubo list (observed) | Six 3D "rooms", one per product; scroll moves between rooms. | Principle only: spatial states per section. |
| **WOOZ Experience** | Awwwards Honorable Mention Feb 2025 (observed) | Immersive product views for a clothing brand. | Modest; nothing specific taken. |
| **Cyera AI Guardian** | **Unverified** — no Awwwards / FWA / CSSDA listing was found; only a product page and a third-party showcase entry. | — | Not used. |
| **mesh3d.gallery** | Curated Three.js showcase (observed) | Confirms the prominence of Unseen Studio / Lusion; no palette data. | Context only. |

Common thread in the verified winners: **commit to one hard idea and budget
everything around it**; scroll is the storytelling engine; camera moves, object
mostly holds; materials are restrained; the palette is one dark or one light
neutral plus one accent.

### Principles distilled

1. **Warm neutral, not white; ink, not black.** Canvas `#f4f1ea`, text `#1a1917` (Paper); canvas `#111113`, text `#f0ece4` (Ink).
2. **One punctuation accent** (vermilion / ember) reserved for selection, focus, progress and brand; a **quiet secondary** (slate) for information; the primary CTA is the inverted neutral, not another hue.
3. **Luminance stacking** for surfaces; translucent hairlines; no blur walls, no glow halos.
4. **Semantic colours appear only when they carry meaning**, always with an icon and a word.
5. **Difficulty is intensity** (1–3 segment tier), never a rainbow.
6. **Typography carries hierarchy**: one display face (`Instrument Serif` for headlines / question / score), one UI face (`Inter`), mono uppercase for labels and indices.
7. **The 3D object is the identity, the UI is the instrument.** The lattice never sits under a question; the question owns the page.

---

## 3. Directions considered

| # | Direction | Canvas | Signature | Why not / why |
|---|---|---|---|---|
| A | **Paper & Nexus** (chosen) | warm ivory | one knowledge lattice: ceramic nodes, metal struts, dark core | Best fit for reading evidence, editorial brief and the "knowledge → connection → mastery" story. |
| B | Obsidian Archive | ink-navy | a library of illuminated slabs | Strong, but dark-first contradicts the reading evidence for a text-heavy product; kept as the *Ink* theme's mood. |
| C | Question Constellation | deep charcoal | point cloud that rearranges per topic | Reads as "particles" quickly; hard to make feel *heavy* and premium. |
| D | Knowledge Core | bone | single machined sphere with an inner glow | The "glowing sphere" cliché the brief warns against. |
| E | Nexus Grid | paper | flat isometric grid that extrudes with progress | Elegant but feels like a dashboard; weak first-5-seconds. |

### The chosen set-piece — *The Nexus*

A lattice: **nodes = questions, struts = connections, core = the learner, lit
nodes = mastery.** One object, one canvas, one material story (matte ceramic,
brushed metal, dark lacquer, a thin vermilion halo). Lighting is a warm key, a
cool fill and a rim; a soft contact shadow grounds it; no bloom.

| Page | Mode | Layout | Evolves by |
|---|---|---|---|
| Home | `establish` | hero → retreats into depth on scroll | camera Z on scroll; cursor tilt + parallax |
| Setup | `configure` | side | topic → sector focus, difficulty → strut density, count → lit fraction |
| Quiz | `quiet` | corner, dimmed | answered fraction lights nodes slowly |
| Result | `resolve` | top, above the score | score % → lit fraction, halo brightens |
| History | `archive` | corner | attempts → nodes lit |
| About | `establish` | corner | static |

Implementation: `src/components/three/` — `lattice.ts` (geometry + smoothed
state), `store.ts` (pub/sub + `useLattice()` hook), `NexusScene.tsx` (R3F,
instanced nodes and struts → 4 draw calls + shadows), `NexusStage.tsx` (fixed
stage, WebGL / reduced-motion detection, static SVG fallback).

---

## 4. Token contract (`src/styles/tokens.css`)

Both themes define the same set; components use only Tailwind aliases or `var()`.

```
canvas / elevated / surface / card / card-strong          surfaces (recessed → strongest)
text / text-2 / text-3 / text-inverse                      primary / secondary / muted / on-accent
line / line-subtle / line-strong                           borders
accent / accent-2 / accent-soft / accent-dark / accent-b   primary, small-text variant, tint, dark, secondary (slate)
accent-on-ink                                              accent for use on the inverted panel
cta / cta-hover / cta-text                                 inverted primary action
success / warning / error (+ -soft)                        semantics
selected / selected-soft / hover / focus                   states
progress / track / score                                   progress + score
disabled / disabled-text
deco-1 / deco-2 / grid / noise-opacity                     decorative
3d-core / 3d-strut / 3d-node / 3d-shadow / 3d-key / 3d-fill 3D palette
ease / ease-in / dur-fast 150ms / dur 320ms / dur-slow 640ms motion
```

Tailwind exposes them as `bg-canvas`, `bg-card`, `text-fg`, `text-fg-2`,
`border-line`, `text-accent`, `text-accent-b`, `bg-cta`, `text-ok`, `text-warn`,
`text-err`, `bg-progress`, `duration-fast/base/slow`, etc. No component contains
a raw hex value; SVG and 3D code read tokens via `readToken()`.

### Contrast (audited with a script over the token file)

| Pair | Paper | Ink | Requirement |
|---|---|---|---|
| text / canvas | 15.6 | 16.0 | 4.5 |
| text-2 / card | 7.6 | 6.8 | 4.5 |
| text-3 (labels ≥ 12 px mono caps) / card | 4.2 | 3.7 | 3.0 |
| accent (large / UI) / card | 4.8 | 5.8 | 3.0 |
| accent-2 (small text) / card | 6.5 | 9.3 | 4.5 |
| text-inverse / accent (selected key) | 5.0 | 6.6 | 4.5 |
| success · warning · error / card | 5.5 · 5.2 · 5.8 | 8.6 · 9.0 · 5.4 | 4.5 |
| accent-on-ink / cta panel | 7.1 | 5.1 | 4.5 |

States are never colour-only: selected = filled key + check icon + "Selected"
label + border; correct / incorrect = icon + word + left rule; focus = 2 px ring
in `--nx-focus` with offset; disabled = reduced opacity + `cursor-not-allowed`.

---

## 5. Motion system

One easing for everything that moves in the UI: `cubic-bezier(0.22, 1, 0.36, 1)`
(`--nx-ease`); `--nx-ease-in` for exits. Durations: 150 ms (hover, toggles),
320 ms (reveals, choice states), 640 ms (page transitions, score count-up start).
Springs (framer) only for the theme knob and magnetic links. The 3D object uses
critically-damped smoothing (`LatticeState.step`) so it never overshoots.
`prefers-reduced-motion` removes the WebGL stage, page transitions and count-ups.

## 6. Performance & quality tiers

| Tier | Trigger | Nodes / struts | DPR | Shadows | AA |
|---|---|---|---|---|---|
| high | desktop, > 4 logical cores and > 4 GB device memory | 72 / 132 | ≤ 1.75 | contact shadows 512 px, env 128 px | on |
| medium | desktop / tablet with ≤ 4 cores or ≤ 4 GB | 72 / 132 | ≤ 1.4 | contact shadows 256 px, env 64 px | on |
| low | viewport ≤ 768 px | 52 / 105, lower-poly primitives | ≤ 1.1 | off, no environment | off |
| none | no WebGL or reduced-motion | static SVG lattice | — | — | — |

The scene is one lazy-loaded chunk; rendering pauses when the tab is hidden; the
canvas is `pointer-events: none` and sits under all content so it can never block
a tap on mobile.

## 7. Hierarchy test

With the stage, gradients, noise, shadows and animation disabled the page still
reads: CTA (inverted neutral) → question (display type, `--nx-text`) → choices
(card surfaces; selected = accent + label) → progress → score → feedback →
metadata (`--nx-text-2/3`). That order is what the tokens enforce.
