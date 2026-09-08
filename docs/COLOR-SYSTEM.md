# VEYRA colour system — Paper · Ink · one green

Scope of this pass: colour tokens and theme architecture only. Layout,
components, typography, 3D geometry/motion, content, routing and backend are
untouched. The 3D scene inherits the new palette purely through tokens it
already read.

## Principle

**Paper + Ink + ONE signature green.**

There is exactly one chromatic colour in the product. Everything else is a
warm neutral derived from paper (light) or ink (dark). Green is scarce on
purpose: it marks the primary action, the selected thing, progress, and the
lit nodes of the knowledge network — and nothing else.

What was removed to get there: the vermilion/ember accent, the slate
secondary accent, the amber warning colour, the red error colour, the second
(cool) background wash, the cool blue 3D fill light, and the ink-black CTA.

Reference principles (not copied): a single disciplined brand green against
neutral surfaces (Nextdoor's 2025 return to a darker green); forest green on
warm cream (Arva); cream + ink + one saturated green with a polarity-flipped
dark theme (Agent Smith); neutral editorial canvas with restrained colour
(Airtable). VEYRA keeps its own logo, layout, typography and network.

## Token architecture

Two layers in `src/styles/tokens.css`:

**Layer 1 — the semantic contract** (public, what a new component should use)

| Token                     | Paper     | Ink       | Meaning                                  |
| ------------------------- | --------- | --------- | ---------------------------------------- |
| `--color-bg`              | `#F7F4EC` | `#0D1411` | page                                     |
| `--color-surface`         | `#EFEBE1` | `#101713` | recessed band / rail                     |
| `--color-surface-raised`  | `#FBF9F4` | `#182019` | card                                     |
| `--color-text`            | `#18201C` | `#F4F0E7` | primary text                             |
| `--color-text-muted`      | `#4A524D` | `#B3B5AD` | secondary text                           |
| `--color-border`          | text @10% | text @8%  | hairlines (warm with the surface)        |
| `--color-accent`          | `#2D6A4F` | `#63B88D` | **the** green                            |
| `--color-accent-hover`    | `#245740` | `#79C69E` |                                          |
| `--color-accent-active`   | `#1C4532` | `#4FA87B` |                                          |
| `--color-on-accent`       | `#F7F4EC` | `#0D1411` | text on a green button                   |
| `--color-focus`           | accent @90% | accent @85% | focus ring                          |

**Layer 2 — implementation aliases** (`--nx-*`, consumed by Tailwind and the
existing CSS). Every `--nx-*` colour resolves to a Layer-1 token or a neutral
step between two of them, so no component needed to change to adopt the new
system. Highlights:

- `--nx-cta*` → accent / accent-hover / on-accent (primary button is green).
- `--nx-panel`, `--nx-panel-text` → the one editorial ink block per page (ink on paper; flips to bone on ink).
- `--nx-success` → accent. `--nx-warning` → text-muted. `--nx-error` → text. Correct/incorrect are always paired with a word or icon, so they no longer need their own hues.
- `--nx-accent-b` (name kept for the 3D secondary tint) is now a warm grey.
- `--nx-deco-2` is `transparent`; only one faint green wash remains, top-right.
- `--nx-3d-*` materials: ink core, paper node, warm-grey strut, neutral fill light — no blue.

## Where green appears (and where it doesn't)

Appears: primary CTA · active nav pill ring · selected answer row (10 % tint + 1 px border + filled key + check) · selected tier / size / history filter (tint + border, never a filled block) · progress strip · correct-answer marks · trend line · lit network nodes and the node glow · logo dot · focus ring.

Doesn't: card backgrounds · page sections · icons in general · the ink panel (ink stays ink, with green only on its eyebrow labels) · the 3D core spheres (ink) or struts (grey).

## Measured contrast (WCAG 2.2)

Normal text ≥ 4.5:1; large text and UI graphics ≥ 3:1.

**Paper** — on bg / surface / card / selected-tint

| Foreground          |  bg   | surface | card  | selected |
| ------------------- | ----: | ------: | ----: | -------: |
| text `#18201C`      | 15.14 | 13.98   | 15.81 | 13.17    |
| muted `#4A524D`     | 7.33  | 6.77    | 7.66  | 6.38     |
| text-3 `#636B65`    | 5.00  | 4.62    | 5.22  | —        |
| green `#2D6A4F`     | 5.81  | 5.37    | 6.07  | 5.06     |
| green-2 `#25593F`   | 7.41  | 6.84    | 7.74  | 6.44     |
| disabled `#8B928C`  | 2.90  | 2.68    | 3.03  | — (disabled only) |

On-accent `#F7F4EC` on green 5.81 · hover 7.61 · active 9.81. Ink panel: bone on ink 15.14, green-on-ink 6.95. Focus ring vs bg 5.81.

**Ink**

| Foreground          |  bg   | surface | card  | selected |
| ------------------- | ----: | ------: | ----: | -------: |
| text `#F4F0E7`      | 16.41 | 16.00   | 14.66 | 14.16    |
| muted `#B3B5AD`     | 9.00  | 8.78    | 8.04  | 7.77     |
| text-3 `#8F938C`    | 5.97  | 5.82    | 5.34  | —        |
| green `#63B88D`     | 7.79  | 7.60    | 6.96  | 6.73     |
| green-2 `#79C69E`   | 9.23  | 9.00    | 8.24  | 7.96     |
| disabled `#5E6660`  | 3.15  | 3.07    | 2.81  | — (disabled only) |

On-accent `#0D1411` on green 7.79 · hover 9.23 · active 6.42. Bone panel: ink on bone 16.41, forest green on bone 5.62. Focus ring vs bg 7.79.

Checked surfaces: body, question, answer options (rest + selected), navigation, buttons (rest/hover/active), muted text, focus indicator, selected states. Tertiary text is never placed on a selected tint.

## Files touched

- `src/styles/tokens.css` — rewritten (both themes, two-layer architecture).
- `src/styles/globals.css` — `.panel-ink` reads `--nx-panel*`; range-slider knob is ink, not green.
- `src/pages/Setup.tsx` — selected tier tile and size pill: green tint + border instead of a solid filled block.
- `src/pages/History.tsx` — selected filter: green tint + border instead of a solid block.
- `src/pages/Home.tsx` — ink-panel divider uses `--nx-panel-text`.
- `src/components/three/NetworkScene.tsx` — the three studio light formers are neutral warm whites (the last hard-coded blue); fallback fill colour neutral. No geometry, motion or material logic changed.
- `index.html`, `public/favicon.svg` — theme-colour and favicon on the new paper / ink / green.
