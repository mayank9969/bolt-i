"""
VEYRA API adapter
=====================

A thin HTTP layer that exposes the EXISTING Python quiz engine
(`quiz.app/quiz.py`) to the web frontend.

The engine is imported *unmodified*.  Everything that matters comes from it:

  * question bank + randomisation  -> Question_bank / Quiz.select_questions
  * answer validation              -> Quiz.rules_to_check_answer
  * marks per question             -> Quiz.get_marks / Quiz.get_total_marks
  * history persistence            -> Quiz.save_history  (writes history.json)

Security notes
  * Correct answers are NEVER sent to the browser before submission.
  * Every quiz runs inside a short-lived, single-use server session, so
    scoring can only be done server-side against the real answers.
  * All request bodies are validated and bounded.

Run:  python3 api/server.py            (serves http://0.0.0.0:5000)
"""

from __future__ import annotations

import builtins
import contextlib
import importlib.util
import io
import os
import secrets
import sys
import threading
import time
from pathlib import Path

from flask import Flask, abort, jsonify, request, send_from_directory
from flask_cors import CORS

ROOT_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = ROOT_DIR / "quiz.app"
BACKEND_FILE = BACKEND_DIR / "quiz.py"
DIST_DIR = ROOT_DIR / "dist"

# The engine reads/writes questions.json + history.json relative to the CWD.
os.chdir(BACKEND_DIR)


# ─────────────────────────────────────────────────────────────────────────────
#  Import the untouched engine.
#  quiz.py launches its interactive main menu at import time; we answer "3"
#  (Exit) to every prompt so the import completes without touching the code.
# ─────────────────────────────────────────────────────────────────────────────
def _load_engine():
    real_input = builtins.input
    builtins.input = lambda *_args, **_kwargs: "3"
    try:
        spec = importlib.util.spec_from_file_location("quiz_engine", BACKEND_FILE)
        module = importlib.util.module_from_spec(spec)
        with contextlib.redirect_stdout(io.StringIO()):
            spec.loader.exec_module(module)  # type: ignore[union-attr]
    finally:
        builtins.input = real_input
    return module


engine = _load_engine()
Quiz = engine.Quiz
question_bank = engine.question_bank  # already populated by quiz.py itself


def _bank():
    """Live view of the engine's question bank {category: {difficulty: [Question]}}."""
    return question_bank.questions


# ─────────────────────────────────────────────────────────────────────────────
#  Sessions (in-memory, single use, expire after 2h)
# ─────────────────────────────────────────────────────────────────────────────
SESSION_TTL = 2 * 60 * 60
MAX_QUESTIONS_PER_QUIZ = 50
_sessions: dict[str, dict] = {}
_lock = threading.Lock()


def _purge_sessions() -> None:
    now = time.time()
    for sid in [s for s, v in _sessions.items() if now - v["created"] > SESSION_TTL]:
        _sessions.pop(sid, None)


# ─────────────────────────────────────────────────────────────────────────────
#  Helpers
# ─────────────────────────────────────────────────────────────────────────────
def _public_question(q, index: int) -> dict:
    """Serialise a Question for the client — WITHOUT the answer."""
    return {
        "id": index,
        "question": q.question,
        "category": q.category,
        "difficulty": q.difficulty,
        "question_type": q.question_type,
        "options": q.options or None,
    }


def _quiet(fn, *args, **kwargs):
    """Call an engine method while swallowing its CLI print() output."""
    with contextlib.redirect_stdout(io.StringIO()):
        return fn(*args, **kwargs)


def _pick_questions(category: str, difficulty: str, count: int):
    """
    Uses the engine's own retrieval + sampling.
      * exact category/difficulty  -> Quiz.select_questions (unchanged logic)
      * "all" / "mixed"            -> composition of the same retrieval call,
                                      sampled with the same random.sample rule
    """
    bank = _bank()
    categories = list(bank.keys()) if category == "all" else [category]

    if category != "all" and difficulty != "mixed":
        picker = Quiz(question_bank)
        _quiet(picker.select_questions, category, difficulty, count)
        return list(picker.current_questions or [])

    pool = []
    for cat in categories:
        diffs = list(bank[cat].keys()) if difficulty == "mixed" else [difficulty]
        for diff in diffs:
            found = _quiet(question_bank.retiriving_questions, cat, diff)
            if found:
                pool.extend(found)

    if not pool:
        return []
    return engine.random.sample(pool, min(count, len(pool)))


# ─────────────────────────────────────────────────────────────────────────────
#  App
# ─────────────────────────────────────────────────────────────────────────────
app = Flask(__name__, static_folder=None)
app.config["JSON_SORT_KEYS"] = False
app.config["MAX_CONTENT_LENGTH"] = 64 * 1024

_allowed = os.environ.get("ALLOWED_ORIGINS", "*")
CORS(
    app,
    resources={r"/api/*": {"origins": "*" if _allowed == "*" else [o.strip() for o in _allowed.split(",")]}},
    methods=["GET", "POST", "OPTIONS"],
)


@app.after_request
def _security_headers(resp):
    resp.headers["X-Content-Type-Options"] = "nosniff"
    resp.headers["Referrer-Policy"] = "same-origin"
    resp.headers["Cache-Control"] = "no-store"
    return resp


@app.get("/api/health")
def health():
    return jsonify({"status": "ok", "engine": BACKEND_FILE.name})


@app.get("/api/categories")
def categories():
    bank = _bank()
    payload = [
        {
            "id": cat,
            "difficulties": {diff: len(items) for diff, items in bank[cat].items()},
        }
        for cat in bank
    ]
    total = sum(len(items) for cat in bank.values() for items in cat.values())
    return jsonify({"categories": payload, "total_questions": total})


@app.post("/api/quiz/start")
def quiz_start():
    body = request.get_json(silent=True) or {}
    category = str(body.get("category", "")).strip().lower()
    difficulty = str(body.get("difficulty", "")).strip().lower()
    count = body.get("count", 0)

    bank = _bank()
    if category != "all" and category not in bank:
        return jsonify({"error": "Unknown category."}), 400
    valid_diffs = {d for c in bank.values() for d in c.keys()}
    if difficulty != "mixed" and difficulty not in valid_diffs:
        return jsonify({"error": "Unknown difficulty."}), 400
    if not isinstance(count, int) or isinstance(count, bool) or count < 1 or count > MAX_QUESTIONS_PER_QUIZ:
        return jsonify({"error": f"Question count must be between 1 and {MAX_QUESTIONS_PER_QUIZ}."}), 400

    selected = _pick_questions(category, difficulty, count)
    if not selected:
        return jsonify({"error": "There are no questions in this category and difficulty."}), 404

    session_id = secrets.token_urlsafe(24)
    with _lock:
        _purge_sessions()
        _sessions[session_id] = {
            "created": time.time(),
            "category": category,
            "difficulty": difficulty,
            "questions": selected,
        }

    return jsonify(
        {
            "session_id": session_id,
            "category": category,
            "difficulty": difficulty,
            "questions": [_public_question(q, i) for i, q in enumerate(selected)],
        }
    )


@app.post("/api/quiz/submit")
def quiz_submit():
    body = request.get_json(silent=True) or {}
    session_id = str(body.get("session_id", ""))
    answers = body.get("answers")

    with _lock:
        _purge_sessions()
        session = _sessions.pop(session_id, None)  # single use

    if session is None:
        return jsonify({"error": "This quiz session has expired or was already submitted."}), 404
    questions = session["questions"]
    if not isinstance(answers, list) or len(answers) != len(questions):
        return jsonify({"error": "Answers do not match the quiz."}), 400

    # Fresh engine instance per submission -> same scoring code as the CLI.
    q = Quiz(question_bank)
    q.current_questions = questions
    q.category = session["category"]
    q.difficulty = session["difficulty"]
    q.score = 0

    correct = wrong = 0
    review = []
    for question, raw in zip(questions, answers):
        raw = "" if raw is None else str(raw)
        if question.question_type == "mcq":
            user_answer = raw.upper().strip()
        else:
            user_answer = raw.strip()

        is_correct = bool(q.rules_to_check_answer(question, user_answer))
        if is_correct:
            q.score += q.get_marks(question)
            correct += 1
        else:
            wrong += 1

        review.append(
            {
                "question": question.question,
                "question_type": question.question_type,
                "options": question.options or None,
                "difficulty": question.difficulty,
                "category": question.category,
                "marks": q.get_marks(question),
                "user_answer": user_answer,
                "correct_answer": question.answer,
                "is_correct": is_correct,
            }
        )

    total_marks = q.get_total_marks()
    percentage = (q.score / total_marks) * 100 if total_marks else 0.0

    _quiet(
        q.save_history,
        q.category,
        q.difficulty,
        len(questions),
        correct,
        wrong,
        total_marks,
        percentage,
    )

    return jsonify(
        {
            "category": q.category,
            "difficulty": q.difficulty,
            "total_questions": len(questions),
            "correct_answers": correct,
            "wrong_answers": wrong,
            "score": q.score,
            "total_marks": total_marks,
            "percentage": percentage,
            "review": review,
        }
    )


@app.get("/api/history")
def history():
    history_file = BACKEND_DIR / "history.json"
    if not history_file.exists():
        return jsonify({"history": []})
    with open(history_file, "r") as f:
        data = engine.json.load(f)
    entries = [dict(entry, attempt=i + 1) for i, entry in enumerate(data)]
    return jsonify({"history": entries})


# ─────────────────────────────────────────────────────────────────────────────
#  Production: serve the built frontend (vite build -> dist/) if present.
# ─────────────────────────────────────────────────────────────────────────────
@app.get("/", defaults={"path": ""})
@app.get("/<path:path>")
def spa(path: str):
    if path.startswith("api/"):
        abort(404)
    if not DIST_DIR.exists():
        return (
            "VEYRA API is running. Build the frontend with `npm run build` "
            "to serve it from here, or run `npm run dev` for development.",
            200,
        )
    candidate = DIST_DIR / path
    if path and candidate.is_file():
        return send_from_directory(DIST_DIR, path)
    return send_from_directory(DIST_DIR, "index.html")


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "5000"))
    app.run(host="0.0.0.0", port=port, debug=False)
