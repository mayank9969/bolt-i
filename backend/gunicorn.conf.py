"""
Gunicorn configuration for the VEYRA API on Render.

Quiz sessions live in the worker's memory, so the service MUST run a single
worker process.  Concurrency comes from threads instead, which share that
memory safely (all access is guarded by locks in app.py).
"""
import os

bind = f"0.0.0.0:{os.environ.get('PORT', '10000')}"  # Render injects PORT
workers = 1                                             # required: in-memory sessions
threads = int(os.environ.get("WEB_THREADS", "8"))
worker_class = "gthread"
timeout = 60
graceful_timeout = 30
keepalive = 5
accesslog = "-"          # request log to stdout (visible in Render logs)
errorlog = "-"
loglevel = os.environ.get("LOG_LEVEL", "info").lower()
forwarded_allow_ips = "*"  # trust Render's proxy for X-Forwarded-* headers
