@echo off
echo ============================
echo Estate Management System - Next.js
echo ============================

REM لو مجلد .next مش موجود -> اعمل build
IF NOT EXIST ".next" (
    echo No build found. Running build...
    call npm run build
)

echo Starting server...
start "" http://localhost:4000
call npm run start -- -p 4000

pause
