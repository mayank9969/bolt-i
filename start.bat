@echo off
setlocal
REM ── NEXUSQuiz one-click start (Windows) ─────────────────────────
cd /d "%~dp0"
title NEXUSQuiz
echo.
echo  NEXUSQuiz  -  starting from: %CD%
echo.

where python >nul 2>nul || (echo [X] Python not found. Install Python 3.10+ from python.org and tick "Add to PATH". & pause & exit /b 1)
where npm    >nul 2>nul || (echo [X] Node.js not found. Install Node.js LTS from nodejs.org. & pause & exit /b 1)

REM 1) Stop any OLD copy of NEXUSQuiz still holding port 5000 (a previous window left open).
echo  [1/4] Closing any old NEXUSQuiz server on port 5000...
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }" >nul 2>nul

REM 2) Dependencies
echo  [2/4] Installing dependencies (first run takes a few minutes)...
python -m pip install -q -r requirements.txt
if not exist node_modules\.package-lock.json call npm install --no-audit --no-fund
if errorlevel 1 (echo [X] npm install failed. Check your internet connection and run start.bat again. & pause & exit /b 1)

REM 3) Fresh build - the old build is deleted first so nothing stale can be served.
echo  [3/4] Building the NEW frontend (Paper theme, Living Knowledge Network)...
if exist dist rmdir /s /q dist
call npm run build
if not exist dist\index.html (echo. & echo [X] Build failed - the new design was NOT produced. Scroll up for the error and send it to me. & pause & exit /b 1)

REM 4) Serve
echo.
echo  ================================================
echo   NEXUSQuiz v2 (Paper) is live at:  http://localhost:5000
echo   If the page looks dark blue, press Ctrl+F5 in the browser.
echo  ================================================
echo.
echo  [4/4] Starting server (keep this window open; close it to stop)...
start "" "http://localhost:5000/?fresh=%RANDOM%"
rem Question bank is UTF-8 (contains symbols like pi, squared, curly quotes).
rem Windows Python defaults to cp1252, so force UTF-8 for this process only.
set PYTHONUTF8=1
python api\server.py
pause
