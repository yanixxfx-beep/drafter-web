@echo off
echo ========================================
echo Copying TikTok Sans Fonts NOW
echo ========================================
echo.

REM Create fonts directory if it doesn't exist
if not exist "public\fonts" (
    echo Creating fonts directory...
    mkdir "public\fonts"
)

echo Copying from: D:\Saas\Drafter\assets\fonts\TikTok_Sans\static\
echo To: public\fonts\
echo.

REM Copy Medium font
echo Copying Medium font...
copy "D:\Saas\Drafter\assets\fonts\TikTok_Sans\static\TikTokSans_18pt_Medium.ttf" "public\fonts\TikTokSans-Medium.ttf"
if %errorlevel% equ 0 (
    echo ✓ TikTokSans-Medium.ttf copied successfully
) else (
    echo ✗ Failed to copy Medium font
)

echo.

REM Copy SemiBold font
echo Copying SemiBold font...
copy "D:\Saas\Drafter\assets\fonts\TikTok_Sans\static\TikTokSans_18pt_SemiBold.ttf" "public\fonts\TikTokSans-SemiBold.ttf"
if %errorlevel% equ 0 (
    echo ✓ TikTokSans-SemiBold.ttf copied successfully
) else (
    echo ✗ Failed to copy SemiBold font
)

echo.
echo ========================================
echo SUCCESS! TikTok Sans fonts loaded!
echo ========================================
echo.
echo The web app will now use the exact same fonts as Drafter MVP.
echo Restart your dev server (npm run dev) to see the changes.
echo.

REM Show what was copied
echo Files in public\fonts\:
dir "public\fonts\*.ttf"

echo.
pause
