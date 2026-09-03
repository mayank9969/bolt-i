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

## Run locally

```bash
# 1. Python API (imports quiz.py as-is)
pip install flask flask-cors
python3 api/server.py            # http://localhost:5000

# 2. Frontend (dev server proxies /api → :5000)
npm install
npm run dev                      # http://localhost:5173
```

Production: `npm run build` → the Flask adapter serves `dist/` from `/`.

## API (adapter over the engine)

| Method | Path                | Notes                                                  |
| ------ | ------------------- | ------------------------------------------------------ |
| GET    | `/api/categories`   | Real categories + per-difficulty counts                |
| POST   | `/api/quiz/start`   | `{category, difficulty, count}` → session + questions **without answers** |
| POST   | `/api/quiz/submit`  | `{session_id, answers[]}` → scored by `quiz.py`, saved to `history.json` |
| GET    | `/api/history`      | Contents of `history.json`                             |

Scoring, answer validation, marks and randomisation all come from `quiz.py`.
Sessions are single-use and expire; correct answers never reach the browser before submission.
