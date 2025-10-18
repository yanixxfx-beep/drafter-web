@echo off
echo Setting up Drafter Web...
echo.

echo Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    echo Then run this script again.
    pause
    exit /b 1
)

echo Node.js found!
echo.

echo Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies!
    pause
    exit /b 1
)

echo.
echo Dependencies installed successfully!
echo.

echo Checking Rust installation...
rustc --version >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: Rust is not installed!
    echo To build the desktop app, you need Rust.
    echo Install it from https://rustup.rs/
    echo.
    echo For now, you can run the web version with: npm run dev
    echo.
) else (
    echo Rust found!
    echo.
    echo Installing Tauri CLI...
    call npm install -g @tauri-apps/cli
    if %errorlevel% neq 0 (
        echo WARNING: Failed to install Tauri CLI!
        echo You can still run the web version with: npm run dev
    ) else (
        echo Tauri CLI installed successfully!
    )
)

echo.
echo ========================================
echo Setup complete!
echo ========================================
echo.
echo Available commands:
echo   npm run dev          - Start web development server
echo   npm run build        - Build web version
echo   npm run tauri:dev    - Start desktop development (requires Rust)
echo   npm run tauri:build  - Build desktop app (requires Rust)
echo.
echo To start development:
echo   1. Run: npm run dev
echo   2. Open: http://localhost:3000
echo.
echo ========================================
echo Setting up TikTok Sans fonts...
echo ========================================
echo.

REM Create fonts directory if it doesn't exist
if not exist "public\fonts" (
    echo Creating fonts directory...
    mkdir "public\fonts"
)

REM Check if Drafter fonts exist in assets folder
if exist "D:\Saas\Drafter\assets\fonts\TikTok_Sans\static\TikTokSans_24pt-Regular.ttf" (
    echo Found Drafter fonts! Copying TikTok Sans...
    
    REM Create assets directory structure
    if not exist "public\assets\fonts\TikTok_Sans\static" (
        echo Creating assets directory structure...
        mkdir "public\assets\fonts\TikTok_Sans\static" /s
    )
    
    REM Copy the exact fonts used by Drafter MVP (24pt variants)
    copy "D:\Saas\Drafter\assets\fonts\TikTok_Sans\static\TikTokSans_24pt-Regular.ttf" "public\assets\fonts\TikTok_Sans\static\TikTokSans_24pt-Regular.ttf" >nul
    if %errorlevel% equ 0 (
        echo ✓ TikTokSans_24pt-Regular.ttf copied
    ) else (
        echo ✗ Failed to copy Regular font
    )
    
    copy "D:\Saas\Drafter\assets\fonts\TikTok_Sans\static\TikTokSans_24pt-Medium.ttf" "public\assets\fonts\TikTok_Sans\static\TikTokSans_24pt-Medium.ttf" >nul
    if %errorlevel% equ 0 (
        echo ✓ TikTokSans_24pt-Medium.ttf copied
    ) else (
        echo ✗ Failed to copy Medium font
    )
    
    copy "D:\Saas\Drafter\assets\fonts\TikTok_Sans\static\TikTokSans_24pt-SemiBold.ttf" "public\assets\fonts\TikTok_Sans\static\TikTokSans_24pt-SemiBold.ttf" >nul
    if %errorlevel% equ 0 (
        echo ✓ TikTokSans_24pt-SemiBold.ttf copied
    ) else (
        echo ✗ Failed to copy SemiBold font
    )
    
    echo.
    echo TikTok Sans fonts loaded successfully!
    echo The web app will now use the exact same fonts as Drafter MVP.
) else if exist "D:\TokMatic\fonts\TikTok_Sans\static\TikTokSans_18pt_Medium.ttf" (
    echo Found Drafter MVP fonts! Copying TikTok Sans...
    
    REM Copy the exact fonts used by Drafter MVP
    copy "D:\TokMatic\fonts\TikTok_Sans\static\TikTokSans_18pt_Medium.ttf" "public\fonts\TikTokSans-Medium.ttf" >nul
    if %errorlevel% equ 0 (
        echo ✓ TikTokSans-Medium.ttf copied
    ) else (
        echo ✗ Failed to copy Medium font
    )
    
    copy "D:\TokMatic\fonts\TikTok_Sans\static\TikTokSans_18pt_SemiBold.ttf" "public\fonts\TikTokSans-SemiBold.ttf" >nul
    if %errorlevel% equ 0 (
        echo ✓ TikTokSans-SemiBold.ttf copied
    ) else (
        echo ✗ Failed to copy SemiBold font
    )
    
    echo.
    echo TikTok Sans fonts loaded successfully!
    echo The web app will now use the exact same fonts as Drafter MVP.
) else (
    echo WARNING: Drafter fonts not found at:
    echo   D:\Saas\Drafter\assets\fonts\TikTok_Sans\static\
    echo   D:\TokMatic\fonts\TikTok_Sans\static\
    echo.
    echo The app will use system fonts instead.
    echo To get the exact TikTok Sans fonts:
    echo   1. Make sure Drafter fonts are in assets folder
    echo   2. Or download from: https://www.fontshare.com/fonts/tiktok
    echo   3. Place in: public\fonts\
)

echo.
pause
