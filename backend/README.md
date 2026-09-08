# VEYRA API — Render backend

The production backend for the VEYRA quiz website. It is a small Flask
service that wraps the **original Python quiz engine** (`engine/quiz.py`,
imported unmodified) and exposes the exact HTTP contract the built VEYRA
frontend already calls. Questions are served without answers, every answer is
scored on the server, and each attempt is appended to `history.json`.

```
backend/
├── app.py               Flask application  →  WSGI object `app`
├── gunicorn.conf.py     Production server settings (1 worker × threads, PORT)
├── Procfile             web: gunicorn app:app -c gunicorn.conf.py
├── requirements.txt     flask, flask-cors, gunicorn (pinned)
├── .python-version      3.11.11  (Render reads this)
├── render.yaml          Optional Render Blueprint (same values as below)
├── .env.example         Documented environment variables (no secrets)
├── .gitignore
├── questions.json       The question bank — 15 categories × 100 = 1,500 questions
├── history.json         Attempt log (starts empty: `[]`; created if missing)
├── engine/
│   └── quiz.py          The original quiz engine (unchanged)
└── tests/
    ├── __init__.py
    └── test_api.py      14 contract/security tests (python -m unittest)
```

---

## 1. What the backend does

| Concern | Where it is decided |
|---|---|
| Loading `questions.json` | `engine/quiz.py` → `Question_bank.load_questions()` |
| Random question selection | `engine/quiz.py` → `Quiz.select_questions()` / `random.sample` |
| Answer checking | `engine/quiz.py` → `Quiz.rules_to_check_answer()` |
| Marks (easy 2 · medium 4 · hard 6; MCQ = half) | `engine/quiz.py` → `Quiz.get_marks()` |
| Writing `history.json` | `engine/quiz.py` → `Quiz.save_history()` |
| HTTP, sessions, validation, CORS, security headers | `app.py` |

Quiz flow: the browser calls `POST /api/quiz/start`, receives a
`session_id` and the questions **without answers**; when the user finishes it
calls `POST /api/quiz/submit` with the `session_id` and the list of answers.
The server looks up the real questions for that session, scores them, saves
history, deletes the session (single use) and returns the result with a
per-question review. Sessions expire after 2 hours.

---

## 2. Local setup

**Python version:** 3.11 (tested on 3.11.x; any 3.10+ works).

```bash
cd backend
python -m venv .venv
# Windows:  .venv\Scripts\activate
# macOS/Linux:  source .venv/bin/activate
pip install -r requirements.txt
```

**Run locally (development):**

```bash
# Windows PowerShell
$env:ALLOWED_ORIGINS="https://veyra.rf.gd,http://localhost:5173"; python app.py
# macOS / Linux
ALLOWED_ORIGINS=https://veyra.rf.gd,http://localhost:5173 python app.py
```

→ `http://localhost:5000/api/health`

**Run locally exactly like production (gunicorn, macOS/Linux):**

```bash
PORT=5000 gunicorn app:app -c gunicorn.conf.py
```

**Run the tests:**

```bash
python -m unittest -v
```

The tests use a temporary data directory, so your `history.json` is untouched.

---

## 3. API endpoints

All responses are JSON. All errors are `{"error": "<safe message>"}` with the
matching HTTP status. Bodies over 64 KB are rejected (413).

### `GET /api/health`
```json
{ "status": "ok", "categories": 15, "questions": 1500 }
```

### `GET /api/categories`
```json
{
  "categories": [
    { "id": "maths",   "difficulties": { "easy": 34, "medium": 33, "hard": 33 } },
    { "id": "science", "difficulties": { "easy": 34, "medium": 33, "hard": 33 } },
    "… 13 more …"
  ],
  "total_questions": 1500
}
```
Category ids: `maths`, `science`, `technology`, `python`, `computer_science`,
`physics`, `chemistry`, `biology`, `astronomy_space`, `geography`, `history`,
`economics_business`, `logic_reasoning`, `english_language`, `general_knowledge`.
The frontend maps these ids to display names itself.

### `POST /api/quiz/start`
Request:
```json
{ "category": "physics", "difficulty": "medium", "count": 10 }
```
* `category` — any id above, or `"all"` for every category
* `difficulty` — `"easy" | "medium" | "hard" | "mixed"`
* `count` — integer 1–50

Response `200`:
```json
{
  "session_id": "k3P9…",
  "category": "physics",
  "difficulty": "medium",
  "questions": [
    {
      "id": 0,
      "question": "What is the SI unit of energy?",
      "category": "physics",
      "difficulty": "medium",
      "question_type": "mcq",
      "options": { "A": "Newton", "B": "Joule", "C": "Volt", "D": "Tesla" }
    }
  ]
}
```
Errors: `400` unknown category / difficulty / bad count / non-JSON body,
`404` no questions for that combination.

### `POST /api/quiz/submit`
Request (answers in the same order as the questions; MCQ answers are the
option letter):
```json
{ "session_id": "k3P9…", "answers": ["B", "A", "D"] }
```
Response `200`:
```json
{
  "category": "physics",
  "difficulty": "medium",
  "total_questions": 3,
  "correct_answers": 2,
  "wrong_answers": 1,
  "score": 4.0,
  "total_marks": 6.0,
  "percentage": 66.66666666666667,
  "review": [
    {
      "question": "What is the SI unit of energy?",
      "question_type": "mcq",
      "options": { "A": "Newton", "B": "Joule", "C": "Volt", "D": "Tesla" },
      "difficulty": "medium",
      "category": "physics",
      "marks": 2.0,
      "user_answer": "B",
      "correct_answer": "B",
      "is_correct": true
    }
  ]
}
```
Errors: `404` session unknown / expired / already submitted,
`400` answers list missing or wrong length. Any `score` sent by the client
is ignored — scoring is server-side only.

### `GET /api/history`
```json
{
  "history": [
    {
      "attempt": 1,
      "category": "physics",
      "difficulty": "medium",
      "total_questions": 3,
      "correct_answers": 2,
      "wrong_answers": 1,
      "score": 4.0,
      "total_marks": 6.0,
      "percentage": 66.66666666666667
    }
  ]
}
```

### `GET /`
`{ "service": "VEYRA API", "status": "ok", "health": "/api/health" }`

---

## 4. Environment variables

| Variable | Default | Used for |
|---|---|---|
| `PORT` | `10000` (gunicorn) / `5000` (`python app.py`) | Port to listen on. **Render sets this automatically — do not set it there.** Read in `gunicorn.conf.py` and `app.py`. |
| `ALLOWED_ORIGINS` | `https://veyra.rf.gd` | Comma-separated browser origins allowed by CORS for `/api/*`. Read in `app.py`. |
| `HISTORY_DIR` | the `backend/` folder | Directory where `history.json` is written (a copy of `questions.json` is placed there too). Set to a persistent-disk mount on Render (see §7). Read in `app.py`. |
| `SESSION_TTL_SECONDS` | `7200` | Lifetime of an unfinished quiz session. Read in `app.py`. |
| `WEB_THREADS` | `8` | Threads in the single gunicorn worker. Read in `gunicorn.conf.py`. |
| `LOG_LEVEL` | `INFO` | Logging verbosity. Read in `app.py` and `gunicorn.conf.py`. |
| `PYTHON_VERSION` | — | Render-only: pins the interpreter (`3.11.11`). `.python-version` does the same if you prefer the file. |

No API keys, secret keys or credentials are needed; the service has no login.
`.env.example` documents the same list. The app does **not** auto-load a
`.env` file — export the variables in your shell or set them in Render.

---

## 5. CORS

`flask-cors` is limited to the `/api/*` routes, methods `GET, POST, OPTIONS`,
headers `Content-Type, Accept`, and **only** the origins in `ALLOWED_ORIGINS`.
The production default is the VEYRA site:

```
ALLOWED_ORIGINS=https://veyra.rf.gd
```

For local frontend development add the Vite dev origin **on your machine
only**:

```
ALLOWED_ORIGINS=https://veyra.rf.gd,http://localhost:5173
```

Never use `*` in production. Requests from any other origin receive no
`Access-Control-Allow-Origin` header and the browser blocks them.

Additional response headers on every reply: `X-Content-Type-Options: nosniff`,
`X-Frame-Options: DENY`, `Referrer-Policy: same-origin`, `Cache-Control: no-store`.

---

## 6. Deploy to Render

1. Put the **contents of this `backend/` folder at the root of a Git
   repository** (or keep it as a sub-folder and set *Root Directory* to
   `backend` in Render). Push to GitHub.
2. Render dashboard → **New +** → **Web Service** → connect the repository.
3. Settings:

   | Field | Value |
   |---|---|
   | Runtime | **Python 3** |
   | Root Directory | *(blank, or `backend` if it is a sub-folder)* |
   | **Build Command** | `pip install -r requirements.txt` |
   | **Start Command** | `gunicorn app:app -c gunicorn.conf.py` |
   | Health Check Path | `/api/health` |
   | Instance type | Free is enough to start |

4. **Environment** tab → add:

   | Key | Value |
   |---|---|
   | `PYTHON_VERSION` | `3.11.11` |
   | `ALLOWED_ORIGINS` | `https://veyra.rf.gd` |

   (Optional: `WEB_THREADS` = `8`, `HISTORY_DIR` = `/var/data` if you attach a disk — see §7.)

5. Click **Create Web Service**. Render builds, runs the start command, and
   gives you a URL such as `https://veyra-api.onrender.com`.

**Health-check URL:** `https://<your-service>.onrender.com/api/health`
→ `{"status":"ok","categories":15,"questions":1500}`

Alternatively, choose **New + → Blueprint** and point Render at this repo;
`render.yaml` contains the same configuration.

Notes
* `gunicorn` binds to `0.0.0.0:$PORT` — Render's injected port — via
  `gunicorn.conf.py`. Flask's debug server is never used in production.
* The service runs **one** gunicorn worker with threads because quiz sessions
  are kept in memory (a second worker would not see the first worker's
  sessions). Do not raise `workers`; scale threads with `WEB_THREADS` instead.
* On the **Free** plan the service sleeps after ~15 minutes of inactivity; the
  first request afterwards takes ~30–60 s while it wakes up.

---

## 7. Persistence — read this before going live

`history.json` is written with the engine's original JSON logic, serialised by
a thread lock plus an advisory file lock, so concurrent submissions on the
single worker cannot interleave writes.

**Render limitation:** a Web Service's filesystem is *ephemeral*. Every
deploy, restart, or free-tier wake-up starts from the repository contents
again, so **history written to the default location is lost** at that point
(the question bank is unaffected — it ships with the code).

Safest compatible options, in order:

1. **Attach a Render Persistent Disk** (paid instance types) mounted at
   `/var/data`, and set `HISTORY_DIR=/var/data`. The app creates
   `history.json` there on first start and copies `questions.json` next to it;
   history then survives deploys and restarts. This keeps the existing
   JSON-file storage exactly as it is.
2. **Accept ephemeral history** (free tier). Everything else works; the
   History page simply resets whenever Render recycles the instance.

The storage system was deliberately **not** replaced with a database: the
engine's `save_history()` is the source of truth for the history format, and a
database would change that contract.

---

## 8. Connect the VEYRA frontend to this backend

The frontend calls **relative** `/api/*` URLs by default (it expects the API on
the same host). To use the Render backend from `https://veyra.rf.gd`, build the
frontend with the API base URL set:

```bash
# in the frontend project (repository root), before `npm run build`
# Windows PowerShell
$env:VITE_API_BASE_URL="https://backend-fc24.onrender.com/api"; npm run build
# macOS / Linux
VITE_API_BASE_URL=https://backend-fc24.onrender.com/api npm run build
```

Then upload the generated `dist/` folder to `veyra.rf.gd` as before. With the
variable unset the frontend keeps calling `/api` on its own origin, so the
local `start.bat` flow is unchanged.

Quick verification from the browser console on `https://veyra.rf.gd`:

```js
fetch('https://backend-fc24.onrender.com/api/health').then(r => r.json()).then(console.log)
```

---

## 9. Security summary

* Answers are never sent to the browser before submission; scores are computed
  server-side from an in-memory, single-use session (`secrets.token_urlsafe`).
* Category/difficulty are validated against the loaded bank (no
  user-controlled paths are ever opened → no path traversal); `count` is an
  integer 1–50; `answers` must be a list of the exact length.
* Malformed/oversized bodies, unknown routes and unexpected exceptions all
  return generic JSON errors — no stack traces, file paths or environment data.
* CORS restricted to `ALLOWED_ORIGINS`; security headers on every response.
* No secrets, credentials or debug mode anywhere in the project.
