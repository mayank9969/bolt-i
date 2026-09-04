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
Five complete themes ship — **Obsidian** (default), Editorial, Oxblood, Acid, Mono — switchable from
the footer; the choice is remembered in `localStorage`. Research notes, principles and the token
contract are in [`docs/DESIGN-SYSTEM.md`](docs/DESIGN-SYSTEM.md).
