@echo off
echo Starting Vibe...

start "Vibe Backend" cmd /k "cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

timeout /t 2 /nobreak >nul

start "Vibe Mobile" cmd /k "cd mobile && npx expo start"

echo Both started!
