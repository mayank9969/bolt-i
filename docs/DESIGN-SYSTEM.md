# NEXUSQuiz — Visual Color System

This document records the reference research, the principles derived from it, the
candidate theme directions and the token system that the whole frontend now uses.
The backend (`quiz.app/*`, `api/server.py`) was not touched.

---

## 1. Reference research (only verified facts)

Direct site inspection was done through public token-extraction write-ups and the
sites' own pages; nothing below is invented.

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

### Principles distilled

1. **Tinted, not neutral**: canvas is a tinted near-black (navy / wine / graphite), text is bone/ivory rather than `#fff`.
2. **Luminance stacking** for surfaces (deeper = darker) with hairline translucent borders and an inset highlight — no glass blur walls, no outer glow halos.
3. **One punctuation accent** for *selection / focus / progress / brand*; the primary CTA is the highest-luminance element instead of another hue.
4. **Semantic colours are the only other hues** (success / warning / error) and they only appear when they carry meaning (scores, correctness).
5. **Difficulty is intensity, not a rainbow**: easy/medium/hard are shown as a 1–3 segment tier meter, not green/amber/red chips.
6. **Typography carries hierarchy**: display face for question and numbers, mono uppercase for labels (Active Theory), positive tracking on small caps.
7. **Atmosphere lives in the background layer** (3D nexus, grid, one warm light) and is reduced on mobile / removed under reduced-motion.

---

## 2. Theme directions

All themes share the same token contract, the same components and the same brand
mark. Each is a complete system (canvas, four surfaces, three text levels, three
borders, accents, CTA, semantics, selection, focus, progress, score, disabled,
decorative + 3D palette).

| Theme | Canvas | Text | Accent (selection / progress / brand) | CTA | Character |
|---|---|---|---|---|---|
| **Obsidian** (default) | ink-navy black `#070a12` | bone `#f2efe6` | **ember** `#ff6a3c` | bone on ink | Night + paper + a single warm signal. Keeps NEXUSQuiz's navy lineage. |
| **Editorial** | warm paper `#f3efe7` | ink `#15171d` | ember (deepened) `#e04e1f` | ink on paper | Print / magazine. Same brand punctuation on a light page. |
| **Oxblood** | wine black `#140a0d` | ivory `#f4ece4` | gold `#e6b455` | ivory on wine | Cinematic, warm, luxurious. |
| **Acid** | graphite `#0b0c0a` | `#eef1e6` | acid `#c8f23c` | acid on graphite | Experimental / award-site energy, still one accent. |
| **Mono** | `#050505` | `#ededed` | white | white on black | Vercel/Obys restraint: only the semantic colours remain. |

Obsidian was chosen as default because it keeps the product recognisable (dark
navy-black + the nexus mark), the ember accent is distinct from every semantic
colour, and the bone CTA gives an unmistakable primary action.

Themes are switched with `data-theme` on `<html>` (persisted in `localStorage`
under `nexusquiz.theme`) — see `src/lib/theme.ts` and the switcher in the footer.

---

## 3. Token contract (`src/styles/tokens.css`)

```
--nx-canvas / --nx-elevated / --nx-surface / --nx-card / --nx-card-strong
--nx-text / --nx-text-2 / --nx-text-3 / --nx-text-inverse
--nx-line / --nx-line-subtle / --nx-line-strong
--nx-accent / --nx-accent-2 / --nx-accent-soft / --nx-accent-glow
--nx-cta / --nx-cta-hover / --nx-cta-text
--nx-success / --nx-warning / --nx-error   (+ -soft tints, + -rgb triplets)
--nx-selected / --nx-selected-soft / --nx-focus
--nx-progress / --nx-track / --nx-score
--nx-disabled / --nx-disabled-text
--nx-deco-1 / --nx-deco-2 / --nx-grid
```

Tailwind exposes them as `bg-canvas`, `bg-card`, `text-fg`, `text-fg-2`,
`border-line`, `text-accent`, `bg-cta`, `text-ok`, `text-warn`, `text-err`,
`bg-progress`, etc. No component contains a raw hex value; SVG, 3D and canvas
code read tokens via `readToken()`.

### Attention order enforced by the tokens

main action (CTA, brightest) → current question (display type in `--nx-text`) →
answer choices (card surfaces; selected = accent) → progress (accent) →
score (display numerals + performance tone) → feedback (success / error) →
secondary information (`--nx-text-2/3`).
