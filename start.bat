@echo off
REM ── NEXUSQuiz one-click start (Windows) ─────────────────────────
cd /d "%~dp0"
echo.
echo  NEXUSQuiz - installing dependencies (first run only)...
echo.
where python >nul 2>nul || (echo Python not found. Install Python 3.10+ from python.org and tick "Add to PATH". & pause & exit /b 1)
where npm    >nul 2>nul || (echo Node.js not found. Install Node.js LTS from nodejs.org. & pause & exit /b 1)
python -m pip install -q -r requirements.txt
if not exist node_modules call npm install --no-audit --no-fund
echo.
echo  Building frontend...
call npm run build
echo.
echo  ================================================
echo   NEXUSQuiz is live at:  http://localhost:5000
echo  ================================================
echo.
start "" http://localhost:5000
python api\server.py
pause
