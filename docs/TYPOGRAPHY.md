# NEXUSQuiz typography — Geist Sans, two registers

Scope: typography only. Palette, themes, layout, components, 3D, content,
routing and backend untouched. The only markup edits are removing italic
spans on product pages and adding two responsive `<br>`s in the hero.

## Typeface: Geist Sans (variable) — over Inter

Both were rendered side-by-side with real NEXUSQuiz content (hero, a long
question, code-like answers, body, nav, button, a 55.9 % statistic) at the
exact sizes the system uses. Geist was chosen because:

- **The hero reads as a product brand, not a portfolio.** Geist's italic is a
  true slanted italic with a slightly narrower set; "node." and "connection."
  stay in the same voice as the roman rather than turning into a second font.
  Inter's italic is wider and softer and the emphasised words start to float.
- **Answers and code.** `len([10,20,30])`, `x^2 − 9`, `Il1 O0`, `{1,2,3} ∩
  {3,4,5}` — Geist's brackets, braces, operators and digits are more open at
  17 px and the `1 / l / I` trio is distinguishable without enabling
  stylistic sets. Inter needs `cv11`/`ss01` to get close.
- **Restraint.** Geist has a slightly tighter default fit and a calmer
  lowercase, which suits a paper/ink system where nothing else is loud.
- **Integration.** Self-hosted from `@fontsource-variable/geist` (SIL OFL);
  one roman + one italic variable file for latin, so 400/450/500/600/700 all
  come from two requests. IBM Plex Sans removed; no Google Fonts.

Inter remains a fine fallback but did not produce a stronger result, so the
brief's rule ("Geist if clearly better") applies.

## Two registers

| Register    | Where                 | Roles                          | Italic | Weight |
| ----------- | --------------------- | ------------------------------ | ------ | ------ |
| Expressive  | Home hero, logo mark  | `.t-hero`, `.t-italic`         | yes    | 700    |
| Product     | everything else       | all other roles                | never  | 400–600 |

The italic device is now used in exactly two places: the hero's "node." and
"connection.", and the *Quiz* in the wordmark. Setup, Result, History, About
and the lower Home sections had their italic spans removed and now use plain
weight/colour contrast.

## Role scale (measured in the built app)

| Role            | Class          | Size (mobile → laptop) | Weight | Line-height | Tracking |
| --------------- | -------------- | ---------------------- | -----: | ----------: | -------: |
| Display / hero  | `.t-hero`      | 42 → 84 px             | 700    | 1.04        | −0.028em |
| H1 / page title | `.t-title`     | 32 → 52 px             | 600    | 1.08        | −0.022em |
| H2 / section    | `.t-section`   | 24 → 32 px             | 600    | 1.18        | −0.016em |
| H3 / row title  | `.t-h3`        | 19 px                  | 600    | 1.32        | −0.008em |
| **Question**    | `.t-question`  | 22 → 28 px             | 500    | 1.38        | −0.01em  |
| **Answer**      | `.t-answer`    | 17 px                  | 450    | 1.5         | 0        |
| Lead            | `.t-lead`      | 18 px                  | 400    | 1.55        | 0        |
| Body            | `.t-body`      | 16 px                  | 400    | 1.6         | 0        |
| Navigation      | `.t-nav`       | 15 px                  | 500    | 1.2         | 0        |
| Button          | `.t-button`    | 15 px                  | 600    | 1           | 0        |
| Metadata        | `.t-meta`      | 14 px                  | 500    | 1.4         | 0        |
| Label (eyebrow) | `.t-label`     | 13 px                  | 500    | 1.3         | +0.03em, uppercase |
| Caption         | `.t-caption`   | 13 px                  | 400    | 1.45        | 0        |
| Statistic       | `.t-stat`      | 37 → 64 px             | 600    | 1           | −0.025em |
| Statistic small | `.t-stat-sm`   | 34 px                  | 600    | 1           | −0.02em  |
| Score           | `.t-score`     | 60 → 120 px            | 600    | 0.95        | −0.035em |

Measured at 390 / 820 / 1366 / 1920 px: fluid roles scale smoothly, fixed
roles (answer, nav, button, label, caption) do not drift. 13 px is the floor
for anything that must be read. Weights used: 400 / 450 / 500 / 600 / 700 —
no 300.

Roles are emitted **unlayered** in `globals.css` so every class always ships,
including the ones only reached through `@apply` (`.t-button` in buttons,
`.t-meta` in `.figcap`).

## Metadata and labels

Two roles instead of one, so small text stops being decorative noise:

- `.t-meta` (14 px, 500, sentence case, no tracking) — figure captions
  ("Fig. 01 — three regions of knowledge, 96 nodes"), quiz context lines
  ("Python · Easy · Choose one"), ledger heads, "48 questions", "Scroll to move
  through it". `.figcap` now maps here.
- `.t-label` (13 px, 500, uppercase, +0.03em) — short eyebrows and index
  marks only ("01 — Regions", "Living knowledge network"). Tracking reduced
  from 0.04em.

## Hero

`t-hero` at 700 (the only 700 in the product), −0.028em, line-height 1.04.
Line breaks are controlled: on ≥ 640 px it always sets as

```
Every question
is a node.
Every answer,
a connection.
```

so the two emphasised words each close a line; on phones the `<br>`s are
dropped and `text-balance` handles it. Green is used on one word. No
gradient, glow, outline or letter-spacing tricks.

## Quiz

Reading order is enforced by size and weight alone: question 28 px / 500 →
answers 17 px / 450 (a hair above body so options read as choices, not
prose) → progress in `t-meta` 14 px → action in `t-button` 15 px / 600.
Answer rows keep 14 px horizontal padding and 56 px minimum height; long
options wrap with `overflow-wrap: anywhere`.

## Both themes

Identical roles, sizes, weights and spacing on Paper and Ink — verified by
screenshot at every page. Only colour tokens differ.

## Files touched

- `src/main.tsx` — Geist variable roman + italic imports; IBM Plex Sans imports removed.
- `tailwind.config.js` — font family.
- `src/styles/globals.css` — type tokens and roles (unlayered), `.figcap → .t-meta`, base heading defaults.
- `src/pages/Home.tsx` — controlled hero breaks; two lower italic spans removed.
- `src/pages/Setup.tsx`, `Result.tsx`, `History.tsx`, `About.tsx` — italic spans removed.
- `package.json` — `@fontsource-variable/geist` added; `@fontsource/ibm-plex-sans` removed. Inter was installed only for the comparison and is not a dependency.
