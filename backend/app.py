"""
VEYRA backend — standalone Flask API for Render
================================================

This is the production API for the VEYRA website.  It exposes the ORIGINAL
Python quiz engine (``engine/quiz.py``, imported unmodified) over HTTP with the
exact contract the built frontend already uses:

    GET  /api/health
    GET  /api/categories
    POST /api/quiz/start     {category, difficulty, count}
    POST /api/quiz/submit    {session_id, answers[]}
    GET  /api/history

Everything that decides a result comes from the engine:
  * question bank + randomisation  -> Question_bank / Quiz.select_questions
  * answer validation              -> Quiz.rules_to_check_answer
  * marks per question             -> Quiz.get_marks / Quiz.get_total_marks
  * history persistence            -> Quiz.save_history  (history.json)

Security model
  * Correct answers are never sent to the browser before submission.
  * Each quiz is a short-lived, single-use, server-side session; the client
    only ever sends its answers, never a score.
  * All request bodies are validated and size-bounded; errors are generic.
  * CORS is restricted to ALLOWED_ORIGINS (default: the VEYRA frontend).

Deployment
  * WSGI object: ``app``  ->  ``gunicorn app:app`` (see gunicorn.conf.py).
  * Sessions are held in memory, so the service runs ONE gunicorn worker with
    threads (configured in gunicorn.conf.py).  Do not raise ``workers``.
"""

from __future__ import annotations

import builtins
import contextlib
import importlib.util
import io
import json
import logging
import os
import secrets
import shutil
import threading
import time
from pathlib import Path

from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.exceptions import HTTPException

try:  # POSIX only (Render/Linux). Harmless no-op on Windows.
    import fcntl
except ImportError:  # pragma: no cover
    fcntl = None  # type: ignore[assignment]

# ─────────────────────────────────────────────────────────────────────────────
#  Paths & configuration (environment-driven, no secrets required)
# ─────────────────────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent
ENGINE_FILE = BASE_DIR / "engine" / "quiz.py"
BUNDLED_QUESTIONS = BASE_DIR / "questions.json"

# Where the engine reads questions.json and writes history.json.
# Default: the backend folder itself.  On Render, point HISTORY_DIR at a
# persistent disk mount (e.g. /var/data) to keep history across deploys.
DATA_DIR = Path(os.environ.get("HISTORY_DIR", str(BASE_DIR))).resolve()

SESSION_TTL = int(os.environ.get("SESSION_TTL_SECONDS", str(2 * 60 * 60)))  # 2 hours
MAX_QUESTIONS_PER_QUIZ = 50
MAX_SESSIONS = 5000  # hard cap on concurrent unfinished quizzes
MAX_BODY_BYTES = 64 * 1024
DEFAULT_ORIGINS = "https://veyra.rf.gd"

logging.basicConfig(level=os.environ.get("LOG_LEVEL", "INFO"))
log = logging.getLogger("veyra")


def _prepare_data_dir() -> None:
    """Make sure the engine's working directory has the bank and a history file."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    questions = DATA_DIR / "questions.json"
    # The bank ships with the code; always refresh the copy in DATA_DIR so a new
    # deploy with an updated bank takes effect even on a persistent disk.
    if questions.resolve() != BUNDLED_QUESTIONS.resolve():
        shutil.copyfile(BUNDLED_QUESTIONS, questions)
    history = DATA_DIR / "history.json"
    if not history.exists():
        history.write_text("[]", encoding="utf-8")


_prepare_data_dir()
# The engine reads/writes questions.json + history.json relative to the CWD.
os.chdir(DATA_DIR)


# ─────────────────────────────────────────────────────────────────────────────
#  Import the untouched engine.
#  quiz.py launches its interactive main menu at import time; we answer "3"
#  (Exit) to every prompt so the import completes without touching the code.
# ─────────────────────────────────────────────────────────────────────────────
def _load_engine():
    real_input = builtins.input
    builtins.input = lambda *_args, **_kwargs: "3"
    try:
        spec = importlib.util.spec_from_file_location("quiz_engine", ENGINE_FILE)
        module = importlib.util.module_from_spec(spec)
        with contextlib.redirect_stdout(io.StringIO()):
            spec.loader.exec_module(module)  # type: ignore[union-attr]
    finally:
        builtins.input = real_input
    return module


engine = _load_engine()
Quiz = engine.Quiz
question_bank = engine.question_bank  # populated by quiz.py from questions.json


def _bank():
    """Live view of the engine's question bank {category: {difficulty: [Question]}}."""
    return question_bank.questions


_total = sum(len(v) for c in _bank().values() for v in c.values())
log.info("VEYRA engine loaded: %d categories, %d questions", len(_bank()), _total)


# ─────────────────────────────────────────────────────────────────────────────
#  Sessions (in-memory, single use, expire after SESSION_TTL)
# ─────────────────────────────────────────────────────────────────────────────
_sessions: dict[str, dict] = {}
_session_lock = threading.Lock()
_history_lock = threading.Lock()


def _purge_sessions() -> None:
    now = time.time()
    for sid in [s for s, v in _sessions.items() if now - v["created"] > SESSION_TTL]:
        _sessions.pop(sid, None)
    # Safety valve: never let the table grow without bound.
    if len(_sessions) > MAX_SESSIONS:
        for sid in sorted(_sessions, key=lambda s: _sessions[s]["created"])[: len(_sessions) - MAX_SESSIONS]:
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


@contextlib.contextmanager
def _history_file_lock():
    """
    Serialise history writes.  The threading lock covers the single gunicorn
    worker; the advisory file lock additionally protects against a second
    process (e.g. a stray local run) touching the same history.json.
    """
    with _history_lock:
        lock_path = DATA_DIR / ".history.lock"
        with open(lock_path, "a+") as fh:
            if fcntl is not None:
                fcntl.flock(fh, fcntl.LOCK_EX)
            try:
                yield
            finally:
                if fcntl is not None:
                    fcntl.flock(fh, fcntl.LOCK_UN)


def _read_history() -> list:
    history_file = DATA_DIR / "history.json"
    if not history_file.exists():
        return []
    try:
        with open(history_file, "r", encoding="utf-8") as f:
            data = json.load(f)
    except (OSError, ValueError):
        log.exception("history.json is unreadable; returning empty history")
        return []
    return data if isinstance(data, list) else []


# ─────────────────────────────────────────────────────────────────────────────
#  App
# ─────────────────────────────────────────────────────────────────────────────
app = Flask(__name__, static_folder=None)
app.config["JSON_SORT_KEYS"] = False
app.config["MAX_CONTENT_LENGTH"] = MAX_BODY_BYTES
app.config["DEBUG"] = False

_origins = [o.strip() for o in os.environ.get("ALLOWED_ORIGINS", DEFAULT_ORIGINS).split(",") if o.strip()]
CORS(
    app,
    resources={r"/api/*": {"origins": _origins}},
    methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Accept"],
    max_age=600,
)
log.info("CORS allowed origins: %s", ", ".join(_origins))


@app.after_request
def _security_headers(resp):
    resp.headers["X-Content-Type-Options"] = "nosniff"
    resp.headers["X-Frame-Options"] = "DENY"
    resp.headers["Referrer-Policy"] = "same-origin"
    resp.headers["Cache-Control"] = "no-store"
    return resp


# Every error — including Flask's own 404/405/413 and unexpected exceptions —
# is returned as JSON with a safe, generic message.
@app.errorhandler(HTTPException)
def _http_error(err: HTTPException):
    return jsonify({"error": err.description or err.name}), err.code or 500


@app.errorhandler(Exception)
def _unexpected_error(err: Exception):  # pragma: no cover - defensive
    log.exception("Unhandled error")
    return jsonify({"error": "Internal server error."}), 500


# ─────────────────────────────────────────────────────────────────────────────
#  Routes
# ─────────────────────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return jsonify({"service": "VEYRA API", "status": "ok", "health": "/api/health"})


@app.get("/api/health")
def health():
    bank = _bank()
    return jsonify(
        {
            "status": "ok",
            "categories": len(bank),
            "questions": sum(len(v) for c in bank.values() for v in c.values()),
        }
    )


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
    body = request.get_json(silent=True)
    if not isinstance(body, dict):
        return jsonify({"error": "Request body must be a JSON object."}), 400

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
    with _session_lock:
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
    body = request.get_json(silent=True)
    if not isinstance(body, dict):
        return jsonify({"error": "Request body must be a JSON object."}), 400

    session_id = str(body.get("session_id", ""))
    answers = body.get("answers")

    with _session_lock:
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
        raw = "" if raw is None else str(raw)[:500]
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

    try:
        with _history_file_lock():
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
    except OSError:
        # A read-only or full disk must not lose the user's result.
        log.exception("Could not write history.json")

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
    with _history_file_lock():
        data = _read_history()
    entries = [dict(entry, attempt=i + 1) for i, entry in enumerate(data) if isinstance(entry, dict)]
    return jsonify({"history": entries})


# Local development only.  Production uses gunicorn (see Procfile).
if __name__ == "__main__":
    port = int(os.environ.get("PORT", "5000"))
    app.run(host="0.0.0.0", port=port, debug=False)
