"""
Contract tests for the VEYRA API.

Run from the backend folder:   python -m unittest -v
They exercise the real Flask app + real engine against a temporary copy of the
data, so your history.json is never touched.
"""
from __future__ import annotations

import json
import os
import sys
import tempfile
import unittest
from pathlib import Path

BACKEND = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND))

_TMP = tempfile.mkdtemp(prefix="veyra-test-")
os.environ["HISTORY_DIR"] = _TMP
os.environ["ALLOWED_ORIGINS"] = "https://veyra.rf.gd"

import app as veyra  # noqa: E402  (import after env is set)


class ApiContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = veyra.app.test_client()

    def _json(self, resp):
        self.assertEqual(resp.mimetype, "application/json")
        return json.loads(resp.data)

    # ── health / root ────────────────────────────────────────────────────────
    def test_health(self):
        r = self.client.get("/api/health")
        self.assertEqual(r.status_code, 200)
        body = self._json(r)
        self.assertEqual(body["status"], "ok")
        self.assertEqual(body["categories"], 15)
        self.assertEqual(body["questions"], 1500)

    def test_root_is_json_not_paths(self):
        r = self.client.get("/")
        self.assertEqual(r.status_code, 200)
        self.assertNotIn(str(BACKEND), r.get_data(as_text=True))

    # ── categories ───────────────────────────────────────────────────────────
    def test_categories_shape(self):
        body = self._json(self.client.get("/api/categories"))
        self.assertEqual(body["total_questions"], 1500)
        ids = [c["id"] for c in body["categories"]]
        self.assertEqual(len(ids), 15)
        self.assertIn("maths", ids)
        self.assertIn("python", ids)
        for c in body["categories"]:
            self.assertEqual(sum(c["difficulties"].values()), 100)
            self.assertEqual(set(c["difficulties"]), {"easy", "medium", "hard"})

    # ── start ────────────────────────────────────────────────────────────────
    def test_start_hides_answers(self):
        r = self.client.post("/api/quiz/start", json={"category": "maths", "difficulty": "easy", "count": 5})
        self.assertEqual(r.status_code, 200)
        body = self._json(r)
        self.assertEqual(len(body["questions"]), 5)
        for i, q in enumerate(body["questions"]):
            self.assertEqual(q["id"], i)
            self.assertNotIn("answer", q)
            self.assertNotIn("correct_answer", q)
            self.assertEqual(set(q), {"id", "question", "category", "difficulty", "question_type", "options"})

    def test_start_every_combination(self):
        cats = [c["id"] for c in self._json(self.client.get("/api/categories"))["categories"]] + ["all"]
        for cat in cats:
            for diff in ("easy", "medium", "hard", "mixed"):
                with self.subTest(category=cat, difficulty=diff):
                    r = self.client.post("/api/quiz/start", json={"category": cat, "difficulty": diff, "count": 3})
                    self.assertEqual(r.status_code, 200)
                    self.assertEqual(len(self._json(r)["questions"]), 3)

    def test_start_validation(self):
        bad = [
            ({"category": "nope", "difficulty": "easy", "count": 5}, 400),
            ({"category": "maths", "difficulty": "impossible", "count": 5}, 400),
            ({"category": "maths", "difficulty": "easy", "count": 0}, 400),
            ({"category": "maths", "difficulty": "easy", "count": 51}, 400),
            ({"category": "maths", "difficulty": "easy", "count": "5"}, 400),
            ({"category": "maths", "difficulty": "easy", "count": True}, 400),
            ({"category": "../../etc/passwd", "difficulty": "easy", "count": 5}, 400),
        ]
        for payload, status in bad:
            with self.subTest(payload=payload):
                r = self.client.post("/api/quiz/start", json=payload)
                self.assertEqual(r.status_code, status)
                self.assertIn("error", self._json(r))

    def test_malformed_bodies_are_safe(self):
        r = self.client.post("/api/quiz/start", data="not json", content_type="application/json")
        self.assertEqual(r.status_code, 400)
        r = self.client.post("/api/quiz/start", json=[1, 2, 3])
        self.assertEqual(r.status_code, 400)
        r = self.client.post("/api/quiz/submit", json="x")
        self.assertEqual(r.status_code, 400)
        r = self.client.post("/api/quiz/start", data="x" * (70 * 1024), content_type="application/json")
        self.assertEqual(r.status_code, 413)
        self.assertIn("error", self._json(r))

    def test_unknown_routes_are_json(self):
        r = self.client.get("/api/does-not-exist")
        self.assertEqual(r.status_code, 404)
        self.assertIn("error", self._json(r))
        r = self.client.get("/api/quiz/start")  # wrong method
        self.assertEqual(r.status_code, 405)

    # ── submit / scoring / history ───────────────────────────────────────────
    def test_submit_scores_server_side_and_is_single_use(self):
        start = self._json(
            self.client.post("/api/quiz/start", json={"category": "python", "difficulty": "hard", "count": 4})
        )
        sid = start["session_id"]

        # Client-supplied score must be ignored.
        r = self.client.post("/api/quiz/submit", json={"session_id": sid, "answers": ["A"] * 4, "score": 9999})
        self.assertEqual(r.status_code, 200)
        res = self._json(r)
        self.assertEqual(res["total_questions"], 4)
        self.assertEqual(res["total_marks"], 12.0)  # hard mcq = 3 marks each
        self.assertEqual(res["correct_answers"] + res["wrong_answers"], 4)
        self.assertEqual(res["score"], res["correct_answers"] * 3.0)
        self.assertEqual(len(res["review"]), 4)
        self.assertEqual(
            set(res),
            {"category", "difficulty", "total_questions", "correct_answers", "wrong_answers",
             "score", "total_marks", "percentage", "review"},
        )
        self.assertIn("correct_answer", res["review"][0])

        # Replay is refused.
        r = self.client.post("/api/quiz/submit", json={"session_id": sid, "answers": ["A"] * 4})
        self.assertEqual(r.status_code, 404)

    def test_submit_answer_count_must_match(self):
        sid = self._json(
            self.client.post("/api/quiz/start", json={"category": "maths", "difficulty": "easy", "count": 3})
        )["session_id"]
        r = self.client.post("/api/quiz/submit", json={"session_id": sid, "answers": ["A"]})
        self.assertEqual(r.status_code, 400)

    def test_submit_unknown_session(self):
        r = self.client.post("/api/quiz/submit", json={"session_id": "nope", "answers": []})
        self.assertEqual(r.status_code, 404)

    def test_history_records_attempts(self):
        before = len(self._json(self.client.get("/api/history"))["history"])
        sid = self._json(
            self.client.post("/api/quiz/start", json={"category": "all", "difficulty": "mixed", "count": 2})
        )["session_id"]
        self.client.post("/api/quiz/submit", json={"session_id": sid, "answers": ["B", "C"]})
        hist = self._json(self.client.get("/api/history"))["history"]
        self.assertEqual(len(hist), before + 1)
        last = hist[-1]
        self.assertEqual(last["attempt"], len(hist))
        self.assertEqual(last["category"], "all")
        self.assertEqual(last["difficulty"], "mixed")
        self.assertEqual(
            set(last),
            {"attempt", "category", "difficulty", "total_questions", "correct_answers",
             "wrong_answers", "score", "total_marks", "percentage"},
        )
        # Written to the temp dir, not the repo.
        self.assertTrue((Path(_TMP) / "history.json").exists())

    # ── CORS / headers ───────────────────────────────────────────────────────
    def test_cors_allows_frontend_only(self):
        ok = self.client.get("/api/categories", headers={"Origin": "https://veyra.rf.gd"})
        self.assertEqual(ok.headers.get("Access-Control-Allow-Origin"), "https://veyra.rf.gd")
        other = self.client.get("/api/categories", headers={"Origin": "https://evil.example"})
        self.assertIsNone(other.headers.get("Access-Control-Allow-Origin"))
        pre = self.client.options(
            "/api/quiz/start",
            headers={
                "Origin": "https://veyra.rf.gd",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "Content-Type",
            },
        )
        self.assertEqual(pre.status_code, 200)
        self.assertIn("POST", pre.headers.get("Access-Control-Allow-Methods", ""))

    def test_security_headers(self):
        r = self.client.get("/api/health")
        self.assertEqual(r.headers["X-Content-Type-Options"], "nosniff")
        self.assertEqual(r.headers["Cache-Control"], "no-store")
        self.assertEqual(r.headers["X-Frame-Options"], "DENY")


if __name__ == "__main__":
    unittest.main(verbosity=2)
