@echo off
echo 🧹 Killing all Node.js processes...
taskkill /F /IM node.exe >nul 2>&1
echo ✅ All Node.js processes killed
echo.
echo ⏳ Waiting 3 seconds for cleanup...
timeout /t 3 /nobreak >nul
echo.
echo 🚀 Starting development server on port 3000...
cd /d "%~dp0"
set PORT=3000
npm run dev




