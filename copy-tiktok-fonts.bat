@echo off
echo ========================================
echo Copying TikTok Sans Fonts from Drafter MVP
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
    echo.
    
    REM Create assets directory structure
    if not exist "public\assets\fonts\TikTok_Sans\static" (
        echo Creating assets directory structure...
        mkdir "public\assets\fonts\TikTok_Sans\static" /s
    )
    
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
    echo SUCCESS! TikTok Sans fonts loaded!
    echo ========================================
    echo.
    echo The web app will now use the exact same fonts as Drafter MVP.
    echo Fonts are now served from: /assets/fonts/TikTok_Sans/static/
    echo Restart your dev server (npm run dev) to see the changes.
    
) else if exist "D:\TokMatic\fonts\TikTok_Sans\static\TikTokSans_18pt_Medium.ttf" (
    echo Found Drafter MVP fonts! Copying TikTok Sans...
    echo.
    
    REM Copy Medium font
    echo Copying Medium font...
    copy "D:\TokMatic\fonts\TikTok_Sans\static\TikTokSans_18pt_Medium.ttf" "public\fonts\TikTokSans-Medium.ttf"
    if %errorlevel% equ 0 (
        echo ✓ TikTokSans-Medium.ttf copied successfully
    ) else (
        echo ✗ Failed to copy Medium font
    )
    
    echo.
    
    REM Copy SemiBold font
    echo Copying SemiBold font...
    copy "D:\TokMatic\fonts\TikTok_Sans\static\TikTokSans_18pt_SemiBold.ttf" "public\fonts\TikTokSans-SemiBold.ttf"
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
    
) else (
    echo ERROR: Drafter fonts not found!
    echo.
    echo Expected locations:
    echo   D:\Saas\Drafter\assets\fonts\TikTok_Sans\static\
    echo   D:\TokMatic\fonts\TikTok_Sans\static\
    echo.
    echo Please make sure:
    echo   1. Drafter fonts are in the assets folder
    echo   2. Or Drafter MVP is installed
    echo   3. Or download TikTok Sans from: https://www.fontshare.com/fonts/tiktok
    echo.
    echo If you have the fonts elsewhere, copy them manually to:
    echo   public\fonts\TikTokSans-Medium.ttf
    echo   public\fonts\TikTokSans-SemiBold.ttf
)

echo.
pause
