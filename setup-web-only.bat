@echo off
echo Setting up Drafter Web (Web-only version)...
echo.

echo Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ❌ Node.js is NOT installed!
    echo.
    echo Please install Node.js first:
    echo 1. Go to https://nodejs.org/
    echo 2. Download the LTS version
    echo 3. Run the installer
    echo 4. Make sure to check "Add to PATH"
    echo 5. Restart your computer
    echo.
    echo After installing Node.js, run this script again.
    echo.
    pause
    exit /b 1
)

echo ✅ Node.js found!
node --version
echo.

echo Using web-only package.json (no Tauri dependencies)...
copy package-web-only.json package.json
echo.

echo Installing dependencies...
npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies!
    echo Please check the error messages above.
    pause
    exit /b 1
)

echo.
echo ✅ Setup complete!
echo.
echo To start development:
echo   npm run dev
echo.
echo Then open: http://localhost:3000
echo.
echo Note: This is the web-only version.
echo To add desktop functionality later, install Rust and use the full setup.
echo.
pause


