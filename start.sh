#!/usr/bin/env bash
# ── NEXUSQuiz one-command start (macOS / Linux) ─────────────────────
set -e
cd "$(dirname "$0")"
command -v python3 >/dev/null || { echo "Python 3 not found."; exit 1; }
command -v npm >/dev/null     || { echo "Node.js / npm not found."; exit 1; }
python3 -m pip install -q -r requirements.txt
[ -d node_modules ] || npm install --no-audit --no-fund
npm run build
echo
echo "  ================================================"
echo "   NEXUSQuiz is live at:  http://localhost:5000"
echo "  ================================================"
echo
python3 api/server.py
