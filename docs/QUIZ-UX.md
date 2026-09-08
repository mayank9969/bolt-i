# VEYRA — Quiz answering UX

Scope: the question-answering screen (`src/pages/Quiz.tsx`), its styles
(`.choice*`, `.progress-seg*`, `.quiz-paper`, `.quiz-controls` in
`src/styles/globals.css`), and two small readability fixes on the Result
review list. Backend, API, question data, scoring, typography tokens, theme
tokens and the 3D scene are untouched.

## Walk-through as a user

| Step             | What the user sees / can do                                                                                         |
| ---------------- | ------------------------------------------------------------------------------------------------------------------- |
| Where am I       | Sticky strip: **Question 3 of 10**, "All Topics · Easy · 1 of 10 answered", and one segment per question. Filled = answered, ringed = current. Every segment is a button (20 px tall hit area, 4 px visual). |
| Read             | One quiet context line (*Python · Easy · Choose one*), then the question at the `t-question` role, wrapping naturally up to 38 ch. No badges, no border-left marker, no chips. |
| Inspect options  | A `radiogroup` of full-width rows: key badge (A–D) · answer text · empty ring. The ring at rest says "this is selectable"; the row is not a card (no shadow, no lift on hover). Long options wrap (`overflow-wrap: anywhere`), never shrink. |
| Choose           | Click/tap, press **A–D**, or **↑/↓**. Selected = soft accent fill, accent border, filled key badge, filled check in the ring, and the text goes medium weight — four cues, never colour alone. `aria-checked` + sr-only "Selected". |
| Can I change it? | Status line under the answers: *"Saved. You can change any answer until you finish."* Re-clicking / pressing another key just moves the selection. |
| Continue         | Same primary button, three honest labels: **Next** (answered, ink button), **Skip** (unanswered, outlined so it's clearly the lesser action), **Finish quiz** on the last question. Enter only continues when there is an answer, so it can't skip by accident. ←/→ move between questions. |
| Understand result| Review list on the Result page now has the same paper wash as the quiz column so the network never sits under answers, and an unanswered question reads *"Not answered"* instead of an empty struck-through cell. |

## States

| State           | Treatment                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------- |
| Rest            | card background, `line-strong` border, empty ring                                                  |
| Hover           | border darkens to `text-3`, background lifts one tone, ring border darkens — no transform          |
| Active (press)  | background drops to `elevated`                                                                     |
| Focus-visible   | 2 px accent outline, 2 px offset (the global focus treatment; unchanged)                           |
| Selected        | `selected-soft` fill, accent border + 1 px inset, filled key, filled check, medium text            |
| Disabled        | during scoring only: transparent background, `line` border, `disabled-text`, not-allowed cursor    |
| Correct / wrong | kept for review contexts (`data-state`) with success / error tokens                                |

Roving focus: the selected option (or the first, if none) is the only option
in the Tab order, so Tab moves *question → options → Previous → Next*, not
through four buttons.

## Motion

Question changes slide 20 px and fade in 220 ms. Under
`prefers-reduced-motion` the slide is 0 and the duration 0. Option rows no
longer stagger in one by one — the user is here to read them, not watch them
arrive. State changes on a row transition in 150 ms (colour only).

## Empty / error / loading

- **No questions in the session** → a card: "No questions came back for this selection. Try a different region or tier." + Back to setup.
- **Scoring** → button reads *Scoring…* with a spinner, `aria-busy`, all controls disabled, status line says answers are being sent.
- **Scoring failed** → alert with the server message and a plain recovery: nothing was lost, check the server window is open, press Finish again. Answers stay in state.
- **Last question, something unanswered** → warning-toned status line with the count; Finish still works (the server marks blanks wrong, as before).

## Mobile

Single column, 5 px gutters, 56 px minimum row height, primary and Previous
buttons side-by-side above the fold on a 390 px viewport, `enterKeyHint`
set to *next* / *done* on the typed-answer field, `autoCapitalize="off"` so
the phone keyboard doesn't capitalise Python identifiers.
