# NEXUSQuiz — Warm light theme (Paper)

Scope of this pass: colours, surfaces, borders and shadows only. Typography,
layout, 3D, quiz logic, API and backend are untouched. Every colour in the UI
resolves to a semantic token in `src/styles/tokens.css`; components never
hard-code a hex value (the only literals left are the three studio light
formers inside the 3D scene and the fallback values in `theme.ts`).

Light ("Paper") is the default. Dark ("Ink") stays as the alternative and
received only the new shadow / highlight / ground tokens so the same CSS works
in both.

## Direction

Reading product → light default (positive polarity helps small text; NN/g
"Dark Mode vs. Light Mode"). The palette is built like printed stock rather
than an inverted dark UI:

| Principle                   | How it shows up                                                          |
| --------------------------- | ------------------------------------------------------------------------ |
| Warm, never white           | No `#FFFFFF` anywhere. Canvas is parchment `#F4F1EA`; the brightest tone in the whole system is `#FDFCF9` (popovers / focused fields). |
| Ink, never black            | Primary text `#1C1B18` (warm charcoal). Pure black only appears as the CTA *hover* state, so the button visibly darkens. |
| Tone hierarchy, not shadow hierarchy | Four surface tones layer the page: recessed `#EBE6DC` < canvas `#F4F1EA` < card `#FAF8F3` < card-strong `#FDFCF9`. Shadows are secondary. |
| Borders are ink, not gray   | Lines are the text colour at 6 / 10 / 22 % alpha, so they warm with whatever sits beneath them instead of reading as cold gray. |
| Shadows are tinted          | All shadows use `--nx-shadow-ink: 60 48 30` (a warm brown), large blur, negative spread, ≤ 26 % alpha. Cards also get a 1 px white-ish inset top edge (`--nx-highlight`) — the thing that makes paper read as paper. |
| One accent, three strengths | Vermilion `#BA3A16` for marks and UI, `#A33412` for small accent text, `#7E2A0F` pressed. Slate `#3A4C6E` is a 3D fill light and the chart mean line only — never a UI accent. |
| Restraint                   | Accent appears as index numbers, the selected state, the progress rule and the logo. The primary CTA is ink, not accent. |

## Token table (Paper)

| Role                      | Token                        | Value      |
| ------------------------- | ---------------------------- | ---------- |
| Canvas                    | `--nx-canvas`                | `#F4F1EA`  |
| Recessed surface          | `--nx-surface`               | `#EBE6DC`  |
| Elevated (inputs, keys)   | `--nx-elevated`              | `#F8F6F0`  |
| Card                      | `--nx-card`                  | `#FAF8F3`  |
| Card strong               | `--nx-card-strong`           | `#FDFCF9`  |
| Text                      | `--nx-text`                  | `#1C1B18`  |
| Text secondary            | `--nx-text-2`                | `#4F4C45`  |
| Text tertiary             | `--nx-text-3`                | `#68645C`  |
| Line / subtle / strong    | `--nx-line*`                 | ink @ 10 / 6 / 22 % |
| Accent                    | `--nx-accent`                | `#BA3A16`  |
| Accent (small text)       | `--nx-accent-2`              | `#A33412`  |
| Accent pressed            | `--nx-accent-dark`           | `#7E2A0F`  |
| Accent on ink panel       | `--nx-accent-on-ink`         | `#FF8A5C`  |
| CTA / hover / text        | `--nx-cta*`                  | `#1C1B18` / `#000000` / `#F6F3EC` |
| Success / warning / error | `--nx-success` …             | `#1F6F4A` / `#8F5A0A` / `#B3261E` |
| Disabled text             | `--nx-disabled-text`         | `#8A857A` (decorative only) |
| Shadow tint               | `--nx-shadow-ink`            | `60 48 30` |
| Highlight (inset edge)    | `--nx-highlight`             | white @ 50 % |
| 3D ground bounce          | `--nx-3d-ground`             | `#CDC4B4`  |

## Measured contrast (WCAG 2.2, relative-luminance formula)

Requirement: normal text ≥ 4.5:1, large text (≥ 24 px, or ≥ 19 px semibold) and UI graphics ≥ 3:1.

| Foreground        | canvas | surface | elevated | card  | card-strong |
| ----------------- | -----: | ------: | -------: | ----: | ----------: |
| text `#1C1B18`    | 15.27  | 13.85   | 15.94    | 16.23 | 16.79 |
| text-2 `#4F4C45`  | 7.59   | 6.89    | 7.92     | 8.07  | 8.35  |
| text-3 `#68645C`  | 5.22   | 4.73    | 5.45     | 5.55  | 5.74  |
| accent `#BA3A16`  | 5.03   | 4.56    | 5.24     | 5.34  | 5.52  |
| accent-2 `#A33412`| 6.09   | 5.52    | 6.36     | 6.47  | 6.70  |
| success `#1F6F4A` | 5.43   | 4.92    | 5.66     | 5.77  | 5.97  |
| warning `#8F5A0A` | 5.12   | 4.65    | 5.35     | 5.44  | 5.63  |
| error `#B3261E`   | 5.79   | 5.26    | 6.05     | 6.16  | 6.37  |
| disabled `#8A857A`| 3.26   | 2.95    | 3.40     | 3.46  | 3.58  |

CTA text on CTA: 15.54. Accent-on-ink on the ink panel: 7.42.

Every text token used for real copy clears 4.5:1 on every surface it can sit
on. `--nx-disabled-text` is the only sub-4.5 value and is reserved for disabled
controls and decorative marks (not required to pass under SC 1.4.3).

The Ink theme's colours are unchanged from the previous pass (all text ≥ 4.5:1
was verified then); it only gained the new shadow / highlight / ground tokens.

## What changed in code

- `src/styles/tokens.css` — Paper block rewritten (values above); new
  `--nx-shadow-ink`, `--nx-shadow-cta`, `--nx-shadow-cta-hover`,
  `--nx-highlight`, `--nx-3d-ground` in both themes.
- `src/styles/globals.css` — `.btn-primary`, `.choice` and `.nx-range` now use
  the shadow / highlight tokens instead of literal rgba values.
- `src/pages/Result.tsx` — the score ledger sits on a `.surface` card so the
  numbers no longer read directly against the 3D network (one class change,
  no layout or logic change).
- `src/components/three/NexusScene.tsx` — the hemisphere light reads
  `--nx-3d-ground`, so the network's under-side bounce matches the paper.
- `index.html`, `public/favicon.svg` — browser chrome colour and favicon
  updated to the new canvas / ink / accent values.
