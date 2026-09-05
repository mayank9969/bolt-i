# NEXUSQuiz — Typography System

_One typeface. Eleven roles. Three weights._ Applied 2026-09-05; source of truth is `src/styles/globals.css` (`:root` type variables + `.t-*` classes).

## 1. Typeface decision

Compared (all open-source, all designed for screens):

| Typeface | Facts (researched) | Verdict for NEXUSQuiz |
| --- | --- | --- |
| **IBM Plex Sans** | Designed by Mike Abbink with Bold Monday for IBM (released 2017/2018), 7 weights + true italics, SIL OFL, grotesque with open counters and a distinctive but neutral voice; built to "read cleanly at every scale without imposing its own voice". Sources: [Wikipedia](https://en.wikipedia.org/wiki/IBM_Plex), [Type Barn](https://typebarn.com/font/ibm-plex-sans) | **Chosen.** Clear at 13–17 px, excellent numerals (open 3/6/9, distinguishable 0/O and 1/l/I — important for maths answers like `[[2,0],[0,3]]`), real italics for emphasis, and a slightly warmer, more "printed" character than Inter that suits the paper theme. Tabular figures available. |
| Inter | Rasmus Andersson, designed for UI, tall x-height, tabular numbers, contextual alternates; the most common product-UI face on the web. Sources: [featuredtype](https://www.featuredtype.com/typefaces/inter) | Excellent, but extremely generic ("every SaaS dashboard") and its italics are slanted romans. Rejected for identity reasons, not readability. |
| Geist | Vercel/basement.studio, Swiss-influenced, variable 100–900, on Google Fonts since Oct 2024. Source: [FontAlternatives](https://fontalternatives.com/fonts/geist/) | Cool, technical, very close to Inter in feel; reads as "developer tool". Rejected. |

Decorative faces removed: **Instrument Serif** (display) and **JetBrains Mono** (labels) are gone. Every role below is IBM Plex Sans. The font is **self-hosted** via `@fontsource/ibm-plex-sans` (latin 400 / 400 italic / 500 / 600 / 600 italic, ~24 kB each) — no Google Fonts request, no flash of fallback type, works offline.

## 2. Roles (tokens)

| Role | Class | Size | Line-height | Tracking | Weight | Used for |
| --- | --- | --- | --- | --- | --- | --- |
| Display / Hero | `.t-hero` | 44 → 88 px (fluid) | 1.02 | −0.03em | 600 | Home headline only |
| H1 | `.t-title` | 34 → 56 px | 1.08 | −0.025em | 600 | Page titles (Setup, History, About, Home CTA) |
| H2 | `.t-section` | 26 → 36 px | 1.15 | −0.02em | 600 | Section headings |
| H3 | `.t-h3` | 20 px | 1.3 | −0.01em | 600 | Row / card titles, step numbers |
| **Question** | `.t-question` | **22 → 30 px** | **1.35** | −0.012em | **500** | Quiz question — the priority role |
| **Answer** | `.t-answer` | **17 px** | **1.5** | 0 | 400 (500 when selected) | MCQ options, typed-answer field |
| Lead | `.t-lead` | 18 px | 1.55 | 0 | 400 | Intro paragraphs |
| Body | `.t-body` / default | 16 px | 1.6 | 0 | 400 | Everything else |
| Navigation | `.t-nav` | 15 px | 1.2 | 0 | 500 | Header + mobile menu links |
| Label | `.t-label` | **13 px** (floor) | 1.3 | +0.04em | 500 | Eyebrows, figure captions, indices, "Selected" states (uppercase) |
| Caption | `.t-caption` | 13 px | 1.45 | 0 | 400 | Helper text, hints, meta |
| Button | `.t-button` | 15 px (17 px in `.btn-lg`) | 1 | 0 | 500 | All buttons |
| Stat | `.t-stat` / `.t-stat-sm` | 40 → 72 px / 36 px | 1 | −0.03em | 600, tabular | History summary, Result ledger, marks |
| Score | `.t-score` | 64 → 128 px | 0.95 | −0.04em | 600, tabular | Result percentage |
| Emphasis | `.t-italic` | inherits | — | — | inherits, italic | One emphasised phrase per heading (true italics) |

Rules enforced by the system:
- **Minimum text size 13 px** (was 10–11 px mono labels). Nothing that must be read is smaller.
- **Letter-spacing** ≤ +0.04em on uppercase labels (was +0.18–0.22em); negative tracking only on ≥ 26 px headings.
- **Weights: 400 / 500 / 600 only.** No thin, no bold-900.
- Headings use `text-wrap: balance`; question text uses `text-pretty`, max ~26ch line length.
- Numbers use `font-variant-numeric: tabular-nums` (`.num`) wherever they align (scores, attempts, timers).

## 3. Contrast (WCAG 2.2 AA, measured on the actual token pairs, Paper theme)

| Pair | Ratio | Requirement |
| --- | --- | --- |
| Question text `#1A1917` on canvas `#F2EEE5` | 15.2:1 | 4.5 ✓ |
| Answer text `#54524D` on card `#F9F6F0` | 7.2:1 | 4.5 ✓ |
| Selected answer `#1A1917` on card | 16.3:1 | 4.5 ✓ |
| Body `#54524D` on canvas | 6.7:1 | 4.5 ✓ |
| Caption 13 px `#68645C` on canvas | 5.1:1 | 4.5 ✓ |
| Caption 13 px on darker surface `#E9E4D9` | 4.6:1 | 4.5 ✓ (text-3 darkened from `#6E6A62` for this) |
| Label accent `#A83410` on canvas | 5.7:1 | 4.5 ✓ |
| Accent `#CC3C18` (≥ 24 px / graphics only) | 4.3:1 | 3 ✓ |
| Button text `#F4F1EA` on ink | 15.6:1 | 4.5 ✓ |
| Success / warning / error stats | 4.9 / 4.6 / 5.2:1 | 4.5 ✓ |

Ink (dark) theme uses the same roles; its pairs were audited earlier (text-3 ≈ 4.9:1, accent 6.6:1).

## 4. What changed in code
- `index.html`: Google Fonts links removed.
- `src/main.tsx`: five `@fontsource/ibm-plex-sans` imports.
- `tailwind.config.js`: `sans`, `display`, `mono` all alias IBM Plex Sans (legacy class names can't reintroduce a second family).
- `src/styles/globals.css`: type variables + `.t-*` roles; `.eyebrow`, `.index`, `.figcap`, `.opener`, `.chip`, `.choice-key`, `kbd.key`, `.stat-big`, buttons now compose the roles.
- All pages/components: `font-display` / `font-mono` / `text-[10px]` / `text-[11px]` / wide tracking removed and mapped to roles. Trend chart axis labels 10 → 12 px.
- `tokens.css`: `--nx-text-3` darkened one step for AA on every surface.

Not touched: 3D scene, theme colours (other than text-3), layouts, backend, API, quiz logic.
