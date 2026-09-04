# NEXUSQuiz

**Test your knowledge. Build your mastery.**

A premium quiz platform for Maths and Python, powered by the original Python quiz engine.

```
quiz.app/        ← Python quiz engine (UNCHANGED — source of truth)
  quiz.py          question bank, randomisation, scoring, history
  questions.json   real question data
  history.json     every attempt ever taken
api/server.py    ← thin Flask adapter that exposes the engine over HTTP
src/             ← React + Vite + Tailwind + Framer Motion + Three.js frontend
```

## Run it (one command)

Requires **Python 3.10+** and **Node.js 18+**.

| Windows | macOS / Linux |
| --- | --- |
| double-click **`start.bat`** | `./start.sh` |

Then open **http://localhost:5000** — that single server hosts both the website and the API.

<details>
<summary>Manual / development mode (hot reload)</summary>

```bash
pip install -r requirements.txt
python3 api/server.py            # API on http://localhost:5000

npm install
npm run dev                      # UI on http://localhost:5173 (proxies /api → :5000)
```
</details>

## API (adapter over the engine)

| Method | Path                | Notes                                                  |
| ------ | ------------------- | ------------------------------------------------------ |
| GET    | `/api/categories`   | Real categories + per-difficulty counts                |
| POST   | `/api/quiz/start`   | `{category, difficulty, count}` → session + questions **without answers** |
| POST   | `/api/quiz/submit`  | `{session_id, answers[]}` → scored by `quiz.py`, saved to `history.json` |
| GET    | `/api/history`      | Contents of `history.json`                             |

Scoring, answer validation, marks and randomisation all come from `quiz.py`.
Sessions are single-use and expire; correct answers never reach the browser before submission.

## Visual system & themes

All colours come from design tokens in `src/styles/tokens.css` (no hex values in components).
Two complete themes ship — **Paper** (default; warm ivory + ink + vermilion) and **Ink** (deep
charcoal + bone + ember) — switchable from the header; the choice is remembered in `localStorage`
and the system preference is respected on first visit. The light default is evidence-based
(positive-polarity reading research); see [`docs/DESIGN-SYSTEM.md`](docs/DESIGN-SYSTEM.md) for
the research, the 3D reference review, the token contract and the motion system.

### The Nexus (3D identity)

One persistent WebGL set-piece — a knowledge lattice of ceramic nodes joined by metal struts around
a dark core — lives in a single canvas under every page and changes state per route:

| Page    | Mode        | What drives it                                  |
| ------- | ----------- | ----------------------------------------------- |
| Home    | establish   | scroll moves the camera; cursor tilts the object |
| Setup   | configure   | topic → sector focus, difficulty → density, count → lit fraction |
| Quiz    | quiet       | dims to a corner so the question dominates      |
| Result  | resolve     | score → fraction of nodes lit                   |
| History | archive     | number of attempts → nodes lit                  |

Quality tiers (high / medium / low) are chosen from device signals; devices without WebGL or with
`prefers-reduced-motion` get a static SVG lattice instead.
