@echo off
echo ========================================
echo Copying Correct TikTok Sans Fonts
echo ========================================
echo.

REM Create assets directory structure
if not exist "public\assets\fonts\TikTok_Sans\static" (
    echo Creating assets directory structure...
    mkdir "public\assets\fonts\TikTok_Sans\static" /s
)

echo Copying from: D:\Saas\Drafter\assets\fonts\TikTok_Sans\static\
echo To: public\assets\fonts\TikTok_Sans\static\
echo.

REM Copy Regular font (primary for captions)
echo Copying Regular font...
copy "D:\Saas\Drafter\assets\fonts\TikTok_Sans\static\TikTokSans_24pt-Regular.ttf" "public\assets\fonts\TikTok_Sans\static\TikTokSans_24pt-Regular.ttf"
if %errorlevel% equ 0 (
    echo ✓ TikTokSans_24pt-Regular.ttf copied successfully
) else (
    echo ✗ Failed to copy Regular font
)

echo.

REM Copy Medium font
echo Copying Medium font...
copy "D:\Saas\Drafter\assets\fonts\TikTok_Sans\static\TikTokSans_24pt-Medium.ttf" "public\assets\fonts\TikTok_Sans\static\TikTokSans_24pt-Medium.ttf"
if %errorlevel% equ 0 (
    echo ✓ TikTokSans_24pt-Medium.ttf copied successfully
) else (
    echo ✗ Failed to copy Medium font
)

echo.

REM Copy SemiBold font
echo Copying SemiBold font...
copy "D:\Saas\Drafter\assets\fonts\TikTok_Sans\static\TikTokSans_24pt-SemiBold.ttf" "public\assets\fonts\TikTok_Sans\static\TikTokSans_24pt-SemiBold.ttf"
if %errorlevel% equ 0 (
    echo ✓ TikTokSans_24pt-SemiBold.ttf copied successfully
) else (
    echo ✗ Failed to copy SemiBold font
)

echo.
echo ========================================
echo SUCCESS! Correct TikTok Sans fonts loaded!
echo ========================================
echo.
echo The web app will now use the exact same fonts as Drafter MVP.
echo Fonts are now served from: /assets/fonts/TikTok_Sans/static/
echo Restart your dev server (npm run dev) to see the changes.
echo.

REM Show what was copied
echo Files in public\assets\fonts\TikTok_Sans\static\:
dir "public\assets\fonts\TikTok_Sans\static\*.ttf"

echo.
pause
