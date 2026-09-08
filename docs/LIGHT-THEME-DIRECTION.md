# VEYRA — Light Theme Art Direction (research + recommendation)

_Date: 2026-09-05. Facts are marked **[Researched]** with a source. Everything else is marked **[Recommendation]** and is my design judgement._

---

## 1. Recommended concept — "Warm Paper, Ink & Vermilion"

**[Recommendation]** A warm-parchment reading surface (not white), deep warm charcoal typography (not black), warm-gray secondary surfaces for layering, and **one** hot signature accent (vermilion) used like a printer's second ink — small, sharp, intentional. The 3D network is lit with warm key light so it sits *on* the paper instead of floating over it.

Why this beats "generic light SaaS": SaaS light themes are cool (blue-tinted grays, #FFFFFF, blue/purple accent). Paper is warm, tonal and typographic. The energy comes from ink-black CTAs and a single hot accent, not from brightness or gradients.

---

## 2. Light vs dark — what the research actually says

**[Researched]** Nielsen Norman Group's literature review (Budiu, 2020):
- Piepenbrock et al. (*Ergonomics*, 2013): for adults with normal or corrected vision, young and old, **light mode (positive polarity) won on both visual-acuity and proofreading tasks**; no significant difference in fatigue measures.
- Same group (*Human Factors*): the light-mode advantage **grows linearly as font size shrinks** — "the smaller the font, the better it is for users to see the text in light mode."
- Participants **did not subjectively notice** the difference even though they performed better in light mode.
- Dobres et al. (MIT AgeLab): in bright daylight no polarity effect; in night/office light, **light mode was better**, especially for small text.
- Some users with cataracts / cloudy ocular media perform better in dark mode (Legge et al.) → keep a dark option.
- Caveat: a small (7-participant) 2018 study associated one hour of light-mode reading with choroid thinning (a myopia marker). Too small to change the default, but a reason to avoid *maximum* brightness (hence parchment, not white).
- Source: https://www.nngroup.com/articles/dark-mode/

**[Researched]** WCAG 2.2 AA thresholds: normal text ≥ 4.5:1; large text (≥ 24 px regular or ≥ 19 px bold) ≥ 3:1; UI components / graphical objects (borders of inputs, focus rings, icons) ≥ 3:1 (SC 1.4.3, 1.4.11). Sources: https://getwcag.com/en/contrast-checker · https://testparty.ai/blog/color-contrast-requirements

**Recommendation:** **Light is the default** for a quiz product (long stretches of reading, 15–18 px question text). Dark stays as a first-class alternative for low-vision users and preference. Emotional reading: light = open, calm, "study"; dark = "gaming console / terminal" — the wrong association for VEYRA.

---

## 3. Reference research — what warm-light premium sites actually use

**[Researched]** (palettes are the values Awwwards extracted for each site):

| Site | Studio / award | Palette | Takeaway |
| --- | --- | --- | --- |
| **Casa di Solare** — casadisolare.com | Unseen Studio + Jesper Landberg, Awwwards SOTD 19 Feb 2024, Typography Honors | **#EBE3D3** warm cream + **#FFAF37** single amber accent; intro scroll WebGL scene, variable-type hover | Proof that a warm cream base + ONE accent + WebGL reads as premium at award level. https://www.awwwards.com/sites/casa-di-solare |
| **Illoca** — illoca.unseen.co | Unseen Studio, Awwwards SOTD 4 Sep 2026 (AI design engine for architects; WebGL/3D) | **#FDF2DE** warm ivory + **#3B60C5** single blue accent | A *product* (not a portfolio) on warm ivory with 3D. Two-colour discipline. https://www.awwwards.com/sites/illoca |
| **HubTown** — hubtown.co.in | Unseen Studio, SOTD 10 Jun 2026, WebGL + GSAP | **#020A19** (one colour, near-black navy) | Dark. Take the *mouse-reveal, zoom transitions, intro sequence* principles — not the colour. https://www.awwwards.com/sites/hubtown |
| **Seasoned** — seasoned.koto.studio | Koto + Good City, SOTD 21 Mar 2025 (brand-learning hub with e-books — an *education* product) | #FFEC3F + #9DF9F9 | Education can be playful and typographic; but its palette is too loud for long reading — do not copy. https://www.awwwards.com/sites/seasoned |
| **Stripe** (public CSS, reverse-engineered) | — | bg #FFFFFF / #F6F9FC, text **#0A2540** (never pure black), muted slate secondary | Principle: primary text is very dark but *tinted*; a short token list creates cohesion. Palette is cool → not for us. https://www.designmd.run/blog/stripe-design-system-breakdown |
| **Vercel Geist** colours | — | 10 numbered steps per scale: 1–3 component bg, 4–6 borders, 7–8 high-contrast bg, 9–10 text; two page backgrounds | Structure to borrow: number the neutral steps by *role*. https://vercel.com/geist/colors |
| **Notion** (verified earlier in this project) | — | bg #F7F6F3, text #37352F | Warm-neutral reading canvas is the mainstream precedent for long-form reading. |

**Not re-verified this session:** Linear, Raycast, Bruno Simon, Active Theory, Obys. From earlier work in this project these are dark-first or experimental portfolio sites; they inform *motion and composition*, not the light palette. I did not find a light warm palette on any of them and will not claim one.

**Awwwards 2026 context [Researched]:** Obys is described as "a benchmark for editorial art direction and typographic motion" and Unseen Studio as "refined, type-led motion design … restraint reads as premium" (https://www.hontran.dev/blog/best-award-winning-websites-2026). Both point the same way: typography-led, restrained.

---

## 4. Exact colour-token system **[Recommendation]** — all contrast ratios computed (WCAG formula)

### Backgrounds (paper) — three visible layers
| Token | Hex | Role | Why |
| --- | --- | --- | --- |
| `canvas` | **#F4F1EA** | page | warm parchment, ~2% warmer than Notion; sits between Casa di Solare (#EBE3D3) and Illoca (#FDF2DE) — neither beige-heavy nor white |
| `surface` | **#EBE6DC** | recessed areas, tab rails, quiet bands | one visible step darker → layering without shadows |
| `card` | **#FAF8F3** | cards, answer options, inputs | one step lighter → cards read as "lifted paper", never #FFF |
| `card-strong` | **#FDFCF9** | popovers / focused input | strongest surface, still not pure white |

### Text (ink)
| Token | Hex | On canvas | On surface | Role |
| --- | --- | --- | --- | --- |
| `ink` | **#1C1B18** | 15.3:1 | 13.9:1 | headings, question text, primary |
| `ink-2` | **#4F4C45** | 7.6:1 | 6.9:1 | body copy, secondary |
| `ink-3` | **#6B675E** | 5.0:1 | 4.5:1 | captions, labels (still AA for normal text) |
| `muted` | **#8A857A** | 3.3:1 | — | **decorative only** (large numerals ≥ 24 px, disabled) — never for body text |

### Lines
| Token | Value | Role |
| --- | --- | --- |
| `line-subtle` | ink @ 6% | table rules, inner dividers |
| `line` | ink @ 10% | card borders |
| `line-strong` | ink @ 22% | section rules, inputs (≥ 3:1 not required for decorative rules; input borders use `ink-3` to pass 1.4.11) |

### Accent — vermilion (the one signature)
| Token | Hex | On canvas | Role |
| --- | --- | --- | --- |
| `accent` | **#C8401A** | 4.4:1 (UI ≥ 3:1 ✓; use ≥ 19 px bold or as graphic) | selected states, progress, hero italic word, 3D node activation |
| `accent-text` | **#A33412** | 6.1:1 | small accent text ("Selected", eyebrows) — passes 4.5:1 |
| `accent-deep` | **#7E2A0F** | 8.4:1 | pressed |
| `accent-soft` | accent @ 10% | selected row wash |
| `accent-on-ink` | **#FF8A5C** | 7.4:1 on #1C1B18 | accent inside dark panels / dark theme |

**Secondary accent:** none in the UI. A cool slate (**#3A4C6E**) exists only for the 3D fill light and the chart mean line. If a second UI accent is ever "needed", the answer is a darker/lighter ink, not a new hue.

### Buttons
| State | Fill | Text | Note |
| --- | --- | --- | --- |
| Primary | `ink` #1C1B18 | #F6F3EC (15.5:1) | pill; hover #000000 + arrow nudge; active translate-y 1px |
| Secondary | transparent, 1px `line-strong` | `ink` | hover fill `surface` |
| Accent (rare: "Finish quiz") | `accent` #C8401A | #F6F3EC (4.5:1 ✓) | only one per screen |
| Disabled | ink @ 6% | #8A857A | + `aria-disabled` |

### Hover / active
- Row hover: ink @ 4% wash (no colour change).
- Answer selected: `card` fill + 1px `accent` border + `accent-soft` wash + check icon + the word "Selected" (never colour alone).
- Focus ring: 3px `accent` @ 90%, 2px offset — visible on every interactive element (≥ 3:1 vs canvas ✓).

### Semantics (only when they carry meaning; always paired with icon/word)
| Token | Hex | On canvas |
| --- | --- | --- |
| `success` | **#1F6F4A** | 5.4:1 |
| `warning` | **#8F5A0A** | 5.1:1 |
| `error` | **#B3261E** | 5.8:1 |

### Shadows — warm, diffuse, low-opacity (tinted with ink-brown, never grey-black)
```
--shadow-1: inset 0 1px 0 rgb(255 255 255 / .6), 0 1px 2px rgb(60 48 30 / .05), 0 14px 36px -18px rgb(60 48 30 / .18);
--shadow-2: inset 0 1px 0 rgb(255 255 255 / .8), 0 2px 4px rgb(60 48 30 / .05), 0 30px 64px -26px rgb(60 48 30 / .26);
```
The inset white hairline is what makes cards feel like paper stock; the long, soft drop is depth without "oversized shadow".

### Gradient rules
- **No** gradient fills on UI surfaces or buttons.
- **Allowed:** a single radial "wash" (`accent` @ ≤ 10% → transparent) behind one hero number per page, and film grain at 6% opacity over the canvas.
- Accent glow only from the 3D scene, never from CSS box-shadow.

### 3D lighting palette
| Token | Hex | Role |
| --- | --- | --- |
| key light | **#FFF4E6** | warm top-front key (paper sunlight) |
| fill light | **#B9C6DD** | cool low fill for form separation |
| node material | **#FBF7EE** | bone; roughness .55 |
| core material | **#1C1A17** | ink clearcoat |
| accent emissive | **#C8401A** | activated nodes / signal pulses |
| strut / line | **#7D766B** | warm gray hairlines |
| fog | = `canvas` | so depth fades into paper |

### Typography mood
- Display: high-contrast **serif** (currently *Instrument Serif*) — italics for the one emphasised word per headline. This is the single biggest "not SaaS" signal.
- Text: neutral humanist sans (*Inter*), 16–17 px body, 1.6 line-height; question text 22–28 px.
- Labels/data: monospaced uppercase, 11 px, 0.18em tracking (*JetBrains Mono*) — figure captions, indices, keys.
- Ratio discipline: hero 96–128 px → section 40–56 px → body 17 px → caption 11 px. Few sizes, big jumps.

### Contrast targets
- Body / question / option text: **≥ 7:1** (we use `ink` 15:1 and `ink-2` 7.6:1) — above AA, close to AAA.
- Captions: ≥ 4.5:1 (`ink-3` 5.0:1).
- Accent text: `accent-text` (6.1:1); the bright `accent` only for large text / graphics (4.4:1).
- Non-text UI (borders of inputs, focus ring, icons): ≥ 3:1.

---

## 5. UI surface / material direction **[Recommendation]**
- Three tones do the layering (surface < canvas < card). Shadows are for *lift*, not for *separation*.
- Rules and hairlines over boxes: lists as ruled rows, not card grids.
- Corner radius: 8–12 px on cards, full pill on buttons/chips; nothing 24 px+ except one "ink panel" per page.
- One dark "ink panel" per page (bg `ink`, text #F6F3EC, accent `accent-on-ink`) as the counter-weight — this is where the dark theme lives inside the light theme.

## 6. Accent strategy
One hue. Budget per screen: ≤ 3 accent touches (e.g., italic hero word, selected state, progress). Everything else is ink and paper. When the 3D network activates (Result), it may exceed the budget — that is the reward moment.

## 7. Light vs dark recommendation
Light **Paper** default (evidence above). Dark **Ink** kept as a full theme with the same token roles (canvas #111113, text #F0ECE4, accent-on-ink #FF6A3C). Respect `prefers-color-scheme` only on first visit; then the user's explicit choice wins.

## 8. What NOT to copy from the references
- Casa di Solare / Illoca: their **two-colour** discipline, yes; their type faces, layouts and amber/blue hues, no.
- HubTown: mouse-reveal and zoom transitions as *principles*; not the navy, not the monolith.
- Stripe: tinted-dark text, short token list; not the cool grays, indigo or gradient mesh.
- Vercel Geist: role-numbered neutral scale; not the pure black/white and blue.
- Seasoned: energy for an education product; not the yellow/cyan.
- Notion: warm reading canvas; not the utilitarian chrome.

---

## 9. Implementation brief (paste-ready for a frontend agent)

> Implement the **Paper** light theme as the default for VEYRA using these tokens: canvas #F4F1EA, surface #EBE6DC, card #FAF8F3, card-strong #FDFCF9; ink #1C1B18, ink-2 #4F4C45, ink-3 #6B675E, muted #8A857A (decorative only); lines = ink @ 6/10/22%; accent #C8401A, accent-text #A33412, accent-deep #7E2A0F, accent-soft = accent @ 10%, accent-on-ink #FF8A5C; success #1F6F4A, warning #8F5A0A, error #B3261E; primary button ink→#000 on hover with #F6F3EC text; focus ring 3px accent @ 90%. Shadows warm (rgb 60 48 30) and diffuse; no surface gradients; one radial accent wash per page max. Typography: serif display with one italic word, Inter body ≥ 16 px, mono uppercase labels. Layering by tone (surface < canvas < card), not by shadow. Layout: ruled rows over card grids; one dark ink panel per page. Every state must be readable without colour (icon + word). Meet WCAG 2.2 AA: text ≥ 4.5:1, large ≥ 3:1, UI ≥ 3:1. Keep the existing dark Ink theme with identical token roles. Do not change backend/API.

---

## 10. Where the current build stands vs this brief
The current `src/styles/tokens.css` Paper theme is already this family (canvas #F2EEE5, ink #1A1917, accent #CC3C18). This research **confirms the direction** and refines it: slightly lighter/cleaner canvas (#F4F1EA), one extra visible surface step for layering, `accent-text` for small accent copy (6.1:1 instead of 4.3:1), a decorative-only `muted` tier, and stricter accent budgeting per screen.
