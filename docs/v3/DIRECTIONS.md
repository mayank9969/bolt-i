# VEYRA v3 — visual directions (proposal, not yet built)

Context: the new engine (`mayank9969/newbackend/new.py`) adds adaptive selection, a
daily challenge with streaks, spaced-repetition review dates, a 30 s timer, retry-once,
confidence + mistake-pattern reflection, partial credit, explanations, a progress
dashboard by category/difficulty/confidence/skill, focus-skill practice, Concept Studio
lessons and "Today's Take" writing prompts. History entries gain `date`, `mode` and a
full `answer_review`.

All three directions keep: the VEYRA name, the V mark, light mode as default, WCAG AA
(all text ≥ 4.5:1 on ground), one visual system whose state changes per page, no
blue/purple SaaS palette, no neon/glass/noise, no oversized shadows.

Fonts are all SIL OFL and self-hostable from npm (`@fontsource/*` 5.3.0, verified on
registry.npmjs.org): Fraunces, Public Sans, Geist Mono, Bricolage Grotesque, Manrope,
JetBrains Mono, Newsreader, DM Sans, IBM Plex Mono.

| | A · Ledger | B · Instrument | C · Field |
|---|---|---|---|
| Idea | Study almanac: attempts are entries, reviews are dates | Instrument panel for memory: dials and arcs | Garden: revisited knowledge grows, neglected fades |
| Ground / text | #F4EFE6 / #1F2430 (ink navy) | #EDEFF1 / #15191F (graphite) | #F1F3EE / #1B241E (moss black) |
| Accent | brick #A3432B (5.4:1) | saffron #A6551A (4.6:1) | clay #B04E2A (4.7:1) |
| Retained hue | deep teal #2F5D62 | none (graphite) | leaf #3F6B45 |
| Display / UI / mono | Fraunces / Public Sans / Geist Mono | Bricolage Grotesque / Manrope / JetBrains Mono | Newsreader / DM Sans / IBM Plex Mono |
| Hero object | review calendar | timer arc + recall dials | canopy network |
| Distance from current VEYRA | far | far | near (evolution) |

Boards: `direction-A.png`, `direction-B.png`, `direction-C.png` (rendered with the real
fonts and tokens; mocks show Home "Today" and a quiz question with timer + confidence).

## Page map (same for every direction)

- **Home · Today** — daily challenge card + streak, due-for-review count, retention by
  region, "continue" into the network.
- **Setup** — region/tier/size as now, plus modes: Standard, Daily, Missed, Smart review,
  Focus skill.
- **Quiz** — timer arc, retry-once on wrong, confidence switch, mistake pattern after a
  miss, explanation + guidance on feedback.
- **Result** — partial credit, correct-on-retry, next review dates per question.
- **Progress** — by category, difficulty, confidence, mistake pattern, skill; streak.
- **History** — dated, filter by mode, open any attempt's review.
- **Learn** (Concept Studio) — lesson list by category → analogy / idea / example /
  check; progress saved.
- **Take** (Today's Take) — daily prompt, response, scored feedback, past takes.

Reference check: Awwwards HM "Learning by Design" (Greydient Lab, 2 Apr 2025) listed a
#2172B9 / #F05227 palette — noted and deliberately *not* used (blue SaaS). No other
verified reference influenced these palettes.
