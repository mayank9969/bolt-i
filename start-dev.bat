@echo off
setlocal
cd /d "%~dp0"
title VEYRA dev
set PYTHONUTF8=1
set PYTHONIOENCODING=utf-8

if not exist .venv\Scripts\python.exe (
  echo Creating .venv ...
  python -m venv .venv
)
.\.venv\Scripts\python.exe -m pip install -q -r requirements.txt
if not exist node_modules call npm.cmd install --no-audit --no-fund

echo.
echo  Starting quiz engine on http://127.0.0.1:5000
start "VEYRA engine" cmd /k "cd /d "%~dp0" && set PYTHONUTF8=1 && .\.venv\Scripts\python.exe api\server.py"

timeout /t 2 /nobreak >nul

echo  Starting site on http://127.0.0.1:5174
echo  Keep BOTH windows open.
echo.
npm.cmd run dev -- --host 127.0.0.1 --port 5174
